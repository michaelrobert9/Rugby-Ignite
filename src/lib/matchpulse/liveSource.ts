// Live, READ-ONLY reader for Match Pulse sport data.
//
// Each sport is a named Firestore database in match-pulse-4560e. We open it
// with the Admin SDK (getSportDb) and read finalised `matches`. Names are
// denormalised onto each match (homeOrgName / homeTeamName / …), so the ladders
// are built straight from `matches` — no reads of `organizations` or `teams`.
//
// This module NEVER writes. It runs server-side only.

import { getSportDb } from '../data/firebaseAdmin';
import type { MPMatch, MPOrg, MPTeam, SportKey } from './types';

export interface SportData {
  matches: MPMatch[];
  orgs: MPOrg[];
  teams: MPTeam[];
}

// Firestore Timestamp | Date | number | 'YYYY-MM-DD' -> ISO date (YYYY-MM-DD).
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
 * only 1st-team rugby data exists live; when age sides arrive, derive the group
 * from each team's teamLevel/ageGroup (a join against the `teams` collection).
 */
export async function loadSportLive(sport: SportKey): Promise<SportData> {
  const db = getSportDb(sport);
  const snap = await db.collection('matches').where('status', '==', 'final').get();

  const matches: MPMatch[] = [];
  const orgs = new Map<string, string>();
  const teams = new Map<string, { name: string; orgId: string }>();

  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const homeOrgId = (d.homeOrgId as string) ?? null;
    const awayOrgId = (d.awayOrgId as string) ?? null;
    const date = toDateStr(d.matchDate) ?? toDateStr(d.scheduledAt);
    const season = d.season ? String(d.season) : (date ? date.slice(0, 4) : '');
    if (!date) continue; // undated finals can't be replayed chronologically

    matches.push({
      id: doc.id,
      sport,
      ageGroup: '1st',
      season,
      date,
      homeOrgId: homeOrgId ?? '',
      awayOrgId: awayOrgId ?? '',
      homeTeamId: (d.homeTeamId as string) ?? null,
      awayTeamId: (d.awayTeamId as string) ?? null,
      homeScore: num(d.homeScore),
      awayScore: num(d.awayScore),
      homeTries: numOrNull(d.homeTries),
      awayTries: numOrNull(d.awayTries),
    });

    // Harvest labels from the denormalised fields.
    if (homeOrgId && d.homeOrgName) orgs.set(homeOrgId, String(d.homeOrgName));
    if (awayOrgId && d.awayOrgName) orgs.set(awayOrgId, String(d.awayOrgName));
    if (d.homeTeamId && (d.homeTeamName || d.homeDisplay)) {
      teams.set(String(d.homeTeamId), { name: String(d.homeTeamName || d.homeDisplay), orgId: homeOrgId ?? '' });
    }
    if (d.awayTeamId && (d.awayTeamName || d.awayDisplay)) {
      teams.set(String(d.awayTeamId), { name: String(d.awayTeamName || d.awayDisplay), orgId: awayOrgId ?? '' });
    }
  }

  return {
    matches,
    orgs: Array.from(orgs, ([id, name]) => ({ id, name })),
    teams: Array.from(teams, ([id, t]) => ({ id, orgId: t.orgId, name: t.name, ageGroup: '1st' } as MPTeam)),
  };
}
