'use client';

// Firebase Web SDK for the browser — used ONLY by the admin login page to sign
// the admin in against the shared Match Pulse project (same project, so it's the
// same account). These NEXT_PUBLIC_* values are the public web config (safe to
// expose); authDomain/projectId default to the Match Pulse project.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'match-pulse-4560e.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'match-pulse-4560e',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when the web config is present, so the login page can sign in. */
export function firebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.appId);
}

export function getClientAuth(): Auth {
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}
