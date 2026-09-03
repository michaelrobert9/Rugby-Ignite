// Read-only data source for the ranking system.
//
// TODAY: serves Match Pulse–shaped SAMPLE data so the whole system is visible
// and testable without touching the live platform.
//
// LIVE (drop-in): each sport is its own named Firestore database in the shared
// `match-pulse-4560e` project. To read live, initialise firebase-admin against
// that project and open each sport's DB with getFirestore(app, sport), then map
// its `matches` (status === 'final'), `organizations` and `teams` into the
// MP* shapes below. Everything downstream (engine, pages) is unchanged. Reads
// only — this system never writes to Match Pulse.

import type { MPMatch, MPOrg, MPTeam, SportDef, SportKey } from './types';
import { SAMPLE_MATCHES, SAMPLE_ORGS, SAMPLE_TEAMS } from './sampleData';

// Per-sport ranking enablement (the admin on/off). In the live platform this is
// stored in config; here it defaults on for the two sports that have data.
const SPORTS: SportDef[] = [
  { key: 'rugby', name: 'Rugby', scoreUnit: 'points', rankingsEnabled: true },
  { key: 'hockey', name: 'Hockey', scoreUnit: 'goals', rankingsEnabled: true },
  { key: 'waterpolo', name: 'Water Polo', scoreUnit: 'goals', rankingsEnabled: false },
  { key: 'netball', name: 'Netball', scoreUnit: 'goals', rankingsEnabled: false },
];

export async function listSports(): Promise<SportDef[]> {
  return SPORTS;
}

export async function getSport(key: string): Promise<SportDef | undefined> {
  return SPORTS.find((s) => s.key === key);
}

/** Sports that currently have rankings switched on. */
export async function rankedSports(): Promise<SportDef[]> {
  return SPORTS.filter((s) => s.rankingsEnabled);
}

export async function getMatches(sport: SportKey): Promise<MPMatch[]> {
  return SAMPLE_MATCHES[sport] ?? [];
}

export async function listAgeGroups(sport: SportKey): Promise<string[]> {
  const ages = new Set((SAMPLE_MATCHES[sport] ?? []).map((m) => m.ageGroup));
  return Array.from(ages).sort();
}

export async function listSeasons(sport: SportKey): Promise<string[]> {
  const seasons = new Set((SAMPLE_MATCHES[sport] ?? []).map((m) => m.season));
  return Array.from(seasons).sort();
}

/** Org and team lookups for labelling ladders. */
export async function getOrgs(): Promise<MPOrg[]> {
  return SAMPLE_ORGS;
}

export async function getTeams(): Promise<MPTeam[]> {
  return SAMPLE_TEAMS;
}
