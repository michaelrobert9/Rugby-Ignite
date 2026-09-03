// Dual-track ranking engine — a faithful TypeScript port of the live
// `rugby-ignite-rankings` WordPress plugin (v1.10.0): class-rir-calculator.php
// and class-rir-recalculator.php.
//
// Two things were deliberately changed from the PHP version, both agreed with
// Michael:
//   1. Home advantage is decided by `match.venueId === homeTeam.homeVenueId`
//      (a direct reference) instead of fuzzy-matching venue and team NAMES.
//      Venue names are recorded to match Google Maps exactly for location
//      data, so name-matching produced false negatives (e.g. "Klerksdorp
//      Hoërskool" the team vs "Hoërskool Klerksdorp" the venue).
//   2. `province` is a curated field on each team (one of a fixed set of 5),
//      not something derived per match — so there's no "ranking-eligible
//      league tag" concept here; that's now `match.rankingEligible`.
//
// Everything else — the World Rugby Points Exchange formula for Master, the
// asymmetric-upset Elo formula for Season, the chronological stateful replay,
// the season seeding, the safety caps — is carried over as-is so historical
// ratings don't shift when this replaces the plugin.

import type {
  Match,
  MatchRating,
  RankingConfig,
  Scope,
  Team,
  TeamRating,
} from './types';
import { TRACK_MASTER } from './types';

const MASTER_HARD_CAP = 12.0;

type Outcome = 'win' | 'loss' | 'draw';

interface ExchangeResult {
  homeChange: number;
  awayChange: number;
  expectedHome: number;
  expectedAway: number;
  homeOutcome: Outcome;
  awayOutcome: Outcome;
  marginBonus: boolean;
  margin: number;
  upsetTier: number;
  capped: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function outcomeFromPoints(homePoints: number, awayPoints: number): { home: Outcome; away: Outcome } {
  if (homePoints > awayPoints) return { home: 'win', away: 'loss' };
  if (homePoints < awayPoints) return { home: 'loss', away: 'win' };
  return { home: 'draw', away: 'draw' };
}

export function expectedScore(ratingA: number, ratingB: number, divisor: number): number {
  return 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / divisor));
}

/**
 * Master track — World Rugby Points Exchange System. K=4 by default, hard-capped
 * at 12.00. Margin and upset multipliers are configurable but are applied to the
 * SAME `changeHome`, with `changeAway = -changeHome`, so the exchange stays
 * zero-sum for every setting: whatever one team gains, the other loses. Master is
 * therefore always a pure points exchange — the pool is never created/destroyed.
 */
function calculateMasterExchange(
  homeRating: number,
  awayRating: number,
  homePoints: number,
  awayPoints: number,
  isHomeAdvantage: boolean,
  homePosition: number,
  awayPosition: number,
  config: RankingConfig,
): ExchangeResult {
  const k = config.kMaster;

  let D = homeRating - awayRating;
  if (isHomeAdvantage) D += config.homeAdvantage;
  D = clamp(D, -10, 10);

  const margin = Math.abs(homePoints - awayPoints);
  const { home: homeOutcome, away: awayOutcome } = outcomeFromPoints(homePoints, awayPoints);

  let changeHome: number;

  if (homeOutcome === 'draw') {
    const rawExchange = k * (D / 10.0);
    changeHome = -rawExchange;
  } else if (homeOutcome === 'win') {
    changeHome = D >= 0.0 ? k * (1.0 - D / 10.0) : k * (1.0 + Math.abs(D) / 10.0);
  } else {
    const P = D <= 0.0 ? k * (1.0 - Math.abs(D) / 10.0) : k * (1.0 + D / 10.0);
    changeHome = -P;
  }

  const marginBonus = homeOutcome !== 'draw' && margin >= config.masterMarginThreshold;
  if (marginBonus && config.masterMarginMultiplier > 1.0) changeHome *= config.masterMarginMultiplier;

  // Upset: beating a team ranked well above you. Applied to the same changeHome
  // (both sides scale together via changeAway = -changeHome), so it never breaks
  // the exchange — unlike the Season track's deliberately asymmetric upset.
  let upsetTier = 0;
  if (
    config.masterUpsetMultiplier > 1.0 &&
    homeOutcome !== 'draw' &&
    homePosition > 0 &&
    awayPosition > 0
  ) {
    const gap = homeOutcome === 'win' ? homePosition - awayPosition : awayPosition - homePosition;
    if (gap >= config.masterUpsetThreshold) {
      changeHome *= config.masterUpsetMultiplier;
      upsetTier = 1;
    }
  }

  const effectiveCap = Math.min(MASTER_HARD_CAP, config.masterSafetyCap);
  let capped = false;
  if (Math.abs(changeHome) > effectiveCap) {
    changeHome = changeHome > 0 ? effectiveCap : -effectiveCap;
    capped = true;
  }

  const changeAway = -changeHome;

  return {
    homeChange: changeHome,
    awayChange: changeAway,
    expectedHome: 0,
    expectedAway: 0,
    homeOutcome,
    awayOutcome,
    marginBonus,
    margin,
    upsetTier,
    capped,
  };
}

/** Season track — standard Elo with configurable margin/upset multipliers, asymmetric on upset. */
function calculateSeasonExchange(
  homeRating: number,
  awayRating: number,
  homePoints: number,
  awayPoints: number,
  isHomeAdvantage: boolean,
  homePosition: number,
  awayPosition: number,
  config: RankingConfig,
): ExchangeResult {
  const k = config.kSeason;
  const homeEff = isHomeAdvantage ? homeRating + config.homeAdvantage : homeRating;
  const awayEff = awayRating;

  const expectedHome = expectedScore(homeEff, awayEff, config.ratingDivisor);
  const expectedAway = 1.0 - expectedHome;

  const { home: homeOutcome, away: awayOutcome } = outcomeFromPoints(homePoints, awayPoints);
  const actualHome = homeOutcome === 'win' ? 1.0 : homeOutcome === 'loss' ? 0.0 : 0.5;
  const margin = Math.abs(homePoints - awayPoints);

  const marginBonus = config.seasonMarginMultiplier > 1.0 && margin > config.marginThreshold;
  const marginMult = marginBonus ? config.seasonMarginMultiplier : 1.0;

  let upsetMult = 1.0;
  let upsetTier = 0;
  if (
    config.seasonUpsetMultiplier > 1.0 &&
    homeOutcome !== 'draw' &&
    homePosition > 0 &&
    awayPosition > 0
  ) {
    const gap = homeOutcome === 'win' ? homePosition - awayPosition : awayPosition - homePosition;
    if (gap >= config.upsetThreshold) {
      upsetMult = config.seasonUpsetMultiplier;
      upsetTier = 1;
    }
  }

  const baseExchange = k * marginMult * (actualHome - expectedHome);

  let changeHome: number;
  let changeAway: number;
  if (upsetTier > 0 && homeOutcome !== 'draw') {
    if (homeOutcome === 'win') {
      changeHome = k * marginMult * upsetMult * (actualHome - expectedHome);
      changeAway = -baseExchange;
    } else {
      changeHome = baseExchange;
      changeAway = -(k * marginMult * upsetMult * (actualHome - expectedHome));
    }
  } else {
    changeHome = baseExchange;
    changeAway = -baseExchange;
  }

  let capped = false;
  if (Math.abs(changeHome) > config.seasonSafetyCap) {
    changeHome = changeHome > 0 ? config.seasonSafetyCap : -config.seasonSafetyCap;
    capped = true;
  }
  if (Math.abs(changeAway) > config.seasonSafetyCap) {
    changeAway = changeAway > 0 ? config.seasonSafetyCap : -config.seasonSafetyCap;
    capped = true;
  }

  return {
    homeChange: changeHome,
    awayChange: changeAway,
    expectedHome,
    expectedAway,
    homeOutcome,
    awayOutcome,
    marginBonus,
    margin,
    upsetTier,
    capped,
  };
}

export function seasonSeed(masterRating: number | null, config: RankingConfig): number {
  if (masterRating === null) return config.baselineRating;
  return config.baselineRating + config.seedFactor * (masterRating - config.baselineRating);
}

/**
 * Home advantage now comes from a direct venue reference, not name-matching.
 * Disabled for festivals, or when either side of the reference is missing.
 */
export function isHomeAdvantage(match: Match, homeTeam: Team | undefined): boolean {
  if (match.isFestival) return false;
  if (!match.venueId || !homeTeam?.homeVenueId) return false;
  return match.venueId === homeTeam.homeVenueId;
}

interface RunningStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

function emptyStats(): RunningStats {
  return { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
}

function computePositions(ratings: Map<string, number>): Map<string, number> {
  const pairs = Array.from(ratings.entries()).sort((a, b) => b[1] - a[1]);
  const out = new Map<string, number>();
  pairs.forEach(([teamId], i) => out.set(teamId, i + 1));
  return out;
}

// South African Standard Time is UTC+2 year-round (no daylight saving).
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/**
 * Most recent Thursday 23:59 (South African time) strictly before `from`.
 * The weekly movement window resets at 23:59 SAST every Thursday. The server
 * runs in UTC, so we shift into SAST, snap to Thursday 23:59 there, then shift
 * back to the real UTC instant.
 */
function lastThursdayCutoff(from: Date): Date {
  const sa = new Date(from.getTime() + SAST_OFFSET_MS); // SAST wall clock, read via getUTC*
  sa.setUTCHours(23, 59, 0, 0);
  // getUTCDay(): 0=Sun..4=Thu
  while (sa.getUTCDay() !== 4 || sa.getTime() >= from.getTime() + SAST_OFFSET_MS) {
    sa.setUTCDate(sa.getUTCDate() - 1);
  }
  return new Date(sa.getTime() - SAST_OFFSET_MS);
}

export interface RecalculationResult {
  teamRatings: Map<Scope, Map<string, TeamRating>>;
  matchRatings: MatchRating[];
}

/**
 * Full chronological replay across every season, updating Master and each
 * Season track together — mirrors RIR_Recalculator::recalculate_all().
 * Both tracks are stateful and order-dependent, so this always does a full
 * rebuild rather than an incremental update, exactly like the plugin.
 */
export function runFullRecalculation(
  matches: Match[],
  teams: Team[],
  config: RankingConfig,
  now: Date = new Date(),
): RecalculationResult {
  const teamById = new Map(teams.map((t) => [t.id, t]));

  const eligible = matches
    .filter((m) => m.rankingEligible && m.status === 'played' && m.homePoints !== null && m.awayPoints !== null)
    .slice()
    // Strict chronological replay. The id tiebreak makes the order of matches
    // sharing a date fully deterministic, so the ranking is a reproducible
    // function of the data — it never shifts just because the source rows
    // arrived in a different order.
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const seasons = Array.from(new Set(eligible.map((m) => m.season))).sort();

  const masterRatings = new Map<string, number>();
  const masterStats = new Map<string, RunningStats>();
  const matchRatingsOut: MatchRating[] = [];
  const teamRatings = new Map<Scope, Map<string, TeamRating>>();

  const ensureMaster = (teamId: string) => {
    if (!masterRatings.has(teamId)) {
      masterRatings.set(teamId, config.baselineRating);
      masterStats.set(teamId, emptyStats());
    }
  };

  for (const season of seasons) {
    const seasonMatches = eligible.filter((m) => m.season === season);
    const seasonRatings = new Map<string, number>();
    const seasonStartingRatings = new Map<string, number>();
    const seasonStats = new Map<string, RunningStats>();

    const teamIdsThisSeason = new Set<string>();
    for (const m of seasonMatches) {
      teamIdsThisSeason.add(m.homeTeamId);
      teamIdsThisSeason.add(m.awayTeamId);
    }

    for (const tid of teamIdsThisSeason) {
      ensureMaster(tid);
      const seed = seasonSeed(masterRatings.get(tid)!, config);
      seasonRatings.set(tid, seed);
      seasonStartingRatings.set(tid, seed);
      seasonStats.set(tid, emptyStats());
    }

    for (const match of seasonMatches) {
      const homeId = match.homeTeamId;
      const awayId = match.awayTeamId;

      ensureMaster(homeId);
      ensureMaster(awayId);
      if (!seasonRatings.has(homeId)) {
        const seed = seasonSeed(masterRatings.get(homeId)!, config);
        seasonRatings.set(homeId, seed);
        seasonStartingRatings.set(homeId, seed);
        seasonStats.set(homeId, emptyStats());
      }
      if (!seasonRatings.has(awayId)) {
        const seed = seasonSeed(masterRatings.get(awayId)!, config);
        seasonRatings.set(awayId, seed);
        seasonStartingRatings.set(awayId, seed);
        seasonStats.set(awayId, emptyStats());
      }

      // Leaderboard positions before this match, per track — used by the upset
      // multipliers (Master's only matters when masterUpsetMultiplier > 1).
      const masterPositions = computePositions(masterRatings);
      const seasonPositions = computePositions(seasonRatings);

      const homeAdv = isHomeAdvantage(match, teamById.get(homeId));
      const homePoints = match.homePoints as number;
      const awayPoints = match.awayPoints as number;

      const masterHomeBefore = masterRatings.get(homeId)!;
      const masterAwayBefore = masterRatings.get(awayId)!;
      const masterResult = calculateMasterExchange(
        masterHomeBefore,
        masterAwayBefore,
        homePoints,
        awayPoints,
        homeAdv,
        masterPositions.get(homeId) ?? 0,
        masterPositions.get(awayId) ?? 0,
        config,
      );
      masterRatings.set(homeId, masterHomeBefore + masterResult.homeChange);
      masterRatings.set(awayId, masterAwayBefore + masterResult.awayChange);

      const seasonHomeBefore = seasonRatings.get(homeId)!;
      const seasonAwayBefore = seasonRatings.get(awayId)!;
      const seasonResult = calculateSeasonExchange(
        seasonHomeBefore,
        seasonAwayBefore,
        homePoints,
        awayPoints,
        homeAdv,
        seasonPositions.get(homeId) ?? 0,
        seasonPositions.get(awayId) ?? 0,
        config,
      );
      seasonRatings.set(homeId, seasonHomeBefore + seasonResult.homeChange);
      seasonRatings.set(awayId, seasonAwayBefore + seasonResult.awayChange);

      // Stats (identical for both tracks — outcome only depends on points).
      updateStats(masterStats, match, masterResult.homeOutcome);
      updateStats(seasonStats, match, masterResult.homeOutcome);

      pushMatchRatingRows(matchRatingsOut, match, TRACK_MASTER, homeId, awayId, masterHomeBefore, masterRatings.get(homeId)!, masterAwayBefore, masterRatings.get(awayId)!, masterResult, homeAdv);
      pushMatchRatingRows(matchRatingsOut, match, season, homeId, awayId, seasonHomeBefore, seasonRatings.get(homeId)!, seasonAwayBefore, seasonRatings.get(awayId)!, seasonResult, homeAdv);
    }

    const seasonMap = new Map<string, TeamRating>();
    for (const [tid, rating] of seasonRatings) {
      const stats = seasonStats.get(tid) ?? emptyStats();
      seasonMap.set(tid, {
        teamId: tid,
        scope: season,
        startingRating: round2(seasonStartingRatings.get(tid) ?? config.baselineRating),
        rating: round2(rating),
        matchesPlayed: stats.matchesPlayed,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        pointsFor: stats.pointsFor,
        pointsAgainst: stats.pointsAgainst,
        movement: null,
        weekPoints: null,
      });
    }
    teamRatings.set(season, seasonMap);
  }

  const masterMap = new Map<string, TeamRating>();
  for (const [tid, rating] of masterRatings) {
    const stats = masterStats.get(tid) ?? emptyStats();
    masterMap.set(tid, {
      teamId: tid,
      scope: TRACK_MASTER,
      startingRating: round2(config.baselineRating),
      rating: round2(rating),
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      pointsFor: stats.pointsFor,
      pointsAgainst: stats.pointsAgainst,
      movement: null,
      weekPoints: null,
    });
  }
  teamRatings.set(TRACK_MASTER, masterMap);

  applyMovement(teamRatings, matchRatingsOut, now);

  return { teamRatings, matchRatings: matchRatingsOut };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function updateStats(stats: Map<string, RunningStats>, match: Match, homeOutcome: Outcome) {
  const home = stats.get(match.homeTeamId) ?? emptyStats();
  const away = stats.get(match.awayTeamId) ?? emptyStats();

  home.matchesPlayed++;
  away.matchesPlayed++;
  home.pointsFor += match.homePoints as number;
  home.pointsAgainst += match.awayPoints as number;
  away.pointsFor += match.awayPoints as number;
  away.pointsAgainst += match.homePoints as number;

  if (homeOutcome === 'win') {
    home.wins++;
    away.losses++;
  } else if (homeOutcome === 'loss') {
    home.losses++;
    away.wins++;
  } else {
    home.draws++;
    away.draws++;
  }

  stats.set(match.homeTeamId, home);
  stats.set(match.awayTeamId, away);
}

function pushMatchRatingRows(
  out: MatchRating[],
  match: Match,
  scope: Scope,
  homeId: string,
  awayId: string,
  homeBefore: number,
  homeAfter: number,
  awayBefore: number,
  awayAfter: number,
  result: ExchangeResult,
  homeAdv: boolean,
) {
  out.push({
    matchId: match.id,
    teamId: homeId,
    opponentId: awayId,
    scope,
    matchDate: match.date,
    ratingBefore: round2(homeBefore),
    ratingAfter: round2(homeAfter),
    ratingChange: round2(result.homeChange),
    expectedScore: Math.round(result.expectedHome * 10000) / 10000,
    isHome: true,
    homeAdvantageApplied: homeAdv,
    pointsFor: match.homePoints as number,
    pointsAgainst: match.awayPoints as number,
    outcome: result.homeOutcome,
    marginBonus: result.marginBonus,
    upsetTier: result.upsetTier,
    capped: result.capped,
  });
  out.push({
    matchId: match.id,
    teamId: awayId,
    opponentId: homeId,
    scope,
    matchDate: match.date,
    ratingBefore: round2(awayBefore),
    ratingAfter: round2(awayAfter),
    ratingChange: round2(result.awayChange),
    expectedScore: Math.round(result.expectedAway * 10000) / 10000,
    isHome: false,
    homeAdvantageApplied: false,
    pointsFor: match.awayPoints as number,
    pointsAgainst: match.homePoints as number,
    outcome: result.awayOutcome,
    marginBonus: result.marginBonus,
    upsetTier: result.upsetTier,
    capped: result.capped,
  });
}

/** Movement since the last Thursday 23:59 cutoff — mirrors apply_movement_from_snapshot(). */
function applyMovement(teamRatings: Map<Scope, Map<string, TeamRating>>, matchRatings: MatchRating[], now: Date) {
  const cutoff = lastThursdayCutoff(now);

  for (const [scope, teams] of teamRatings) {
    // Most recent rating_after strictly before the cutoff, per team.
    const cutoffRatings = new Map<string, number>();
    const byTeam = new Map<string, MatchRating[]>();
    for (const mr of matchRatings) {
      if (mr.scope !== scope) continue;
      if (!byTeam.has(mr.teamId)) byTeam.set(mr.teamId, []);
      byTeam.get(mr.teamId)!.push(mr);
    }
    for (const [teamId, rows] of byTeam) {
      const before = rows.filter((r) => new Date(r.matchDate).getTime() < cutoff.getTime());
      if (before.length === 0) continue;
      before.sort((a, b) => a.matchDate.localeCompare(b.matchDate));
      cutoffRatings.set(teamId, before[before.length - 1].ratingAfter);
    }

    const cutoffOrder = Array.from(cutoffRatings.entries()).sort((a, b) => b[1] - a[1]);
    const cutoffPositions = new Map<string, number>();
    cutoffOrder.forEach(([teamId], i) => cutoffPositions.set(teamId, i + 1));

    const currentOrder = Array.from(teams.values()).sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst);
    });

    currentOrder.forEach((tr, i) => {
      const newPos = i + 1;
      const oldPos = cutoffPositions.get(tr.teamId) ?? null;
      const oldRating = cutoffRatings.get(tr.teamId) ?? null;
      tr.movement = oldPos !== null ? oldPos - newPos : null;
      tr.weekPoints = oldRating !== null ? round2(tr.rating - oldRating) : null;
    });
  }
}
