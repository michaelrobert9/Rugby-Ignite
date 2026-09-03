import type { RankingConfig } from '../types';
import type { SportKey } from '../matchpulse/types';
import { readCollection, writeCollection } from './store';

// Ranking formula settings, split PER SPORT.
//
// Storage keeps rugby exactly where it has always been — the singleton `config`
// document — so every existing (rugby-only) consumer that calls getConfig() is
// unaffected. The other sports live together in a single `sportConfigs`
// document. Any field missing from storage falls back to the sport's default
// below, so adding a new setting never breaks an older saved document.

const CONFIG = 'config'; // rugby (legacy singleton)
const SPORT_CONFIGS = 'sportConfigs'; // { hockey?, waterpolo?, netball? }

// Every sport adopts the World Rugby method. The ONLY thing that differs is the
// margin threshold — a "16-point" thrashing means nothing in a goal sport — so
// those are scaled to each sport's typical scoreline. Everything else (K=4,
// seed 0.25, divisor 20, caps, home advantage, upset settings) is identical.
// Master's upset multiplier defaults to 1.0 (off) so Master is a clean exchange
// out of the box; the margin multiplier of 1.5 reproduces the classic bonus.
function base(overrides: Partial<RankingConfig>): RankingConfig {
  return {
    kMaster: 4,
    masterSafetyCap: 20,
    masterMarginMultiplier: 1.5,
    masterMarginThreshold: 16,
    masterUpsetMultiplier: 1.0,
    masterUpsetThreshold: 10,
    kSeason: 4,
    seedFactor: 0.25,
    seasonMarginMultiplier: 1.5,
    seasonUpsetMultiplier: 1.5,
    seasonSafetyCap: 8,
    marginThreshold: 15,
    upsetThreshold: 10,
    homeAdvantage: 3,
    ratingDivisor: 20,
    baselineRating: 50,
    currentSeason: '2026',
    masterTitle: 'Master Ranking',
    seasonTitle: 'Season Ranking',
    ...overrides,
  };
}

export const DEFAULT_CONFIGS: Record<SportKey, RankingConfig> = {
  rugby: base({ masterMarginThreshold: 16, marginThreshold: 15 }), // points
  hockey: base({ masterMarginThreshold: 4, marginThreshold: 3 }), // goals, low-scoring
  waterpolo: base({ masterMarginThreshold: 6, marginThreshold: 5 }), // goals, mid-scoring
  netball: base({ masterMarginThreshold: 15, marginThreshold: 12 }), // goals, high-scoring
};

/** Fill any missing field from the sport's default so old documents keep working. */
function withDefaults(sport: SportKey, raw: Partial<RankingConfig> | null | undefined): RankingConfig {
  return { ...DEFAULT_CONFIGS[sport], ...(raw ?? {}) };
}

async function readSportConfigs(): Promise<Partial<Record<SportKey, RankingConfig>>> {
  try {
    const raw = await readCollection<unknown>(SPORT_CONFIGS);
    return raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Partial<Record<SportKey, RankingConfig>>)
      : {};
  } catch {
    return {}; // not saved yet
  }
}

export async function getSportConfig(sport: SportKey): Promise<RankingConfig> {
  if (sport === 'rugby') {
    const raw = await readCollection<Partial<RankingConfig>>(CONFIG);
    return withDefaults('rugby', raw);
  }
  const map = await readSportConfigs();
  return withDefaults(sport, map[sport]);
}

export async function getAllConfigs(): Promise<Record<SportKey, RankingConfig>> {
  const [rugby, map] = await Promise.all([getSportConfig('rugby'), readSportConfigs()]);
  return {
    rugby,
    hockey: withDefaults('hockey', map.hockey),
    waterpolo: withDefaults('waterpolo', map.waterpolo),
    netball: withDefaults('netball', map.netball),
  };
}

export async function saveSportConfig(sport: SportKey, config: RankingConfig): Promise<void> {
  if (sport === 'rugby') {
    await writeCollection(CONFIG, config);
    return;
  }
  const map = await readSportConfigs();
  map[sport] = config;
  await writeCollection(SPORT_CONFIGS, map);
}

// --- Backward-compatible rugby helpers (used by the demo/CMS ranking pages) ---

export async function getConfig(): Promise<RankingConfig> {
  return getSportConfig('rugby');
}

export async function saveConfig(config: RankingConfig): Promise<void> {
  await saveSportConfig('rugby', config);
}
