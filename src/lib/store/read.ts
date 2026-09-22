// The read side of the store, for pages. Everything renders from here.
//
// Prefers the persisted store (written by the ingest/rebuild pipeline). When the
// store has not been built yet — a fresh database, a zero-setup preview, or the
// test harness — it falls back to a live build from Match Pulse, which produces
// exactly the same StandingRow shape (including Form Heat) as a rebuild would
// persist. Either way the result is cached and tagged so a rebuild expires it.

import { unstable_cache } from 'next/cache';
import { loadSportData } from '../matchpulse/source';
import { RANKINGS_TAG } from '../matchpulse/cachedSource';
import { getMethod } from './methodConfig';
import { buildFromFixtures } from './rebuild';
import { readAllStandings, readBuildMeta, readTeamHistory } from './stateStore';
import { STORE_TAG } from './tags';
import { TRACK_MASTER } from '../types';
import type { MPMatch } from '../matchpulse/types';
import type { BuildMeta, CadenceMode, RatingHistoryRow, StandingRow, StoredFixture } from './types';

/** URL slug for a school name — stable, lowercase, hyphenated. */
export function schoolSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents so 'Hoërskool' → 'hoerskool'
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface SiteBuild {
  standingsByScope: Record<string, StandingRow[]>;
  scopes: string[];
  seasons: string[]; // season scopes only, ascending
  latestSeason: string | null;
  meta: BuildMeta | null;
  /** True when served from the persisted store, false when live-built on the fly. */
  persisted: boolean;
}

function liveToFixtures(matches: MPMatch[], ingestedAt: string): StoredFixture[] {
  return matches.map((m) => ({
    fixtureId: m.id,
    homeSchool: m.homeOrgId,
    awaySchool: m.awayOrgId,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    date: m.date,
    season: m.season,
    status: 'complete' as const,
    amendedAt: m.amendedAt ?? null,
    matchPath: m.path ?? null,
    ingestKey: `${m.id}@${m.amendedAt ?? '0'}`,
    queued: false,
    ingestedAt,
  }));
}

async function loadBuild(): Promise<SiteBuild> {
  const persistedRows = await readAllStandings();

  if (persistedRows.length > 0) {
    const standingsByScope: Record<string, StandingRow[]> = {};
    for (const s of persistedRows) standingsByScope[s.scope] = s.rows;
    const meta = await readBuildMeta();
    return finalizeBuild(standingsByScope, meta, true);
  }

  // Fallback: build live (same code path a rebuild uses to persist).
  const [{ matches, orgs }, method] = await Promise.all([loadSportData('rugby'), getMethod()]);
  const now = new Date();
  const result = buildFromFixtures(liveToFixtures(matches, now.toISOString()), orgs, method, now);
  const standingsByScope: Record<string, StandingRow[]> = {};
  for (const s of result.standings) standingsByScope[s.scope] = s.rows;
  return finalizeBuild(standingsByScope, result.meta, false);
}

function finalizeBuild(
  standingsByScope: Record<string, StandingRow[]>,
  meta: BuildMeta | null,
  persisted: boolean,
): SiteBuild {
  const scopes = Object.keys(standingsByScope);
  const seasons = scopes.filter((s) => s !== TRACK_MASTER).sort((a, b) => a.localeCompare(b));
  return {
    standingsByScope,
    scopes,
    seasons,
    latestSeason: seasons.length ? seasons[seasons.length - 1] : null,
    meta,
    persisted,
  };
}

const cachedBuild = unstable_cache(loadBuild, ['site-build'], {
  revalidate: 600,
  tags: [STORE_TAG, RANKINGS_TAG],
});

/** The whole current build (all scopes), cached and tag-invalidated on rebuild. */
export function getSiteBuild(): Promise<SiteBuild> {
  return cachedBuild();
}

/** Standings rows for one scope ('master' or a season year), optionally capped. */
export async function getStandings(scope: string, limit?: number): Promise<StandingRow[]> {
  const build = await getSiteBuild();
  const rows = build.standingsByScope[scope] ?? [];
  return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
}

/** Convenience: the cadence mode of the current build (defaults to ordinary). */
export async function getCadence(): Promise<CadenceMode> {
  const build = await getSiteBuild();
  return build.meta?.cadence ?? 'ordinary';
}

// Live-built rating history (bounded to master + current season), for the no-store
// fallback. Cached and tag-invalidated exactly like the standings build.
const cachedLiveHistory = unstable_cache(
  async (): Promise<Record<string, RatingHistoryRow[]>> => {
    const [{ matches, orgs }, method] = await Promise.all([loadSportData('rugby'), getMethod()]);
    const now = new Date();
    const result = buildFromFixtures(liveToFixtures(matches, now.toISOString()), orgs, method, now);
    const keep = new Set<string>([TRACK_MASTER, ...(result.latestSeason ? [result.latestSeason] : [])]);
    const out: Record<string, RatingHistoryRow[]> = {};
    for (const [key, rows] of result.history) {
      if (keep.has(key.split('__')[0])) out[key] = rows;
    }
    return out;
  },
  ['live-history'],
  { revalidate: 600, tags: [STORE_TAG, RANKINGS_TAG] },
);

/** Rating history for one team on one scope (persisted, else live fallback). */
export async function getTeamHistory(scope: string, teamId: string): Promise<RatingHistoryRow[]> {
  const persisted = await readTeamHistory(scope, teamId);
  if (persisted.length) return persisted;
  const built = await cachedLiveHistory();
  return built[`${scope}__${teamId}`] ?? [];
}

/** Find a school by URL slug, returning its master-scope standing row + rank. */
export async function getSchoolBySlug(
  slug: string,
): Promise<{ row: StandingRow; rank: number; total: number } | null> {
  const master = await getStandings(TRACK_MASTER);
  const idx = master.findIndex((r) => schoolSlug(r.name) === slug);
  if (idx === -1) return null;
  return { row: master[idx], rank: idx + 1, total: master.length };
}

/** The current-season standing row for a team, if it played this season. */
export async function getSeasonRow(teamId: string): Promise<StandingRow | null> {
  const build = await getSiteBuild();
  if (!build.latestSeason) return null;
  return build.standingsByScope[build.latestSeason]?.find((r) => r.teamId === teamId) ?? null;
}
