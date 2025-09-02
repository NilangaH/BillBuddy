// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "REDACTED",
    authDomain: "b-b-bill-buddy-prod-3-431613.firebaseapp.com",
    projectId: "b-b-bill-buddy-prod-3-431613",
    storageBucket: "b-b-bill-buddy-prod-3-431613.appspot.com",
    messagingSenderId: "931383543596",
    appId: "1:931383543596:web:109501509121a97d394a50",
    measurementId: "G-WVH1GEJ669"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
