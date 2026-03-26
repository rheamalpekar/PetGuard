import {
  addDoc,
  collection,
  Timestamp,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
// import { ServiceRequest } from "../types/ServiceRequest";
import { InfoFormData } from "../../app/formscreens/info-form";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

type UploadablePhoto = string | Blob | File;

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
    const response = await fetch(photo);
    blob = await response.blob();
  }

  const filename = `infoForms/${user.uid}/${formId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

export const logoutUser = async (): Promise<void> => {
  const { signOut } = await import("firebase/auth");
  console.log("Backend: logging out user..");
  await signOut(auth);
  console.log("Backend: user logged out successfully");
};
