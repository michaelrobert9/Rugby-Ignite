import type { SportKey } from './types';

// Rating formula settings, split PER SPORT and PER AGE GROUP.
//
// The rating is a points-EXCHANGE system on a 0–100 scale: every team starts on
// BASELINE (50), and each match only moves points between the two teams — never
// creates or destroys them (zero-sum). This is the World Rugby ranking method.

export interface FormulaConfig {
  baseline: number; // starting rating for every team (50)
  k: number; // base points at stake per match
  gapCap: number; // rating gap is capped at ±this when computing expectation
  homeAdvantage: number; // points added to the home side's rating for expectation only (0 = off)
  marginThreshold: number; // a winning margin above this counts as a "big" win…
  marginMultiplier: number; // …and multiplies the points exchanged
}

// Rugby swings on bigger margins (points) than the goal sports (goals), so its
// marginThreshold is larger. Home advantage defaults to 0 until neutral-venue
// detection is added (turning it on without it would bias every home side).
const DEFAULTS: Record<SportKey, FormulaConfig> = {
  rugby: { baseline: 50, k: 2, gapCap: 10, homeAdvantage: 0, marginThreshold: 15, marginMultiplier: 1.5 },
  hockey: { baseline: 50, k: 2, gapCap: 10, homeAdvantage: 0, marginThreshold: 3, marginMultiplier: 1.5 },
  waterpolo: { baseline: 50, k: 2, gapCap: 10, homeAdvantage: 0, marginThreshold: 5, marginMultiplier: 1.5 },
  netball: { baseline: 50, k: 2, gapCap: 10, homeAdvantage: 0, marginThreshold: 10, marginMultiplier: 1.5 },
};

/** Per sport×age overrides keyed `${sport}:${ageGroup}`; falls back to the sport default. */
const OVERRIDES: Record<string, Partial<FormulaConfig>> = {
  // e.g. 'rugby:u14': { marginThreshold: 20 },
};

export function formulaFor(sport: SportKey, ageGroup: string): FormulaConfig {
  return { ...DEFAULTS[sport], ...(OVERRIDES[`${sport}:${ageGroup}`] ?? {}) };
}

export const BASELINE = 50;
