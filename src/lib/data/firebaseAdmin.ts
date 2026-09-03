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
//   - SERVICE_ACCOUNT_KEY : the full service-account JSON, as a single-line
//     string (see .env.example). This is the name App Hosting exposes the
//     secret under — Firebase reserves the "FIREBASE_" env-var prefix, so the
//     variable can't be called FIREBASE_SERVICE_ACCOUNT_KEY even though the
//     Secret Manager secret is named that. (The old name is still accepted as
//     a fallback for existing local setups.) OR
//   - GOOGLE_APPLICATION_CREDENTIALS : a path to the key file (Application
//     Default Credentials — the default on Google Cloud / Firebase hosting).

import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let cachedDb: Firestore | null = null;
const cachedSportDbs = new Map<string, Firestore>();

function initApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const rawKey = process.env.SERVICE_ACCOUNT_KEY ?? process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey) {
    let creds: { project_id?: string };
    try {
      creds = JSON.parse(rawKey);
    } catch {
      throw new Error(
        'SERVICE_ACCOUNT_KEY is set but is not valid JSON. Paste the full ' +
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

/**
 * Firestore handle for THIS app's own data (config, settings, pages, posts).
 *
 * If APP_FIRESTORE_DB is set, that names a dedicated database for this app —
 * kept separate from the Match Pulse core's (default) database so the two never
 * collide — reached with Application Default Credentials (no key needed on App
 * Hosting). Otherwise it falls back to the project's (default) database, which
 * only makes sense when a dedicated service-account key points at a store of
 * this app's own.
 */
export function getDb(): Firestore {
  if (cachedDb) return cachedDb;
  const appDbId = process.env.APP_FIRESTORE_DB;
  cachedDb = appDbId ? getFirestore(initApp(), appDbId) : getFirestore(initApp());
  return cachedDb;
}

/**
 * Firestore handle for a NAMED database in the same project — one per Match
 * Pulse sport (e.g. 'rugby'). The ranking system reads these read-only. Works
 * automatically on App Hosting inside match-pulse-4560e (Application Default
 * Credentials); locally it needs SERVICE_ACCOUNT_KEY / GOOGLE_APPLICATION_CREDENTIALS.
 */
export function getSportDb(sportKey: string): Firestore {
  const cached = cachedSportDbs.get(sportKey);
  if (cached) return cached;
  const db = getFirestore(initApp(), sportKey);
  cachedSportDbs.set(sportKey, db);
  return db;
}
