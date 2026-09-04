// The "current season" for South African school rugby is simply the current
// calendar year (the season runs within one year), in SA time. Deriving it from
// the clock means it rolls over automatically on 1 January — 2026 → 2027 — with
// no manual step and no cron. Every year reference on the site reads off this.
//
// The ranking engine already re-seeds each new season from the All-Time ratings
// (via the seed factor) the first time that season's results are replayed, so
// when the year rolls over the new season's table is seeded automatically too.

export function getCurrentSeason(): string {
  return new Intl.DateTimeFormat('en-ZA', { year: 'numeric', timeZone: 'Africa/Johannesburg' }).format(new Date());
}

/** Replace {season}/{year} tokens in editable copy with the current season. */
export function withSeason(text: string, season: string = getCurrentSeason()): string {
  return text.replace(/\{season\}/gi, season).replace(/\{year\}/gi, season);
}
