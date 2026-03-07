import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";

import {
  addDoc,
  collection,
  Timestamp,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { auth, db, storage } from "./firebase";

export const register = async (
  email: string,
  password: string,
  fullName: string,
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(cred.user, { displayName: fullName });

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    fullName,
    createdAt: Timestamp.now(),
  });

  return cred.user;
};

export const login = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const logout = async () => {
  await signOut(auth);
};
