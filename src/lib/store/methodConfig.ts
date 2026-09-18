// Method configuration — the single source of truth for the published method,
// wrapping the admin-editable RankingConfig with a version, the Form Heat
// parameters, and an auto-written changelog. `/how-it-works` renders from this,
// so the published method can never drift from what the calculator runs.
//
// The ranking formula itself stays in the existing `config` singleton (edited on
// the admin Settings page); this adds the method-level metadata on top, kept in
// its own `methodMeta` singleton in the rugby-ignite DB.

import { getConfig } from '../data/config';
import { isDemoMode } from '../data/store';
import type { RankingConfig } from '../types';
import type { HeatBand } from './types';
import { getDb } from '../data/firebaseAdmin';

/** How Form Heat is derived from recent form (decision 3: form, not the rating value). */
export interface HeatParams {
  /** How many of a school's most recent rated fixtures the heat reads. */
  window: number;
  /** Maps summed recent rating-point movement to the 0–100 scale: 50 + factor·Σ. */
  factor: number;
  /** Upper bound (exclusive) of each band on the 0–100 scale; white-hot is the rest. */
  bands: { cold: number; cool: number; warm: number; hot: number };
}

export interface ChangelogEntry {
  version: string;
  date: string; // 'YYYY-MM-DD'
  note: string;
}

export interface MethodMeta {
  version: string;
  publishedAt: string; // 'YYYY-MM-DD'
  heat: HeatParams;
  changelog: ChangelogEntry[];
  /** Named custodians published on /how-it-works (brief open item). */
  brandCustodian: string;
  methodCustodian: string;
}

/** Form Heat reads recent form, opponent-weighted (via rating-point movement), never the rating value. */
export const DEFAULT_HEAT: HeatParams = {
  window: 5,
  factor: 4,
  bands: { cold: 20, cool: 40, warm: 60, hot: 80 },
};

export const DEFAULT_METHOD_META: MethodMeta = {
  version: '1.0',
  publishedAt: '2027-01-12',
  heat: DEFAULT_HEAT,
  changelog: [
    { version: '1.0', date: '2027-01-12', note: 'First publication.' },
  ],
  brandCustodian: 'To be named',
  methodCustodian: 'To be named',
};

const METHOD_META = 'methodMeta';
const SINGLETON_DOC = 'current';

function withHeatDefaults(raw: Partial<MethodMeta> | null | undefined): MethodMeta {
  const m = raw ?? {};
  return {
    version: m.version ?? DEFAULT_METHOD_META.version,
    publishedAt: m.publishedAt ?? DEFAULT_METHOD_META.publishedAt,
    heat: {
      window: m.heat?.window ?? DEFAULT_HEAT.window,
      factor: m.heat?.factor ?? DEFAULT_HEAT.factor,
      bands: { ...DEFAULT_HEAT.bands, ...(m.heat?.bands ?? {}) },
    },
    changelog: m.changelog?.length ? m.changelog : DEFAULT_METHOD_META.changelog,
    brandCustodian: m.brandCustodian ?? DEFAULT_METHOD_META.brandCustodian,
    methodCustodian: m.methodCustodian ?? DEFAULT_METHOD_META.methodCustodian,
  };
}

/** The method metadata (version, heat params, changelog). Defaults when unset. */
export async function getMethodMeta(): Promise<MethodMeta> {
  if (isDemoMode()) return DEFAULT_METHOD_META;
  try {
    const snap = await getDb().collection(METHOD_META).doc(SINGLETON_DOC).get();
    return withHeatDefaults(snap.exists ? (snap.data() as Partial<MethodMeta>) : null);
  } catch {
    return DEFAULT_METHOD_META;
  }
}

export async function saveMethodMeta(meta: MethodMeta): Promise<void> {
  if (isDemoMode()) return;
  await getDb().collection(METHOD_META).doc(SINGLETON_DOC).set(meta);
}

/** The full method: the ranking formula plus its version + heat parameters. */
export interface Method {
  config: RankingConfig;
  meta: MethodMeta;
}

export async function getMethod(): Promise<Method> {
  const [config, meta] = await Promise.all([getConfig(), getMethodMeta()]);
  return { config, meta };
}

/** Map a Form Heat value (0–100) to its band name. */
export function heatBand(heat: number, bands: HeatParams['bands'] = DEFAULT_HEAT.bands): HeatBand {
  if (heat < bands.cold) return 'cold';
  if (heat < bands.cool) return 'cool';
  if (heat < bands.warm) return 'warm';
  if (heat < bands.hot) return 'hot';
  return 'white-hot';
}

export const HEAT_BAND_LABEL: Record<HeatBand, string> = {
  cold: 'Cold',
  cool: 'Cool',
  warm: 'Warm',
  hot: 'Hot',
  'white-hot': 'White Hot',
};
