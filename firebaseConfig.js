import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);