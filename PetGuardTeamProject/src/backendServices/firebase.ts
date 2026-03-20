//File provided by firebase

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export const auth = getAuth(app);
export const db = getFirestore(app);
