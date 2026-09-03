// Data store entry point.
//
// The rest of the app (teams.ts, venues.ts, matches.ts, rankings.ts,
// config.ts) imports everything from here and never cares where the data
// actually lives. This file just picks the backend:
//
//   - Firebase credentials present  -> Firestore (firestoreStore.ts)   [production]
//   - no credentials                -> in-memory demo data (localStore.ts)
//
// So `npm run dev` with no key "just works" against the bundled historical
// seed data — handy for checking the design — while the deployed app talks to
// the real Match Pulse Firestore project.

import type { WhereFilterOp } from 'firebase-admin/firestore';
import * as firestore from './firestoreStore';
import * as local from './localStore';

/**
 * True when no persistent store is configured — use the in-memory demo backend.
 *
 * Persistence turns on when EITHER an explicit service-account key is set, OR
 * APP_FIRESTORE_DB names a dedicated Firestore database for this app's own data
 * (config, settings, pages, posts). The named-database option needs no key —
 * it uses Application Default Credentials, exactly like the live sport reads —
 * and is routed to its own database so it never touches the Match Pulse core's
 * (default) database. Without either, edits are in-memory only and reset on
 * restart (fine for a zero-setup preview, but settings won't stick).
 */
export function isDemoMode(): boolean {
  return !(
    process.env.SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.APP_FIRESTORE_DB
  );
}

function backend() {
  return isDemoMode() ? local : firestore;
}

export function readCollection<T>(name: string): Promise<T> {
  return backend().readCollection<T>(name);
}

export function writeCollection<T>(name: string, data: T): Promise<void> {
  return backend().writeCollection<T>(name, data);
}

export function getItem<T>(name: string, id: string): Promise<T | undefined> {
  return backend().getItem<T>(name, id);
}

export function setItem<T>(name: string, id: string, data: T): Promise<void> {
  return backend().setItem<T>(name, id, data);
}

export function deleteItem(name: string, id: string): Promise<void> {
  return backend().deleteItem(name, id);
}

export function queryItems<T>(
  name: string,
  field: string,
  op: WhereFilterOp,
  value: unknown,
): Promise<T[]> {
  return backend().queryItems<T>(name, field, op, value);
}
