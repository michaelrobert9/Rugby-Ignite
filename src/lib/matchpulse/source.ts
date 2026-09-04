// Read-only data source for the ranking system. LIVE ONLY — no sample data.
//
// Reads each sport's named Firestore database (read-only) via liveSource. On
// App Hosting inside match-pulse-4560e this works automatically (Application
// Default Credentials); locally it needs SERVICE_ACCOUNT_KEY /
// GOOGLE_APPLICATION_CREDENTIALS, and without them a sport simply has no data
// (the page shows an empty state) rather than any fabricated stand-in.

import type { SportDef, SportKey } from './types';
import { loadSportLive, type SportData } from './liveSource';

// Rugby Ignite is a rugby-only site (its own brand and revenue model, separate
// from Match Pulse). Only rugby is configured here.
const SPORTS: SportDef[] = [
  { key: 'rugby', name: 'Rugby', scoreUnit: 'points', rankingsEnabled: true },
];

export async function listSports(): Promise<SportDef[]> {
  return SPORTS;
}

export async function rankedSports(): Promise<SportDef[]> {
  return SPORTS.filter((s) => s.rankingsEnabled);
}

export async function getSport(key: string): Promise<SportDef | undefined> {
  return SPORTS.find((s) => s.key === key);
}

/** Load all finalised results + school names for one sport, read-only. */
export async function loadSportData(sport: SportKey): Promise<SportData> {
  try {
    return await loadSportLive(sport);
  } catch (err) {
    console.warn(`[rankings] live read for "${sport}" failed:`, (err as Error).message);
    return { matches: [], orgs: [], lastUpdated: null };
  }
}
