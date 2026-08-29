// In-memory "demo" data backend, used when no Firebase credentials are set.
//
// It lets `npm run dev` (or any preview) run the full site with the bundled
// historical seed data — no Firebase, no keys, nothing to set up. Reads come
// from the seed files; the rankings are computed on the fly with the real
// ranking engine; writes (admin edits, rebuild) update the in-memory copy for
// the life of the process only — they are NOT persisted.
//
// store.ts chooses this backend automatically when Firebase credentials are
// absent, and the Firestore backend (firestoreStore.ts) when they are present.

import type { WhereFilterOp } from 'firebase-admin/firestore';
import { runFullRecalculation } from '../rankingEngine';
import type { Match, RankingConfig, Team, TeamRating } from '../types';
import teamsSeed from '../../data/seed/teams.json';
import venuesSeed from '../../data/seed/venues.json';
import matchesSeed from '../../data/seed/matches.json';
import configSeed from '../../data/seed/config.json';
import { DEFAULT_PAGES } from './defaultPages';

type Row = Record<string, unknown>;

// Single in-memory store for the whole process.
const store: Record<string, unknown> = {};
let seeded = false;
let ranked = false;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function ensureSeeded(): void {
  if (seeded) return;
  store.teams = clone(teamsSeed) as unknown as Team[];
  store.venues = clone(venuesSeed);
  store.matches = clone(matchesSeed) as unknown as Match[];
  store.config = clone(configSeed) as unknown as RankingConfig;
  store.pages = clone(DEFAULT_PAGES);
  seeded = true;
}

// Compute rankings/matchRatings/meta from the current teams/matches/config,
// so ranking pages show data without an explicit "Rebuild" click.
function ensureRanked(): void {
  ensureSeeded();
  if (ranked) return;

  const matches = store.matches as Match[];
  const teams = store.teams as Team[];
  const config = store.config as RankingConfig;
  const { teamRatings, matchRatings } = runFullRecalculation(matches, teams, config, new Date());

  const rankings: Record<string, TeamRating[]> = {};
  for (const [scope, teamMap] of teamRatings) {
    rankings[scope] = Array.from(teamMap.values());
  }
  store.rankings = rankings;
  store.matchRatings = matchRatings;
  store.meta = {
    lastRebuiltAt: new Date().toISOString(),
    matchesConsidered: matches.filter((m) => m.rankingEligible && m.status === 'played').length,
    teamsRanked: teamRatings.get('master')?.size ?? 0,
    scopes: Array.from(teamRatings.keys()),
  };
  ranked = true;
}

const COMPUTED = new Set(['rankings', 'matchRatings', 'meta']);

export async function readCollection<T>(name: string): Promise<T> {
  ensureSeeded();
  if (COMPUTED.has(name)) ensureRanked();

  const value = store[name];
  if (value === undefined) {
    if (name === 'config') throw new Error("No 'config' in demo store.");
    return [] as unknown as T;
  }
  return clone(value) as T;
}

export async function writeCollection<T>(name: string, data: T): Promise<void> {
  ensureSeeded();
  store[name] = clone(data);
  // A rebuild writes these directly; changing source data invalidates them.
  if (!COMPUTED.has(name)) ranked = false;
}

export async function getItem<T>(name: string, id: string): Promise<T | undefined> {
  const arr = (await readCollection<Row[]>(name)) ?? [];
  return arr.find((r) => String(r.id) === id) as T | undefined;
}

export async function setItem<T>(name: string, id: string, data: T): Promise<void> {
  ensureSeeded();
  const arr = (store[name] as Row[]) ?? [];
  const idx = arr.findIndex((r) => String(r.id) === id);
  if (idx === -1) arr.push(data as Row);
  else arr[idx] = data as Row;
  store[name] = arr;
  ranked = false;
}

export async function deleteItem(name: string, id: string): Promise<void> {
  ensureSeeded();
  store[name] = ((store[name] as Row[]) ?? []).filter((r) => String(r.id) !== id);
  ranked = false;
}

export async function queryItems<T>(
  name: string,
  field: string,
  op: WhereFilterOp,
  value: unknown,
): Promise<T[]> {
  const arr = (await readCollection<Row[]>(name)) ?? [];
  return arr.filter((r) => (op === '==' ? r[field] === value : false)) as T[];
}
