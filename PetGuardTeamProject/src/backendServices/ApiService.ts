import {
  addDoc,
  collection,
  Timestamp,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "./firebase";
import type {
  EmergencyReportData,
  InfoFormData,
  QueuedInfoForm,
  ServiceRequest,
  UploadablePhoto,
  UserProfile,
  UserProfileUpdate,
} from "@/types/DataModels";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import {
  RATE_LIMIT_BUCKETS,
  RATE_LIMIT_WINDOW_MS,
  throwIfRateLimited,
} from "./RateLimiter";

let isSyncing = false;

const INFO_FORM_QUEUE_KEY = "petguard:infoFormQueue:v1";

export const loadQueuedInfoForms = async (): Promise<QueuedInfoForm[]> => {
  const raw = await AsyncStorage.getItem(INFO_FORM_QUEUE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as QueuedInfoForm[];
  } catch {
    return [];
  }
};

export const saveQueuedInfoForms = async (
  queue: QueuedInfoForm[],
): Promise<void> => {
  await AsyncStorage.setItem(INFO_FORM_QUEUE_KEY, JSON.stringify(queue));
};

export const enqueueInfoForm = async (
  item: QueuedInfoForm,
): Promise<QueuedInfoForm[]> => {
  const queue = await loadQueuedInfoForms();
  const updatedQueue = [...queue, item];
  await saveQueuedInfoForms(updatedQueue);
  return updatedQueue;
};

export const submitInfoForm = async (
  data: InfoFormData,
  photos: UploadablePhoto[],
  options: { skipRateLimit?: boolean } = {},
) => {
  console.log("submitInfoForm called");

  if (!options.skipRateLimit) {
    await throwIfRateLimited({
      key: RATE_LIMIT_BUCKETS.infoFormSubmit,
      maxAttempts: 1,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });
  }

  const user = auth.currentUser;

  if (!user) {
    console.log("no authenticated user, exiting");
    throw new Error("Not authenticated");
  }

  console.log("user exists:", user.uid);

  try {
    const docRef = await addDoc(collection(db, "infoForms"), {
      ...data,
      formId: "",
      uid: user.uid,
      photos: [],
      status: "pending",
      createdAt: Timestamp.now(),
    });

    console.log("firestore doc created:", docRef.id);

    const formId = docRef.id;

    const photoUrls = await Promise.all(
      photos.map((photo) => uploadImage(photo, formId)),
    );

    console.log("photos uploaded:", photoUrls.length);

    await updateDoc(doc(db, "infoForms", formId), {
      formId,
      photos: photoUrls,
    });

    console.log("document updated with photos");

    return { success: true, formId };
  } catch (err) {
    console.log("submit failed:", err);
    throw err;
  }
};

// temporary for Venkata's screen testing. submitInfoForm should be the only endpoint at the end
export const addEmergencyReport = async (reportData: EmergencyReportData) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  const reportRef = await addDoc(collection(db, "emergencyReports"), {
    ...reportData,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });

  return { success: true, id: reportRef.id };
};

export const getInfoFormDataById = async (
  formId: string,
): Promise<InfoFormData> => {
  if (!formId) throw new Error("No form id provided");
  const formDocRef = doc(db, "infoForms", formId);
  const docResult = await getDoc(formDocRef);
  if (!docResult.exists()) throw new Error("Info form not found");
  return docResult.data() as InfoFormData;
};

export const uploadImage = async (
  photo: UploadablePhoto,
  formId: string,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (!formId) throw new Error("Missing formId for upload");

  if (typeof photo === "string" && photo.startsWith("https://")) {
    return photo;
  }

  let blob: Blob;
  if (typeof File !== "undefined" && photo instanceof File) {
    blob = photo;
  } else if (photo instanceof Blob) {
    blob = photo;
  } else {
    blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError("Image fetch failed"));
      xhr.responseType = "blob";
      xhr.open("GET", photo as string, true);
      xhr.send(null);
    });
  }

  const filename = `infoForms/${user.uid}/${formId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
  // return "";
};

export const syncQueuedInfoForms = async (): Promise<void> => {
  if (isSyncing) {
    console.log("Sync already running so skipping");
    return;
  }

  isSyncing = true;

  const user = auth.currentUser;
  if (!user) {
    isSyncing = false;
    return;
  }

  try {
    let queue = await loadQueuedInfoForms();

    for (const item of queue) {
      try {
        queue = queue.filter((q) => q.localId !== item.localId);
        await saveQueuedInfoForms(queue);

        await submitInfoForm(item.data, item.photoUris, { skipRateLimit: true });

        console.log("Synced:", item.localId);
      } catch (err) {
        console.log("Still failed:", item.localId, err);
        queue = await loadQueuedInfoForms();
        queue.push(item);
        await saveQueuedInfoForms(queue);
      }
    }
  } finally {
    isSyncing = false;
  }
};

export const logoutUser = async (): Promise<void> => {
  const { signOut } = await import("firebase/auth");
  console.log("Backend: logging out user..");
  await signOut(auth);
  console.log("Backend: user logged out successfully");
};

export const subscribeToActiveReports = (
  uid: string,
  callback: (count: number) => void,
) => {
  const q = query(
    collection(db, "infoForms"),
    where("uid", "==", uid),
    where("status", "in", ["pending"]),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile> => {
  if (!uid) throw new Error("Missing uid");

  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) throw new Error("User not found");

  return snapshot.data() as UserProfile;
};

export const updateUserProfile = async (
  uid: string,
  updates: UserProfileUpdate,
) => {
  if (!uid) throw new Error("Missing uid");

  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });

  return { success: true };
};

export const getUserRequests = async (uid: string): Promise<ServiceRequest[]> => {
  if (!uid) throw new Error("Missing uid");

  const q = query(collection(db, "infoForms"), where("uid", "==", uid));

  return new Promise<ServiceRequest[]>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ServiceRequest[];
        resolve(results);
        unsubscribe();
      },
      reject,
    );
  });
};

export const deleteUserAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const uid = user.uid;

  try {
    await user.delete();

    await deleteDoc(doc(db, "users", uid));

    const q = query(collection(db, "infoForms"), where("uid", "==", uid));

    const snapshot = await new Promise<any>((resolve) => {
      const unsub = onSnapshot(q, (snap) => {
        resolve(snap);
        unsub();
      });
    });

    await Promise.all(
      snapshot.docs.map((d: any) => deleteDoc(doc(db, "infoForms", d.id))),
    );

    return { success: true };
  } catch (e: any) {
    console.log("DELETE ERROR:", e);

    if (e.code === "auth/requires-recent-login") {
      throw new Error(
        "Please log out and log back in before deleting account.",
      );
    }

    throw e;
  }
};
