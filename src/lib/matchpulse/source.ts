// Read-only data source for the ranking system.
//
// For LIVE_SPORTS we read the sport's named Firestore database (read-only) via
// liveSource. Everything else — and any sport whose live read fails or has no
// results yet — falls back to Match Pulse–shaped sample data so the page is
// never empty in development. Set MP_FORCE_SAMPLE=1 to force sample everywhere.
//
// On App Hosting inside match-pulse-4560e the live read works automatically
// (Application Default Credentials). Locally it needs SERVICE_ACCOUNT_KEY or
// GOOGLE_APPLICATION_CREDENTIALS; without them it quietly uses sample data.

import type { SportDef, SportKey } from './types';
import { SAMPLE_MATCHES, SAMPLE_ORGS, SAMPLE_TEAMS } from './sampleData';
import { loadSportLive, type SportData } from './liveSource';

const SPORTS: SportDef[] = [
  { key: 'rugby', name: 'Rugby', scoreUnit: 'points', rankingsEnabled: true },
  { key: 'hockey', name: 'Hockey', scoreUnit: 'goals', rankingsEnabled: true },
  { key: 'waterpolo', name: 'Water Polo', scoreUnit: 'goals', rankingsEnabled: false },
  { key: 'netball', name: 'Netball', scoreUnit: 'goals', rankingsEnabled: false },
];

// Sports we attempt to read live (the rest use sample data for now).
const LIVE_SPORTS = new Set<SportKey>(['rugby']);
const FORCE_SAMPLE = process.env.MP_FORCE_SAMPLE === '1';

export async function listSports(): Promise<SportDef[]> {
  return SPORTS;
}

export async function rankedSports(): Promise<SportDef[]> {
  return SPORTS.filter((s) => s.rankingsEnabled);
}

export async function getSport(key: string): Promise<SportDef | undefined> {
  return SPORTS.find((s) => s.key === key);
}

function sampleData(sport: SportKey): SportData {
  return { matches: SAMPLE_MATCHES[sport] ?? [], orgs: SAMPLE_ORGS, teams: SAMPLE_TEAMS };
}

/** Load all data for one sport, plus whether it came from the live database. */
export async function loadSportData(sport: SportKey): Promise<SportData & { live: boolean }> {
  if (!FORCE_SAMPLE && LIVE_SPORTS.has(sport)) {
    try {
      const data = await loadSportLive(sport);
      if (data.matches.length) return { ...data, live: true };
      // Connected but no finalised results yet — fall through to sample.
    } catch (err) {
      console.warn(`[rankings] live read for "${sport}" failed; using sample data:`, (err as Error).message);
    }
  }
  return { ...sampleData(sport), live: false };
}
