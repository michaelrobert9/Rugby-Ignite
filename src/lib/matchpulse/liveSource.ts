// Live, READ-ONLY reader for Match Pulse sport data.
//
// Each sport is a named Firestore database in match-pulse-4560e. We open it with
// the Admin SDK (getSportDb) and read finalised `matches`. School names are
// denormalised onto each match (homeOrgName / awayOrgName), so ladders build
// straight from `matches` — no reads of `organizations`/`teams`.
//
// This module NEVER writes. Server-side only.

import { getSportDb } from '../data/firebaseAdmin';
import type { MPMatch, MPOrg, SportKey } from './types';

export interface SportData {
  matches: MPMatch[];
  orgs: MPOrg[];
}

// Firestore Timestamp | Date | number | 'YYYY-MM-DD' -> 'YYYY-MM-DD'.
function toDateStr(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10);
  const maybe = v as { toDate?: () => Date };
  if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString().slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return null;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Read finalised results for one sport. `ageGroup` is fixed to '1st' for now —
 * only 1st-team rugby data exists live. When age sides arrive, derive the group
 * from each team's level/ageGroup (a join against the `teams` collection).
 */
export async function loadSportLive(sport: SportKey): Promise<SportData> {
  const db = getSportDb(sport);
  const snap = await db.collection('matches').where('status', '==', 'final').get();

  const matches: MPMatch[] = [];
  const orgs = new Map<string, string>();

  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const homeOrgId = (d.homeOrgId as string) || '';
    const awayOrgId = (d.awayOrgId as string) || '';
    if (!homeOrgId || !awayOrgId) continue; // need two identified schools to rank

    const date = toDateStr(d.matchDate) ?? toDateStr(d.scheduledAt);
    if (!date) continue; // undated finals can't be replayed chronologically
    const season = d.season ? String(d.season) : date.slice(0, 4);

    matches.push({
      id: doc.id,
      sport,
      ageGroup: '1st',
      season,
      date,
      homeOrgId,
      awayOrgId,
      homeScore: num(d.homeScore),
      awayScore: num(d.awayScore),
      homeTries: numOrNull(d.homeTries),
      awayTries: numOrNull(d.awayTries),
    });

    if (d.homeOrgName) orgs.set(homeOrgId, String(d.homeOrgName));
    if (d.awayOrgName) orgs.set(awayOrgId, String(d.awayOrgName));
  }

  return { matches, orgs: Array.from(orgs, ([id, name]) => ({ id, name })) };
}
