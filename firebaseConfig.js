import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {getFirestore} from "firebase/firestore";

// KEIN React Native Auth-Modul mehr!

const firebaseConfig = {
    apiKey: "AIzaSyA1bXkBz6SAgTd8fxMJvr_7Bq3SB15BTJ0",
    authDomain: "wards-backend.firebaseapp.com",
    projectId: "wards-backend",
    storageBucket: "wards-backend.appspot.com",
    messagingSenderId: "438071585715",
    appId: "1:438071585715:web:0eb203d3a18ad77d74f9c6",
    measurementId: "G-NCSXKYN256"
};

// Initialize Firebase only if it hasn't been initialized yet
// This prevents the "app already exists" error in development
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;