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
  /** Most recent time any result was added/edited (ISO), for the "last updated" line. */
  lastUpdated: string | null;
}

// Firestore Timestamp | Date | number | string -> epoch ms (or null).
function toMillis(v: unknown): number | null {
  if (!v) return null;
  const maybe = v as { toMillis?: () => number; toDate?: () => Date };
  if (typeof maybe.toMillis === 'function') return maybe.toMillis();
  if (typeof maybe.toDate === 'function') return maybe.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
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

  // Canonical org names + logos come from `organizations` (what Match Pulse
  // shows), read in parallel with the results. The denormalised name on each
  // match is only a fallback for an org that has no organisations doc.
  const [snap, orgSnap] = await Promise.all([
    db.collection('matches').where('status', '==', 'final').get(),
    db.collection('organizations').get().catch(() => null),
  ]);

  const orgDocs = new Map<string, { name: string; logoUrl: string | null; primaryColor: string | null; region: string | null }>();
  if (orgSnap) {
    for (const o of orgSnap.docs) {
      const od = o.data() as Record<string, unknown>;
      const name = od.name ? String(od.name) : od.displayName ? String(od.displayName) : '';
      if (!name) continue;
      orgDocs.set(o.id, {
        name,
        logoUrl: od.logoUrl ? String(od.logoUrl) : null,
        primaryColor: od.primaryColor ? String(od.primaryColor) : null,
        region: od.region ? String(od.region) : null,
      });
    }
  }

  const matches: MPMatch[] = [];
  const fallbackName = new Map<string, string>();
  const usedOrgIds = new Set<string>();
  // "Last updated" = the freshest time a result was written (added or edited) in
  // Match Pulse, so the card moves whenever the data behind the table changes.
  // Fixture dates are only a last resort if no write timestamps exist at all.
  let lastWriteMs: number | null = null;
  let lastDateMs: number | null = null;

  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const homeOrgId = (d.homeOrgId as string) || '';
    const awayOrgId = (d.awayOrgId as string) || '';
    if (!homeOrgId || !awayOrgId) continue; // need two identified schools to rank

    const writeMs = toMillis(d.updatedAt) ?? toMillis(d.createdAt);
    if (writeMs !== null && (lastWriteMs === null || writeMs > lastWriteMs)) lastWriteMs = writeMs;
    const dateMs = toMillis(d.matchDate) ?? toMillis(d.scheduledAt);
    if (dateMs !== null && (lastDateMs === null || dateMs > lastDateMs)) lastDateMs = dateMs;

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

    usedOrgIds.add(homeOrgId);
    usedOrgIds.add(awayOrgId);
    if (d.homeOrgName) fallbackName.set(homeOrgId, String(d.homeOrgName));
    if (d.awayOrgName) fallbackName.set(awayOrgId, String(d.awayOrgName));
  }

  // Build the org list for every school that actually appears in a result,
  // preferring the canonical organisations doc (name + logo).
  const orgs = new Map<string, MPOrg>();
  for (const id of usedOrgIds) {
    const canonical = orgDocs.get(id);
    orgs.set(id, {
      id,
      name: canonical?.name || fallbackName.get(id) || id,
      logoUrl: canonical?.logoUrl ?? null,
      primaryColor: canonical?.primaryColor ?? null,
      region: canonical?.region ?? null,
    });
  }

  const lastUpdatedMs = lastWriteMs ?? lastDateMs;
  return {
    matches,
    orgs: Array.from(orgs.values()),
    lastUpdated: lastUpdatedMs !== null ? new Date(lastUpdatedMs).toISOString() : null,
  };
}
