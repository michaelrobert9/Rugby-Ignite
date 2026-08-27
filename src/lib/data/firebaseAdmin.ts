// Firebase Admin SDK initialization (server-side only).
//
// This is the single point where the app authenticates to the shared
// "Match Pulse" Firestore project. Because every read/write in this app
// happens on the server (server components + server actions), we use the
// Admin SDK, which authenticates with a *service-account key* — not the
// public web config. The Admin SDK bypasses Firestore Security Rules, so the
// rules can (and do) deny all client access; see firestore.rules.
//
// Credentials are read from the environment, never committed:
//   - FIREBASE_SERVICE_ACCOUNT_KEY : the full service-account JSON, as a
//     single-line string (see .env.example), OR
//   - GOOGLE_APPLICATION_CREDENTIALS : a path to the key file (Application
//     Default Credentials — the default on Google Cloud / Firebase hosting).

import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let cachedDb: Firestore | null = null;

function initApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey) {
    let creds: { project_id?: string };
    try {
      creds = JSON.parse(rawKey);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON. Paste the full ' +
          'service-account key JSON (wrapped in single quotes in .env.local).',
      );
    }
    return initializeApp({
      credential: cert(creds as Parameters<typeof cert>[0]),
      projectId: creds.project_id,
    });
  }

  // Fall back to Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS
  // or the ambient identity when deployed on Google Cloud).
  return initializeApp({ credential: applicationDefault() });
}

/** Lazily-initialized Firestore handle. */
export function getDb(): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(initApp());
  return cachedDb;
}
