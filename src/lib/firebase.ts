// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "bill-buddy-d89bn",
  appId: "1:78403245444:web:216550dd12ed2ab2f239d1",
  storageBucket: "bill-buddy-d89bn.firebasestorage.app",
  apiKey: "AIzaSyCx0dh17uk2nCtrJB__e9n3em6UmftH8UU",
  authDomain: "bill-buddy-d89bn.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "78403245444"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
