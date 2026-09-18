// Cadence is derived from data density, not the calendar (README §Cadence), so
// an unannounced festival is handled automatically and a rescheduled one never
// leaves the site in the wrong mode.
//
//   OFF_SEASON  no rated fixture for 6+ weeks
//   FESTIVAL    8 or more rated fixtures within 48 hours
//   ORDINARY    the default
//
// Fixture dates from the live source are day-granular, so the 48-hour test is
// evaluated over a 3-calendar-day window (the tightest span that always
// contains a real 48-hour burst given day-only dates).

import type { CadenceMode } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const OFF_SEASON_DAYS = 42; // 6 weeks
const FESTIVAL_MIN_FIXTURES = 8;
const FESTIVAL_WINDOW_DAYS = 2; // 48 hours

/** Derive the cadence mode from the dates of rated fixtures. */
export function deriveCadence(ratedDates: string[], now: Date = new Date()): CadenceMode {
  if (ratedDates.length === 0) return 'off-season';

  const times = ratedDates
    .map((d) => new Date(`${d}T00:00:00Z`).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  if (times.length === 0) return 'off-season';

  const last = times[times.length - 1];
  if (now.getTime() - last > OFF_SEASON_DAYS * DAY_MS) return 'off-season';

  // Densest FESTIVAL_WINDOW_DAYS window: for each fixture, count fixtures within
  // the window starting at it. A single sweep is enough since times are sorted.
  let maxInWindow = 0;
  let j = 0;
  for (let i = 0; i < times.length; i++) {
    if (i > j) j = i;
    while (j + 1 < times.length && times[j + 1] - times[i] <= FESTIVAL_WINDOW_DAYS * DAY_MS) j++;
    maxInWindow = Math.max(maxInWindow, j - i + 1);
  }
  if (maxInWindow >= FESTIVAL_MIN_FIXTURES) return 'festival';

  return 'ordinary';
}
