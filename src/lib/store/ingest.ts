// Ingestion pipeline: read the six Match Pulse fields, persist them idempotently
// as fixtures, then derive-on-write the whole store (standings, rating history,
// snapshots, build meta). Idempotent on `fixtureId + amendedAt`, so re-running
// is a no-op until something actually changes at source.
//
// This is the one place that writes the store. Pages read the store (with a
// live-compute fallback) — they never trigger a build. A build is triggered by
// the admin "rebuild" action or a scheduled/webhook call to /api/ingest.

import { loadSportData } from '../matchpulse/source';
import type { MPMatch } from '../matchpulse/types';
import { getMethod } from './methodConfig';
import { buildFromFixtures } from './rebuild';
import {
  articleExistsOnDate,
  listSnapshots,
  readFixtures,
  readStandings,
  replaceRatingHistory,
  storeEnabled,
  supersedeArticlesFrom,
  supersedeSnapshotsFrom,
  writeArticleIfNew,
  writeBuildMeta,
  writeCorrection,
  writeFixtures,
  writeSnapshot,
  writeStandings,
} from './stateStore';
import { generateArticle } from '../generate/articles';
import { buildCorrection, type AmendedFixture } from '../generate/corrections';
import { TRACK_MASTER } from '../types';
import type { RatingHistoryRow, StoredFixture } from './types';

export interface IngestSummary {
  storeEnabled: boolean;
  totalFixtures: number;
  added: number;
  amended: number; // existing fixtures whose ingestKey changed (candidate corrections)
  unchanged: number;
  ratedFixtures: number;
  queuedFixtures: number;
  cadence: string;
  latestSeason: string | null;
  builtAt: string;
  amendedFixtureIds: string[]; // fed to the corrections flow (Phase 7)
}

function ingestKeyFor(fixtureId: string, amendedAt: string | null): string {
  return `${fixtureId}@${amendedAt ?? '0'}`;
}

/** Map a live Match Pulse result to a stored fixture. Live reads are all finals. */
function toStoredFixture(m: MPMatch, ingestedAt: string): StoredFixture {
  const amendedAt = m.amendedAt ?? null;
  return {
    fixtureId: m.id,
    homeSchool: m.homeOrgId,
    awaySchool: m.awayOrgId,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    date: m.date,
    season: m.season,
    status: 'complete',
    amendedAt,
    ingestKey: ingestKeyFor(m.id, amendedAt),
    queued: false,
    ingestedAt,
  };
}

/**
 * Run one ingest + rebuild cycle. Returns a summary; persists only when a store
 * is configured (otherwise it still computes, so callers can preview the result).
 */
export async function runIngestAndRebuild(now: Date = new Date()): Promise<IngestSummary> {
  const ingestedAt = now.toISOString();
  const [{ matches, orgs }, method, existing, priorMasterStandings] = await Promise.all([
    loadSportData('rugby'),
    getMethod(),
    readFixtures(),
    readStandings(TRACK_MASTER), // captured BEFORE the rebuild, for correction "was" values
  ]);

  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const existingByKey = new Map(existing.map((f) => [f.fixtureId, f]));
  const incoming = matches.map((m) => toStoredFixture(m, ingestedAt));

  let added = 0;
  let amended = 0;
  let unchanged = 0;
  const amendedFixtureIds: string[] = [];
  const toWrite: StoredFixture[] = [];

  for (const fx of incoming) {
    const prev = existingByKey.get(fx.fixtureId);
    if (!prev) {
      added += 1;
      toWrite.push(fx);
    } else if (prev.ingestKey !== fx.ingestKey) {
      amended += 1;
      amendedFixtureIds.push(fx.fixtureId);
      // Preserve the first-seen timestamp; only the version key advances.
      toWrite.push({ ...fx, ingestedAt: prev.ingestedAt });
    } else {
      unchanged += 1;
    }
  }

  if (toWrite.length > 0) await writeFixtures(toWrite);

  // Build from the full current universe of finals (the live set is authoritative).
  const result = buildFromFixtures(incoming, orgs, method, now);

  if (storeEnabled()) {
    // Persist standings for every scope, but bound history writes to the scopes
    // pages actually read: the all-time record (master) and the current season.
    await Promise.all(result.standings.map((s) => writeStandings(s)));

    const keepScopes = new Set<string>([TRACK_MASTER, ...(result.latestSeason ? [result.latestSeason] : [])]);
    const boundedHistory = new Map<string, RatingHistoryRow[]>();
    for (const [key, rows] of result.history) {
      const scope = key.split('__')[0];
      if (keepScopes.has(scope)) boundedHistory.set(key, rows);
    }
    await replaceRatingHistory(boundedHistory);

    // Generate an article for today, if a trigger fires and none exists yet.
    // Read the prior leader BEFORE writing today's snapshot (filter date < today).
    const captureDate = result.snapshots.find((s) => s.scope === TRACK_MASTER)?.date ?? null;
    const priorSnaps = (await listSnapshots(TRACK_MASTER)).filter((s) => !captureDate || s.date < captureDate);
    const priorLeaderId = priorSnaps[0]?.rows[0]?.teamId ?? null;
    const everLedIds = new Set<string>();
    for (const s of priorSnaps) {
      const top = s.rows[0]?.teamId;
      if (top) everLedIds.add(top);
    }

    await Promise.all(result.snapshots.map((s) => writeSnapshot(s)));
    await writeBuildMeta(result.meta);

    const masterStandings = result.standings.find((s) => s.scope === TRACK_MASTER)?.rows ?? [];
    const leader = masterStandings[0] ?? null;
    const leaderHistory = leader ? result.history.get(`${TRACK_MASTER}__${leader.teamId}`) ?? [] : [];
    const leaderLastMovement =
      [...leaderHistory].sort((a, b) => b.matchDate.localeCompare(a.matchDate))[0] ?? null;

    if (leader && captureDate && !(await articleExistsOnDate(captureDate))) {
      const article = generateArticle({
        now,
        season: result.latestSeason ?? captureDate.slice(0, 4),
        cadence: result.meta.cadence,
        leader,
        priorLeaderId,
        everLedIds,
        standings: masterStandings,
        leaderLastMovement,
        methodVersion: result.meta.methodVersion,
      });
      if (article) await writeArticleIfNew(article);
    }

    // Corrections: an amended fixture was re-rated in this build. Publish what
    // changed (was → now) and banner every superseded snapshot and article.
    if (amendedFixtureIds.length > 0 && priorMasterStandings) {
      const amendedSet = new Set(amendedFixtureIds);
      const amended: AmendedFixture[] = incoming
        .filter((f) => amendedSet.has(f.fixtureId))
        .map((f) => ({
          fixtureId: f.fixtureId,
          homeName: orgById.get(f.homeSchool)?.matchName || orgById.get(f.homeSchool)?.name || f.homeSchool,
          awayName: orgById.get(f.awaySchool)?.matchName || orgById.get(f.awaySchool)?.name || f.awaySchool,
          homeScore: f.homeScore,
          awayScore: f.awayScore,
          date: f.date,
        }));
      const fromDate = amended.map((a) => a.date).sort((a, b) => a.localeCompare(b))[0] ?? (captureDate ?? now.toISOString().slice(0, 10));
      const toDate = captureDate ?? now.toISOString().slice(0, 10);
      const priorMaster = new Map(
        priorMasterStandings.rows.map((r) => [r.teamId, { name: r.name, rating: r.rating }] as const),
      );
      const correction = buildCorrection({
        now,
        id: `corr-${toDate}-${amendedFixtureIds[0].slice(0, 8)}`,
        amended,
        priorMaster,
        nowMaster: masterStandings,
        fromDate,
        toDate,
        methodVersion: result.meta.methodVersion,
      });
      if (correction) {
        await writeCorrection(correction);
        // Supersede everything published before today's corrected build.
        await supersedeSnapshotsFrom(fromDate, toDate, correction.id);
        await supersedeArticlesFrom(fromDate, toDate, correction.id);
      }
    }
  }

  return {
    storeEnabled: storeEnabled(),
    totalFixtures: incoming.length,
    added,
    amended,
    unchanged,
    ratedFixtures: result.meta.ratedFixtures,
    queuedFixtures: result.meta.queuedFixtures,
    cadence: result.meta.cadence,
    latestSeason: result.latestSeason,
    builtAt: result.meta.builtAt,
    amendedFixtureIds,
  };
}
