// Compute live Match Pulse ladders with the REAL ranking engine.
//
// This is the bridge between the read-only live data (MPMatch/MPOrg from the
// sport's named Firestore database) and the dual-track engine in
// ../rankingEngine.ts — the faithful port of the rugby-ignite-rankings plugin.
//
// It does NOT re-implement the formula. Every number (K-factors, seed factor,
// caps, thresholds, home advantage, baseline) comes from the admin Settings
// (RankingConfig via getConfig), so what the admin sees on the Settings page is
// exactly what runs here. Master (all-time, never resets) and Season (snapshot-
// seeded from Master, own K-factor) both come straight out of the engine.

import { runFullRecalculation } from '../rankingEngine';
import type { Match, RankingConfig, Team, TeamRating } from '../types';
import { TRACK_MASTER } from '../types';
import type { MPMatch, MPOrg, Track } from './types';

export interface LadderRow {
  entityId: string;
  name: string;
  rating: number; // starts at baselineRating (50 by default)
  startingRating: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winPercent: number;
  movement: number | null; // places gained/lost since last Thu 23:59 snapshot
}

export interface LadderResult {
  rows: LadderRow[];
  /** Master is a pure points exchange, so its pool must stay baseline × teams. */
  conserved: boolean;
  poolTotal: number;
  poolExpected: number;
}

// Live results have no venue link or festival flag yet, so home advantage is
// off (isHomeAdvantage needs venueId === homeTeam.homeVenueId) and nothing is
// excluded as a festival. Every finalised result read live is ranking-eligible.
function toMatch(m: MPMatch): Match {
  return {
    id: m.id,
    homeTeamId: m.homeOrgId,
    awayTeamId: m.awayOrgId,
    homePoints: m.homeScore,
    awayPoints: m.awayScore,
    date: m.date,
    season: m.season,
    venueId: null,
    isFestival: false,
    rankingEligible: true,
    status: 'played',
  };
}

/**
 * Build one ladder for a chosen sport (already the caller's matches), age group
 * and track. The engine always replays the FULL history chronologically (first
 * match → last) across every season; we then read the Master map or the chosen
 * season's map out of its result.
 */
export function computeLiveLadder(
  matches: MPMatch[],
  orgs: MPOrg[],
  ageGroup: string,
  track: Track,
  season: string,
  config: RankingConfig,
): LadderResult {
  const nameFor = new Map(orgs.map((o) => [o.id, o.name]));

  // One independent ladder per age group: only replay this group's matches.
  const inAge = matches.filter((m) => m.ageGroup === ageGroup);

  const teamIds = new Set<string>();
  for (const m of inAge) {
    teamIds.add(m.homeOrgId);
    teamIds.add(m.awayOrgId);
  }
  const teams: Team[] = Array.from(teamIds).map((id) => ({
    id,
    name: nameFor.get(id) ?? id,
    province: null,
    homeVenueId: null,
    logoUrl: null,
    needsReview: false,
  }));

  const { teamRatings } = runFullRecalculation(inAge.map(toMatch), teams, config);

  const scope = track === 'master' ? TRACK_MASTER : season;
  const map = teamRatings.get(scope) ?? new Map<string, TeamRating>();

  const rows: LadderRow[] = Array.from(map.values()).map((tr) => ({
    entityId: tr.teamId,
    name: nameFor.get(tr.teamId) ?? tr.teamId,
    rating: tr.rating,
    startingRating: tr.startingRating,
    played: tr.matchesPlayed,
    wins: tr.wins,
    draws: tr.draws,
    losses: tr.losses,
    winPercent: tr.matchesPlayed ? Math.round((tr.wins / tr.matchesPlayed) * 1000) / 10 : 0,
    movement: tr.movement,
  }));

  rows.sort(
    (a, b) => b.rating - a.rating || b.winPercent - a.winPercent || a.name.localeCompare(b.name),
  );

  // Master exchanges points 1:1 between the two teams every match, so the pool
  // must equal baseline × teams (allow for 2-dp output rounding). Season is
  // deliberately NOT conserved — its upset multiplier and per-side caps add or
  // remove points to reward giant-killing, so we only assert this on Master.
  const poolTotal = rows.reduce((s, r) => s + r.rating, 0);
  const poolExpected = config.baselineRating * rows.length;
  const conserved =
    track === 'master' && Math.abs(poolTotal - poolExpected) < 0.005 * rows.length + 1e-6;

  return { rows, conserved, poolTotal, poolExpected };
}
