import type { SportKey } from './types';

// Ranking formula settings, split PER SPORT and PER AGE GROUP (the agreed
// model). In the live platform these live in a config collection an admin
// edits; here they default sensibly and can be overridden per sport×age.

export interface FormulaConfig {
  baseline: number; // starting rating for a new entity
  k: number; // Elo K-factor (rating movement per match)
  marginMultiplier: number; // how much winning margin amplifies movement (0 = off)
  /** Score margin (in the sport's unit) that counts as a "big" win for scaling. */
  marginReference: number;
}

// Sensible defaults. Rugby swings on bigger point margins than the goal sports,
// so its marginReference is larger.
const DEFAULTS: Record<SportKey, FormulaConfig> = {
  rugby: { baseline: 1500, k: 24, marginMultiplier: 0.5, marginReference: 30 },
  hockey: { baseline: 1500, k: 24, marginMultiplier: 0.5, marginReference: 4 },
  waterpolo: { baseline: 1500, k: 24, marginMultiplier: 0.5, marginReference: 6 },
  netball: { baseline: 1500, k: 24, marginMultiplier: 0.5, marginReference: 15 },
};

/** Per sport×age overrides keyed as `${sport}:${ageGroup}`; falls back to sport default. */
const OVERRIDES: Record<string, Partial<FormulaConfig>> = {
  // e.g. 'rugby:u14': { marginReference: 24 },
};

export function formulaFor(sport: SportKey, ageGroup: string): FormulaConfig {
  return { ...DEFAULTS[sport], ...(OVERRIDES[`${sport}:${ageGroup}`] ?? {}) };
}
