import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { Timestamp, doc, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

export const register = async (
  email: string,
  password: string,
  fullName: string,
  phoneNumber: number,
) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      fullName,
      phoneNumber,
      createdAt: Timestamp.now(),
    });
    return cred.user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};
