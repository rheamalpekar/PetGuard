import {
  addDoc,
  collection,
  Timestamp,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth, storage } from "./firebase";
import { ServiceRequest } from "../types/ServiceRequest";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { InfoFormData } from "../../app/(tabs)/info-form";

export const uploadPhoto = async (uri: string): Promise<string> => {
  if (!uri) {
    throw new Error("Invalid photo URI");
  }

  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `requests/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

export const submitRequest = async (
  data: Omit<ServiceRequest, "uid" | "createdAt" | "status">,
  photoUris: string[],
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const photoUrls: string[] = [];

  for (const uri of photoUris) {
    const url = await uploadPhoto(uri);
    photoUrls.push(url);
  }

  const docRef = await addDoc(collection(db, "requests"), {
    ...data,
    uid: user.uid,
    photos: photoUrls,
    status: "pending",
    createdAt: Timestamp.now(),
  });

  return { success: true, requestId: docRef.id };
};

export const submitInfoForm = async (
  data: InfoFormData,
  photoUris: string[],
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const photoUrls: string[] = [];

  for (const uri of photoUris) {
    const url = await uploadPhoto(uri);
    photoUrls.push(url);
  }

  const docRef = await addDoc(collection(db, "infoForms"), {
    ...data,
    uid: user.uid,
    photos: photoUrls,
    createdAt: Timestamp.now(),
  });

  return { success: true, formId: docRef.id };
};

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

  console.log("Submitting emergency report to Firebase:", reportData);
  const reportRef = await addDoc(collection(db, "emergencyReports"), {
    ...reportData,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });
  console.log("Emergency report submitted successfully with ID:", reportRef.id);

  return { success: true, id: reportRef.id };
};
