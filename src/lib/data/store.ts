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

/** True when no Firebase credential is configured — use the demo backend. */
function isDemoMode(): boolean {
  return !(
    process.env.SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
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
