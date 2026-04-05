import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const { getReactNativePersistence } = require("firebase/auth");
const firebaseConfig = {
  apiKey: "AIzaSyAUtn6j9Kj-TadIxnFzH61zfo3nKiz3ALg",
  authDomain: "cse5320-backend.firebaseapp.com",
  projectId: "cse5320-backend",
  storageBucket: "cse5320-backend.firebasestorage.app",
  messagingSenderId: "504986615274",
  appId: "1:504986615274:web:72318fa43105fcb6698693",
  measurementId: "G-PR9QQFTTPG",
};

const app = initializeApp(firebaseConfig);

export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
