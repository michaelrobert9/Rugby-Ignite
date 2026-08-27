// ---------------------------------------------------------------------------
// Firebase setup for Rugby-Ignite
// ---------------------------------------------------------------------------
// This is the ONE place your Firebase project is connected to the app.
// Everything else (Firestore, Auth, etc.) is imported from here.
//
// The config values below are read from environment variables (the VITE_
// prefixed ones in your .env file). See .env.example for the values, and the
// README for how to set them up.
//
// NOTE: These values are NOT secret. Firebase web config (including the API
// key) is designed to be shipped in client-side code — it only identifies
// your project. Real security is enforced by Firestore Security Rules, not by
// hiding these values. See: https://firebase.google.com/docs/projects/api-keys
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase once and reuse everywhere.
const app = initializeApp(firebaseConfig);

// Firestore database — import { db } wherever you read/write data.
export const db = getFirestore(app);

// Authentication — import { auth } for sign-in/sign-out.
export const auth = getAuth(app);

// Analytics only runs in a browser that supports it (guarded so it doesn't
// throw during builds, tests, or server-side rendering).
export const analyticsPromise = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);

export default app;
