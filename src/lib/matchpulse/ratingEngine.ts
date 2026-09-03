// Sport-aware rating engine. Pure functions — no Firebase, no I/O.
//
// Computes an Elo-style rating from a chronological list of finalised matches,
// replayed in date order. Works for any sport: the only sport-specific input is
// the FormulaConfig (baseline, K, and the score-margin scale), so rugby's point
// margins and the goal sports' goal margins are handled by the same code.
//
// The same replay produces both levels — organisation and individual team —
// by choosing which id each match maps to (homeOrgId/awayOrgId vs
// homeTeamId/awayTeamId). Master replays every season continuously; Season
// replays a single season from the baseline.

import type { MPMatch, RankLevel, RatingRow, SportKey, Track } from './types';
import { formulaFor, type FormulaConfig } from './rankingConfig';

interface Acc {
  rating: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

function sideIds(m: MPMatch, level: RankLevel): [string | null, string | null] {
  return level === 'org' ? [m.homeOrgId, m.awayOrgId] : [m.homeTeamId, m.awayTeamId];
}

function expected(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

// Movement for one side. score: 1 win / 0.5 draw / 0 loss.
function delta(cfg: FormulaConfig, rating: number, oppRating: number, score: number, margin: number): number {
  const marginBoost = cfg.marginMultiplier > 0
    ? 1 + cfg.marginMultiplier * Math.min(margin / cfg.marginReference, 2)
    : 1;
  return cfg.k * marginBoost * (score - expected(rating, oppRating));
}

export interface RankArgs {
  matches: MPMatch[]; // already filtered to one sport
  sport: SportKey;
  ageGroup: string;
  track: Track;
  level: RankLevel;
  season?: string; // required when track === 'season'
  nameFor: (id: string) => string;
  subtitleFor?: (id: string) => string | undefined;
}

export function computeRatings(args: RankArgs): RatingRow[] {
  const { matches, sport, ageGroup, track, level, season, nameFor, subtitleFor } = args;
  const cfg = formulaFor(sport, ageGroup);

  const pool = matches
    .filter((m) => m.ageGroup === ageGroup)
    .filter((m) => (track === 'season' && season ? m.season === season : true))
    .filter((m) => {
      const [h, a] = sideIds(m, level);
      return h && a; // both sides identifiable at this level
    })
    .slice()
    .sort((x, y) => x.date.localeCompare(y.date));

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
    const [homeId, awayId] = sideIds(m, level) as [string, string];
    const home = get(homeId);
    const away = get(awayId);
    const margin = Math.abs(m.homeScore - m.awayScore);
    const homeScore = m.homeScore > m.awayScore ? 1 : m.homeScore < m.awayScore ? 0 : 0.5;
    const awayScore = 1 - homeScore;

    const rH = home.rating;
    const rA = away.rating;
    home.rating = rH + delta(cfg, rH, rA, homeScore, margin);
    away.rating = rA + delta(cfg, rA, rH, awayScore, margin);

    for (const [side, s] of [[home, homeScore], [away, awayScore]] as const) {
      side.played += 1;
      if (s === 1) side.wins += 1;
      else if (s === 0.5) side.draws += 1;
      else side.losses += 1;
    }
  }

  const rows: RatingRow[] = Array.from(acc.entries()).map(([id, a]) => ({
    entityId: id,
    name: nameFor(id),
    subtitle: subtitleFor?.(id),
    rating: Math.round(a.rating * 10) / 10,
    played: a.played,
    wins: a.wins,
    draws: a.draws,
    losses: a.losses,
    winPercent: a.played ? Math.round((a.wins / a.played) * 1000) / 10 : 0,
  }));

  return rows.sort((x, y) => y.rating - x.rating || y.winPercent - x.winPercent);
}
