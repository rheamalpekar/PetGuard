import * as FirebaseAuth from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  signOut,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { Timestamp, doc, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase";
import type { UserProfile } from "@/types/DataModels";

export const register = async (
  email: string,
  password: string,
  fullName: string,
  phoneNumber: UserProfile["phoneNumber"],
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

export const login = async (
  email: string,
  password: string,
  rememberMe: boolean,
) => {
  const getReactNativePersistence = (FirebaseAuth as any)
    .getReactNativePersistence as ((s: typeof AsyncStorage) => any) | undefined;

  if (Platform.OS === "web") {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    );
  } else {
    await setPersistence(
      auth,
      rememberMe && getReactNativePersistence
        ? getReactNativePersistence(AsyncStorage)
        : inMemoryPersistence,
    );
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};
