import { unstable_cache } from 'next/cache';
import { loadSportData } from './source';
import type { SportData } from './liveSource';
import type { SportKey } from './types';

// Reading + normalising the live Match Pulse data is the expensive part, and
// every ranking table on a page needs it. This caches one captured snapshot and
// serves it to every table and every request — so the site is fast — and holds
// it until the next run refreshes it: automatically after `revalidate` seconds,
// or immediately when an admin triggers a refresh (revalidateTag(RANKINGS_TAG)).

export const RANKINGS_TAG = 'rankings';
const REVALIDATE_SECONDS = 600; // 10 minutes

const cached = unstable_cache(
  async (sport: SportKey): Promise<SportData> => loadSportData(sport),
  ['mp-sportdata'],
  { revalidate: REVALIDATE_SECONDS, tags: [RANKINGS_TAG] },
);

/** Cached, deduplicated live snapshot for one sport. */
export function getCachedSportData(sport: SportKey): Promise<SportData> {
  return cached(sport);
}
