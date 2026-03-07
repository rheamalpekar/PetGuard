//File provided by firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUtn6j9Kj-TadIxnFzH61zfo3nKiz3ALg",
  authDomain: "cse5320-backend.firebaseapp.com",
  projectId: "cse5320-backend",
  storageBucket: "cse5320-backend.firebasestorage.app",
  messagingSenderId: "504986615274",
  appId: "1:504986615274:web:72318fa43105fcb6698693",
  measurementId: "G-PR9QQFTTPG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
