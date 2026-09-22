// Canonical Match Pulse links. Rugby Ignite reads its data from Match Pulse, so
// upcoming matches, live scores and results live there — on the rugby app. These
// are used for the "where the data comes from" references across the site.

export const MATCHPULSE = {
  /** Main Match Pulse marketing/portal site. */
  main: 'https://matchpulse.co.za',
  /** Match Pulse Rugby app — Live / Today / Upcoming / Recent results hub. */
  rugby: 'https://rugby.matchpulse.co.za',
  /** Competitions: fixtures, standings and results per competition. */
  rugbyCompetitions: 'https://rugby.matchpulse.co.za/competitions',
  /** School directory — each school's fixtures and results. */
  rugbySchools: 'https://rugby.matchpulse.co.za/schools',
} as const;

// Match Pulse's canonical slugify for a standalone match path (kept in step with
// their matchPaths.js: lowercase, accents stripped, & → "and", else hyphens).
function mpSlugify(text: string): string {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Deep link to a match on Match Pulse Rugby. Prefer the stored canonical `path`
 * from the match document; otherwise rebuild the standalone shape
 * `/match/{YYYY-MM-DD}/{home}-vs-{away}` (home always first). Falls back to the
 * rugby home when there isn't enough to build a path.
 */
export function matchUrl(opts: {
  path?: string | null;
  date?: string | null;
  homeName?: string | null;
  awayName?: string | null;
}): string {
  const base = MATCHPULSE.rugby;
  if (opts.path) return `${base}${opts.path.startsWith('/') ? '' : '/'}${opts.path}`;
  if (opts.date && opts.homeName && opts.awayName) {
    return `${base}/match/${opts.date}/${mpSlugify(opts.homeName)}-vs-${mpSlugify(opts.awayName)}`;
  }
  return base;
}
