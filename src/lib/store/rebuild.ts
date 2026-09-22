// Derive-on-write: turn the ingested fixture log into the persisted store.
//
// `buildFromFixtures` is PURE (no I/O) so it is deterministic and testable — a
// rebuild from the same fixtures always produces the same standings, history,
// snapshots and meta. It runs the existing dual-track engine (never a
// re-implementation), then layers on Form Heat (recent form) and the cadence.
// The orchestrator that reads/writes Firestore lives in ingest.ts.

import { runFullRecalculation } from '../rankingEngine';
import type { Match, Team, TeamRating } from '../types';
import { TRACK_MASTER } from '../types';
import type { MPOrg } from '../matchpulse/types';
import { provinceForRegion } from '../matchpulse/provinces';
import { computeFormHeat } from './formHeat';
import { heatBand, type Method } from './methodConfig';
import { deriveCadence } from './cadence';
import type {
  BuildMeta,
  RatingHistoryRow,
  StandingRow,
  StoredFixture,
  StoredSnapshot,
  StoredStandings,
} from './types';

export interface BuildResult {
  standings: StoredStandings[];
  /** key = `${scope}__${teamId}` → append-only rating history for that team×scope. */
  history: Map<string, RatingHistoryRow[]>;
  snapshots: StoredSnapshot[];
  meta: BuildMeta;
  latestSeason: string | null;
}

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** Capture day in South African time (UTC+2), 'YYYY-MM-DD'. */
function captureDay(now: Date): string {
  return new Date(now.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

export function buildFromFixtures(
  fixtures: StoredFixture[],
  orgs: MPOrg[],
  method: Method,
  now: Date = new Date(),
): BuildResult {
  const { config, meta } = method;
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  const rated = fixtures.filter(
    (f) => f.status === 'complete' && !f.queued && f.homeScore !== null && f.awayScore !== null,
  );
  const queuedCount = fixtures.length - rated.length;

  const matches: Match[] = rated.map((f) => ({
    id: f.fixtureId,
    homeTeamId: f.homeSchool,
    awayTeamId: f.awaySchool,
    homePoints: f.homeScore,
    awayPoints: f.awayScore,
    date: f.date,
    season: f.season,
    venueId: null,
    isFestival: false,
    rankingEligible: true,
    status: 'played',
  }));

  const teamIds = new Set<string>();
  for (const m of matches) {
    teamIds.add(m.homeTeamId);
    teamIds.add(m.awayTeamId);
  }
  const teams: Team[] = Array.from(teamIds).map((id) => {
    const org = orgById.get(id);
    return {
      id,
      name: org?.matchName || org?.name || id,
      province: (provinceForRegion(org?.region)?.name ?? null) as Team['province'],
      homeVenueId: null,
      logoUrl: org?.logoUrl ?? null,
      needsReview: false,
    };
  });

  const { teamRatings, matchRatings } = runFullRecalculation(matches, teams, config, now);

  // Most recent rated fixture per scope×team, for the row-expansion citation.
  const nameOf = (id: string) => orgById.get(id)?.matchName || orgById.get(id)?.name || id;
  const beforeByMatchScopeTeamTmp = new Map<string, number>();
  for (const mr of matchRatings) beforeByMatchScopeTeamTmp.set(`${mr.matchId}__${mr.scope}__${mr.teamId}`, mr.ratingBefore);
  const lastMoveByKey = new Map<string, NonNullable<StandingRow['lastMovement']>>();
  for (const mr of matchRatings) {
    const key = `${mr.scope}__${mr.teamId}`;
    const prev = lastMoveByKey.get(key);
    if (prev && prev.date >= mr.matchDate) continue;
    lastMoveByKey.set(key, {
      opponentName: nameOf(mr.opponentId),
      opponentRatingBefore: beforeByMatchScopeTeamTmp.get(`${mr.matchId}__${mr.scope}__${mr.opponentId}`) ?? 0,
      ratingBefore: mr.ratingBefore,
      pointsFor: mr.pointsFor,
      pointsAgainst: mr.pointsAgainst,
      ratingChange: mr.ratingChange,
      outcome: mr.outcome,
      date: mr.matchDate,
    });
  }

  const seasons = Array.from(new Set(rated.map((f) => f.season))).sort();
  const latestSeason = seasons.length ? seasons[seasons.length - 1] : null;

  // Cadence from rated fixture dates. Form Heat is withheld unless the season is
  // running normally (off-season has no form; festival movement is noise).
  const cadence = deriveCadence(rated.map((f) => f.date), now);
  const heatByTeam =
    latestSeason && cadence === 'ordinary'
      ? computeFormHeat(matchRatings, latestSeason, meta.heat)
      : new Map<string, number>();

  const builtAt = now.toISOString();

  const makeRow = (teamId: string, tr: TeamRating): StandingRow => {
    const org = orgById.get(teamId);
    const heat = heatByTeam.get(teamId);
    return {
      teamId,
      name: org?.matchName || org?.name || teamId,
      province: provinceForRegion(org?.region)?.name ?? null,
      logoUrl: org?.logoUrl ?? null,
      primaryColor: org?.primaryColor ?? null,
      rating: tr.rating,
      startingRating: tr.startingRating,
      played: tr.matchesPlayed,
      wins: tr.wins,
      draws: tr.draws,
      losses: tr.losses,
      winPercent: tr.matchesPlayed ? Math.round((tr.wins / tr.matchesPlayed) * 1000) / 10 : 0,
      movement: tr.movement,
      weekPoints: tr.weekPoints,
      formHeat: heat ?? null,
      formHeatBand: heat != null ? heatBand(heat, meta.heat.bands) : null,
    };
  };

  const standings: StoredStandings[] = [];
  for (const [scope, map] of teamRatings) {
    const rows = Array.from(map.values()).map((tr) => {
      const row = makeRow(tr.teamId, tr);
      row.lastMovement = lastMoveByKey.get(`${scope}__${tr.teamId}`) ?? null;
      return row;
    });
    rows.sort(
      (a, b) => b.rating - a.rating || b.winPercent - a.winPercent || a.name.localeCompare(b.name),
    );
    standings.push({ scope, rows, builtAt, methodVersion: meta.version });
  }

  const seasonByMatch = new Map(rated.map((f) => [f.fixtureId, f.season]));
  const nameFor = (id: string) => orgById.get(id)?.matchName || orgById.get(id)?.name || id;
  // Index each team's rating-going-in per match×scope, so a history row can carry
  // its opponent's before-rating without a second lookup at read time.
  const beforeByMatchScopeTeam = new Map<string, number>();
  for (const mr of matchRatings) {
    beforeByMatchScopeTeam.set(`${mr.matchId}__${mr.scope}__${mr.teamId}`, mr.ratingBefore);
  }
  const history = new Map<string, RatingHistoryRow[]>();
  for (const mr of matchRatings) {
    const key = `${mr.scope}__${mr.teamId}`;
    if (!history.has(key)) history.set(key, []);
    history.get(key)!.push({
      ...mr,
      season: seasonByMatch.get(mr.matchId) ?? mr.matchDate.slice(0, 4),
      opponentRatingBefore: beforeByMatchScopeTeam.get(`${mr.matchId}__${mr.scope}__${mr.opponentId}`) ?? 0,
      opponentName: nameFor(mr.opponentId),
    });
  }

  const date = captureDay(now);
  const snapScopes = latestSeason ? [TRACK_MASTER as string, latestSeason] : [TRACK_MASTER as string];
  const snapshots: StoredSnapshot[] = [];
  for (const scope of snapScopes) {
    const st = standings.find((s) => s.scope === scope);
    if (!st) continue;
    snapshots.push({
      id: `${scope}__${date}`,
      scope,
      date,
      round: null,
      rows: st.rows.map((r) => ({ teamId: r.teamId, name: r.name, rating: r.rating, movement: r.movement })),
      builtAt,
      methodVersion: meta.version,
      supersededBy: null,
    });
  }

  const lastFixtureDate = rated.length
    ? rated.map((f) => f.date).sort((a, b) => a.localeCompare(b)).slice(-1)[0]
    : null;

  const buildMeta: BuildMeta = {
    builtAt,
    round: null,
    cadence,
    methodVersion: meta.version,
    lastFixtureDate,
    ratedFixtures: rated.length,
    queuedFixtures: queuedCount,
  };

  return { standings, history, snapshots, meta: buildMeta, latestSeason };
}
