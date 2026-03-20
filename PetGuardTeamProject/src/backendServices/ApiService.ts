import { addDoc, collection, Timestamp, getDoc, doc } from "firebase/firestore";
import { db, auth } from "./firebase";
// import { ServiceRequest } from "../types/ServiceRequest";
import { InfoFormData } from "../../app/formscreens/info-form";

export const uploadPhoto = async (photoUrl: string): Promise<any> => {
  return "";
};

export const submitInfoForm = async (
  data: InfoFormData,
  photoUris: string[],
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // handling photo feature later
  const photoUrls: string[] = ["", ""];

  const docRef = await addDoc(collection(db, "infoForms"), {
    ...data,
    uid: user.uid,
    photos: photoUrls,
    createdAt: Timestamp.now(),
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
