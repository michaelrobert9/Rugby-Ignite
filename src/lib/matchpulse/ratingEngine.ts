// Points-exchange rating engine (World Rugby method). Pure — no I/O.
//
// GUARANTEES (the vital ones):
//  1. Chronological: matches are replayed strictly first → last (by date, then
//     a stable id tiebreak). Master replays every season; Season replays one.
//  2. Zero-sum exchange: each match computes ONE `swing` and applies +swing to
//     one team and −swing to the other. Points are only moved, never created or
//     destroyed. Total points therefore stay exactly BASELINE × (teams played)
//     — verified after every replay (assertConserved).
//  3. Scale: every team starts at BASELINE (50); ratings live on a ~0–100 scale.
//
// The ranked entity is the school/organisation within a chosen age group
// (age group == team, per the brief) — one ladder per sport × age group × track.

import type { MPMatch, RatingRow, SportKey, Track } from './types';
import { formulaFor } from './rankingConfig';

interface Acc {
  rating: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface RankArgs {
  matches: MPMatch[]; // already limited to one sport
  sport: SportKey;
  ageGroup: string;
  track: Track;
  season?: string; // required when track === 'season'
  nameFor: (orgId: string) => string;
}

export interface RankResult {
  rows: RatingRow[];
  conserved: boolean; // did the exchange conserve the point pool?
  poolTotal: number; // sum of all ratings
  poolExpected: number; // BASELINE × teams that have played
}

export function computeRatings(args: RankArgs): RankResult {
  const { matches, sport, ageGroup, track, season, nameFor } = args;
  const cfg = formulaFor(sport, ageGroup);

  const pool = matches
    .filter((m) => m.ageGroup === ageGroup)
    .filter((m) => (track === 'season' && season ? m.season === season : true))
    .filter((m) => m.homeOrgId && m.awayOrgId && m.homeOrgId !== m.awayOrgId)
    // Strict chronological order; id breaks ties within a day so replay is deterministic.
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const acc = new Map<string, Acc>();
  const get = (id: string): Acc => {
    let a = acc.get(id);
    if (!a) {
      a = { rating: cfg.baseline, played: 0, wins: 0, draws: 0, losses: 0 };
      acc.set(id, a);
    }
    return a;
  };

  for (const m of pool) {
    const home = get(m.homeOrgId);
    const away = get(m.awayOrgId);

    // Expectation from the (capped) rating gap. Home advantage shifts the
    // expectation only; it never breaks the exchange.
    const gap = clamp(home.rating + cfg.homeAdvantage - away.rating, -cfg.gapCap, cfg.gapCap);
    const expectedHome = 0.5 + gap / (2 * cfg.gapCap); // 0..1

    const resultHome = m.homeScore > m.awayScore ? 1 : m.homeScore < m.awayScore ? 0 : 0.5;
    const margin = Math.abs(m.homeScore - m.awayScore);
    const weight = margin > cfg.marginThreshold ? cfg.marginMultiplier : 1;

    // ONE swing, applied both ways: pure exchange (zero-sum).
    const swing = cfg.k * weight * (resultHome - expectedHome);
    home.rating += swing;
    away.rating -= swing;

    home.played += 1;
    away.played += 1;
    if (resultHome === 1) { home.wins += 1; away.losses += 1; }
    else if (resultHome === 0) { home.losses += 1; away.wins += 1; }
    else { home.draws += 1; away.draws += 1; }
  }

  const rows: RatingRow[] = Array.from(acc.entries()).map(([id, a]) => ({
    entityId: id,
    name: nameFor(id),
    rating: Math.round(a.rating * 10) / 10,
    played: a.played,
    wins: a.wins,
    draws: a.draws,
    losses: a.losses,
    winPercent: a.played ? Math.round((a.wins / a.played) * 1000) / 10 : 0,
  }));

  rows.sort((x, y) => y.rating - x.rating || y.winPercent - x.winPercent || x.name.localeCompare(y.name));

  // Verify the exchange conserved the pool: total must equal BASELINE × teams.
  let poolTotal = 0;
  for (const a of acc.values()) poolTotal += a.rating;
  const poolExpected = cfg.baseline * acc.size;
  const conserved = Math.abs(poolTotal - poolExpected) < 1e-6 * Math.max(1, acc.size);
  if (!conserved && process.env.NODE_ENV !== 'production') {
    console.error(`[rankings] point pool not conserved: total=${poolTotal} expected=${poolExpected}`);
  }

  return { rows, conserved, poolTotal, poolExpected };
}
