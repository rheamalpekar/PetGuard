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
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "./firebase";
// import { ServiceRequest } from "../types/ServiceRequest";
import { InfoFormData } from "../../app/formscreens/info-form";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

let isSyncing = false;

type UploadablePhoto = string | Blob | File;

const INFO_FORM_QUEUE_KEY = "petguard:infoFormQueue:v1";

type QueuedInfoForm = {
  localId: string;
  uid: string;
  data: InfoFormData;
  photoUris: string[];
  createdAt: number;
  retryCount: number;
};

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
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const docRef = await addDoc(collection(db, "infoForms"), {
    ...data,
    formId: "",
    uid: user.uid,
    photos: [],
    status: "pending",
    createdAt: Timestamp.now(),
  });
  const formId = docRef.id;

  const photoUrls = await Promise.all(
    photos.map((photo) => uploadImage(photo, formId)),
  );

  await updateDoc(doc(db, "infoForms", formId), {
    formId,
    photos: photoUrls,
  });

  return { success: true, formId: docRef.id };
};

// temporary for Venkata's screen testing. submitInfoForm should be the only endpoint at the end
export const addEmergencyReport = async (reportData: {
  type: string;
  severity: string;
  description: string;
  location?: string;
}) => {
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

export const getInfoFormDataById = async (formId: string): Promise<any> => {
  if (!formId) throw new Error("No form id provided");
  const formDocRef = doc(db, "infoForms", formId);
  const docResult = await getDoc(formDocRef);
  if (!docResult.exists()) throw new Error("Info form not found");
  return docResult.data();
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
        await submitInfoForm(item.data, item.photoUris);

        queue = queue.filter((q) => q.localId !== item.localId);
        await saveQueuedInfoForms(queue);

        console.log("Synced:", item.localId);
      } catch (err) {
        console.log("Still failed:", item.localId, err);
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
