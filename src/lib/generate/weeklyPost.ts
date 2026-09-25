// Weekly + end-of-season auto-posts — ported from the WordPress plugin
// (RIR_Weekly_Post / RIR_Post_Templates). The article FRAME (intro, headings,
// footer copy) uses the plugin's default wording; the DATA sections (top 10,
// movers, fallers, key results, climbers, the table) are generated from real
// store data, with fallback copy when the data isn't there yet. Nothing is
// invented.
//
// Output is markdown (headings, lists, pipe tables) — the same subset RichText
// renders — and is saved as an ordinary News post.

import { getStandings, getSiteBuild } from '@/lib/store/read';
import { readFixtures } from '@/lib/store/stateStore';
import { getSiteSettings, saveSiteSettings, type AutoPostSettings } from '@/lib/data/siteSettings';
import { savePost, uniquePostId, slugify } from '@/lib/data/posts';
import { getCurrentSeason } from '@/lib/season';
import type { StandingRow, StoredFixture } from '@/lib/store/types';

/** A standings row with its 1-based position (StandingRow is positional only). */
type Ranked = StandingRow & { rank: number };
const withRank = (rows: StandingRow[]): Ranked[] => rows.map((r, i) => ({ ...r, rank: i + 1 }));

export interface AutoPostResult {
  kind: 'weekly' | 'final';
  created: boolean;
  skipped?: string; // reason, when not created
  postId?: string;
  title?: string;
  slug?: string;
  status?: 'published' | 'draft';
}

const METHODOLOGY_URL = '/how-it-works';
const AUTHOR = 'Rugby Ignite';

function settings(s: Awaited<ReturnType<typeof getSiteSettings>>): AutoPostSettings {
  return (
    s.autoPost ?? {
      enabled: false,
      onlyWhenChanged: true,
      status: 'published',
      eosEnabled: false,
      eosDelayDays: 3,
      eosPublishedSeasons: [],
    }
  );
}

// ── formatting helpers ──────────────────────────────────────────────────────

function ordinal(n: number): string {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function fmtDayMonth(d: Date): string {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', timeZone: 'Africa/Johannesburg' }).format(d);
}

function signatureOf(rows: StandingRow[]): string {
  let h = 5381;
  const str = rows.map((r) => `${r.teamId}:${r.rating.toFixed(2)}`).join('|');
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

// ── data sections ───────────────────────────────────────────────────────────

function topNames(rows: StandingRow[]): { top_1: string; top_2: string; top_3: string; top_4: string } {
  const t = ['', '', '', ''];
  rows.slice(0, 4).forEach((r, i) => (t[i] = r.name));
  return { top_1: t[0], top_2: t[1], top_3: t[2], top_4: t[3] };
}

function topTenTable(rows: StandingRow[]): string {
  const top = rows.slice(0, 10);
  if (!top.length) return '';
  const lines = ['| # | Team |', '| --- | --- |'];
  top.forEach((r, i) => lines.push(`| ${i + 1} | ${r.name} |`));
  return lines.join('\n');
}

function moverSentence(r: Ranked, isUp: boolean, period: string): string {
  const current = r.rank ?? 0;
  const move = r.movement ?? 0;
  const moved = Math.abs(move);
  const prev = current + move; // movement = old_pos − new_pos (positive = climbed)
  let pts = '';
  if (r.weekPoints != null && Math.abs(r.weekPoints) >= 0.01) {
    pts = ` (${r.weekPoints > 0 ? '+' : ''}${r.weekPoints.toFixed(2)} ranking points)`;
  }
  const places = moved === 1 ? 'place' : 'places';
  return isUp
    ? `${r.name} climbed from ${ordinal(prev)} to ${ordinal(current)}, moving up ${moved} ${places} ${period}${pts}.`
    : `${r.name} moved from ${ordinal(prev)} to ${ordinal(current)}, dropping ${moved} ${places} ${period}${pts}.`;
}

function hasPrevious(rows: StandingRow[]): boolean {
  return rows.some((r) => r.movement != null);
}

function moversSection(rows: Ranked[], fallback: string, period = 'this week'): string {
  if (!hasPrevious(rows)) return fallback;
  const movers = rows
    .filter((r) => r.movement != null && (r.movement as number) > 0)
    .sort((a, b) => (b.movement as number) - (a.movement as number))
    .slice(0, 5);
  if (!movers.length) return fallback;
  return movers.map((r) => `- ${moverSentence(r, true, period)}`).join('\n');
}

function fallersSection(rows: Ranked[], fallback: string): string {
  if (!hasPrevious(rows)) return fallback;
  const fallers = rows
    .filter((r) => r.movement != null && (r.movement as number) < 0)
    .sort((a, b) => (a.movement as number) - (b.movement as number))
    .slice(0, 5);
  if (!fallers.length) return fallback;
  return fallers.map((r) => `- ${moverSentence(r, false, 'this week')}`).join('\n');
}

function keyResultsSection(
  rows: Ranked[],
  fixtures: StoredFixture[],
  season: string,
  sinceISO: string,
  intro: string,
  fallback: string,
): string {
  const rankOf = new Map<string, number>();
  const nameOf = new Map<string, string>();
  rows.forEach((r) => {
    rankOf.set(r.teamId, r.rank ?? 0);
    nameOf.set(r.teamId, r.name);
  });
  const since = sinceISO.slice(0, 10);

  type Key = { weight: number; date: string; line: string };
  const key: Key[] = [];
  for (const f of fixtures) {
    if (f.season !== season || f.status !== 'complete') continue;
    if (f.homeScore == null || f.awayScore == null) continue;
    if (f.date < since) continue;
    const hr = rankOf.get(f.homeSchool);
    const ar = rankOf.get(f.awaySchool);
    if (hr == null || ar == null) continue;
    const hp = f.homeScore;
    const ap = f.awayScore;
    const winnerRank = hp > ap ? hr : ap > hp ? ar : null;
    const loserRank = hp > ap ? ar : ap > hp ? hr : null;

    let isKey = false;
    let weight = 99;
    if (winnerRank != null && loserRank != null && winnerRank > loserRank) { isKey = true; weight = 0; }
    else if (loserRank != null && loserRank <= 20) { isKey = true; weight = 1; }
    else if (Math.abs(hr - ar) <= 5) { isKey = true; weight = 2; }
    else if (hr <= 20 && ar <= 20) { isKey = true; weight = 3; }

    if (isKey) {
      key.push({
        weight,
        date: f.date,
        line: `${nameOf.get(f.homeSchool)} ${hp} – ${ap} ${nameOf.get(f.awaySchool)}`,
      });
    }
  }
  if (!key.length) return fallback;
  key.sort((a, b) => (a.weight !== b.weight ? a.weight - b.weight : b.date.localeCompare(a.date)));
  return `${intro}\n\n${key.slice(0, 8).map((k) => `- ${k.line}`).join('\n')}`;
}

function seasonClimbersSection(rows: Ranked[], fallback: string): string {
  const gainers = rows
    .map((r) => ({ r, gain: r.rating - r.startingRating }))
    .filter((g) => g.gain > 0.01)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 5);
  if (!gainers.length) return fallback;
  return gainers
    .map(({ r, gain }) =>
      `- ${r.name} gained +${gain.toFixed(2)} ranking points across the season, finishing ${ordinal(r.rank ?? 0)} with a rating of ${r.rating.toFixed(2)}.`,
    )
    .join('\n');
}

function fullTable(rows: StandingRow[]): string {
  if (!rows.length) return 'No rankings available.';
  const lines = ['| # | Team | Win% | Rating | +/- |', '| --- | --- | --- | --- | --- |'];
  rows.forEach((r, i) => {
    const decided = r.wins + r.losses;
    const win = decided > 0 ? ((r.wins / decided) * 100).toFixed(2) : '—';
    const mv = r.movement;
    const mvTxt = mv == null ? 'NEW' : mv > 0 ? `▲ ${mv}` : mv < 0 ? `▼ ${Math.abs(mv)}` : '—';
    lines.push(`| ${i + 1} | ${r.name} | ${win} | ${r.rating.toFixed(2)} | ${mvTxt} |`);
  });
  return lines.join('\n');
}

// ── weekly post ─────────────────────────────────────────────────────────────

export async function generateWeeklyPost(opts: { force?: boolean; now?: Date } = {}): Promise<AutoPostResult> {
  const now = opts.now ?? new Date();
  const site = await getSiteSettings();
  const cfg = settings(site);

  if (!cfg.enabled && !opts.force) return { kind: 'weekly', created: false, skipped: 'disabled' };

  const season = getCurrentSeason();
  const rows = await getStandings(season);

  if (!rows.length) return { kind: 'weekly', created: false, skipped: 'no-standings' };

  const ranked = withRank(rows);
  const sig = signatureOf(rows);
  if (!opts.force && cfg.onlyWhenChanged && cfg.lastSignature === sig) {
    return { kind: 'weekly', created: false, skipped: 'no-change' };
  }

  const fixtures = await readFixtures().catch(() => [] as StoredFixture[]);
  const names = topNames(ranked);
  const liveUrl = `/school-rugby-rankings/${season}`;
  const dayMonth = fmtDayMonth(now);
  const sub = (s: string) =>
    s
      .replaceAll('{season}', season)
      .replaceAll('{date}', dayMonth)
      .replaceAll('{top_1}', names.top_1)
      .replaceAll('{top_2}', names.top_2)
      .replaceAll('{top_3}', names.top_3)
      .replaceAll('{top_4}', names.top_4)
      .replaceAll('{methodology_url}', METHODOLOGY_URL)
      .replaceAll('{live_url}', liveUrl);

  const sinceISO = cfg.lastRunAt ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const body = [
    sub('The latest Rugby Ignite school rugby rankings have been updated after another weekend of South African school rugby. The {season} Season Rankings reflect verified results added to Rugby Ignite, with movement influenced by opponent strength, current form and ranking points gained or lost.'),
    '## Top 10 School Rugby Rankings',
    sub('The latest top 10 is led by {top_1}, followed by {top_2}, {top_3} and {top_4}. The leading group reflects the strongest results recorded in the Rugby Ignite rankings system for the {season} season.'),
    topTenTable(ranked),
    '## Biggest Movers This Week',
    moversSection(ranked, 'Biggest mover data will appear once Rugby Ignite has enough weekly ranking history to compare updates.'),
    '## Teams That Dropped This Week',
    fallersSection(ranked, 'Ranking movement data will appear once Rugby Ignite has enough weekly ranking history to compare updates.'),
    '## Key Results Linked to This Ranking Update',
    keyResultsSection(
      ranked,
      fixtures,
      season,
      sinceISO,
      'Several verified results were linked to movement in the latest Rugby Ignite rankings, especially fixtures involving closely ranked teams, top-ranked schools, or lower-rated teams beating higher-rated opposition.',
      'The latest ranking movement is based on verified results added to Rugby Ignite during the update period.',
    ),
    sub('## Full School Rugby Rankings {season}'),
    fullTable(ranked),
    sub('Rugby Ignite rankings are based on a points-based system adapted from the World Rugby ranking model for South African school rugby. Learn more about [how the Rugby Ignite school rugby rankings work]({methodology_url}).'),
    sub('[View the latest live South African school rugby rankings on Rugby Ignite]({live_url}).'),
  ].join('\n\n');

  const title = sub('School Rugby Rankings {season}: {date} Update');
  const desired = slugify(sub('school-rugby-rankings-{season}-{date_slug}-update').replace('{date_slug}', slugify(dayMonth)));
  const id = await uniquePostId(desired || title);
  const status = opts.force ? cfg.status : cfg.status;

  await savePost({
    id,
    slug: slugify(desired) || id,
    title,
    excerpt: sub('The {season} school rugby rankings have been updated after the latest round of results — see the new top 10, the biggest movers and the full table.'),
    author: AUTHOR,
    date: now.toISOString().slice(0, 10),
    status,
    body,
  });

  await saveSiteSettings({
    ...site,
    autoPost: { ...cfg, lastRunAt: now.toISOString(), lastPostId: id, lastSignature: sig },
  });

  return { kind: 'weekly', created: true, postId: id, title, slug: slugify(desired) || id, status };
}

// ── end-of-season post ──────────────────────────────────────────────────────

function lastFixtureDate(fixtures: StoredFixture[], season: string): string | null {
  let latest: string | null = null;
  for (const f of fixtures) {
    if (f.season === season && f.status === 'complete' && (!latest || f.date > latest)) latest = f.date;
  }
  return latest;
}

export async function maybeEndOfSeasonPost(opts: { force?: boolean; now?: Date } = {}): Promise<AutoPostResult> {
  const now = opts.now ?? new Date();
  const site = await getSiteSettings();
  const cfg = settings(site);
  const season = getCurrentSeason();

  if (!opts.force) {
    if (!cfg.eosEnabled) return { kind: 'final', created: false, skipped: 'disabled' };
    if ((cfg.eosPublishedSeasons ?? []).includes(season)) return { kind: 'final', created: false, skipped: 'already-published' };
    const fixtures = await readFixtures().catch(() => [] as StoredFixture[]);
    const last = lastFixtureDate(fixtures, season);
    if (!last) return { kind: 'final', created: false, skipped: 'no-fixtures' };
    const eligible = new Date(`${last}T00:00:00Z`).getTime() + (cfg.eosDelayDays ?? 3) * 24 * 60 * 60 * 1000;
    if (now.getTime() < eligible) return { kind: 'final', created: false, skipped: 'too-early' };
  }

  const masterRows = await getStandings('master');
  if (!masterRows.length) return { kind: 'final', created: false, skipped: 'no-standings' };
  const ranked = withRank(masterRows);

  const names = topNames(ranked);
  const liveUrl = `/school-rugby-rankings/${season}`;
  const sub = (s: string) =>
    s
      .replaceAll('{season}', season)
      .replaceAll('{top_1}', names.top_1)
      .replaceAll('{top_2}', names.top_2)
      .replaceAll('{top_3}', names.top_3)
      .replaceAll('{top_4}', names.top_4)
      .replaceAll('{methodology_url}', METHODOLOGY_URL)
      .replaceAll('{live_url}', liveUrl);

  const body = [
    sub('The final Rugby Ignite school rugby rankings for the {season} season have been published after the scheduled school rugby season concluded. The final table reflects verified results added to Rugby Ignite by the time of publication.'),
    '## Final Top 10 School Rugby Rankings',
    sub('The final top 10 for the {season} season is led by {top_1}, followed by {top_2}, {top_3} and {top_4}.'),
    topTenTable(ranked),
    '## Biggest Climbers of the Season',
    seasonClimbersSection(ranked, 'Season movement data will appear once Rugby Ignite has enough ranking history to compare the start and end of the season.'),
    '## Strong Late-Season Movement',
    moversSection(ranked, 'Late-season movement data was not available for this final ranking post.', 'late in the season'),
    sub('## Final School Rugby Rankings {season}'),
    fullTable(ranked),
    sub('Rugby Ignite rankings are based on a points-based system adapted from the World Rugby ranking model for South African school rugby. Learn more about [how the Rugby Ignite school rugby rankings work]({methodology_url}).'),
    sub('[View the latest South African school rugby rankings on Rugby Ignite]({live_url}).'),
  ].join('\n\n');

  const title = sub('Final South African School Rugby Rankings {season}');
  const desired = slugify(sub('final-south-african-school-rugby-rankings-{season}'));
  const id = await uniquePostId(desired || title);

  await savePost({
    id,
    slug: slugify(desired) || id,
    title,
    excerpt: sub('The final {season} South African school rugby rankings — the season top 10, the biggest climbers and the complete all-time table.'),
    author: AUTHOR,
    date: now.toISOString().slice(0, 10),
    status: cfg.status,
    body,
  });

  await saveSiteSettings({
    ...site,
    autoPost: { ...cfg, eosPublishedSeasons: Array.from(new Set([...(cfg.eosPublishedSeasons ?? []), season])) },
  });

  return { kind: 'final', created: true, postId: id, title, slug: slugify(desired) || id, status: cfg.status };
}
