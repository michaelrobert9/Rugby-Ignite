// Article generation (GENERATION.md §2). Articles are Layer 2 — frozen at
// publication, never edited. They are produced during the ingest/rebuild cycle,
// not on page render. Triggers implemented here, in priority order:
//   A3  the leader changed          → a lead-change piece (any day)
//   A4  a round closed (ordinary)   → a round report (Sundays only)
// Festival day/report (A1/A2), climb/fall (A5) and season-in-numbers (A6) are
// scaffolded by the cadence + data but not yet emitted. Cooldown: at most one
// article per calendar day (enforced by the caller via articleExistsOnDate).

import { movementSentence, fmtRating, fmtDelta } from './sentences';
import type { RatingHistoryRow, StandingRow, StoredArticle } from '../store/types';

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

function captureDay(now: Date): string {
  return new Date(now.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

function isSunday(now: Date): boolean {
  // Sunday in SAST (round close).
  return new Date(now.getTime() + SAST_OFFSET_MS).getUTCDay() === 0;
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function longDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(d)
    .toUpperCase();
}

export interface ArticleInputs {
  now: Date;
  season: string;
  cadence: string;
  leader: StandingRow | null;
  priorLeaderId: string | null;
  everLedIds: Set<string>;
  standings: StandingRow[]; // master, sorted, with weekPoints movement
  leaderLastMovement: RatingHistoryRow | null;
  methodVersion: string;
}

/** The changes of the round: schools that moved since the Thursday cutoff, largest first. */
function roundChanges(standings: StandingRow[]): Array<{ name: string; delta: number; rating: number }> {
  return standings
    .filter((r) => r.weekPoints != null && r.weekPoints !== 0)
    .map((r) => ({ name: r.name, delta: r.weekPoints as number, rating: r.rating }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);
}

/** Decide whether to publish an article for today, and build it. Null = nothing to say. */
export function generateArticle(i: ArticleInputs): StoredArticle | null {
  const { now, season, cadence, leader, methodVersion } = i;
  if (!leader || cadence === 'off-season') return null;

  const date = captureDay(now);
  const changes = roundChanges(i.standings);

  // A3 — the leader changed.
  if (i.priorLeaderId && i.priorLeaderId !== leader.teamId) {
    const firstEver = !i.everLedIds.has(leader.teamId);
    const title = firstEver
      ? `${leader.name} are ranked first for the first time`
      : `${leader.name} take top spot`;
    const lead = i.leaderLastMovement
      ? movementSentence(leader.name, i.leaderLastMovement)
      : `${leader.name} lead the School Rugby Rankings on ${fmtRating(leader.rating)}.`;
    const runner = i.standings[1];
    const paragraphs: string[] = [];
    if (runner) {
      paragraphs.push(
        `${runner.name} drop to second on ${fmtRating(runner.rating)}, ${fmtDelta(leader.rating - runner.rating)} rating points behind.`,
      );
    }
    paragraphs.push('Whatever one side gains in a match, the other loses — so a change at the top always names the fixture that caused it.');
    return {
      slug: `${season}/${date}-${kebab(title)}`,
      season,
      date,
      trigger: 'A3',
      title: `${title}.`,
      dateline: `LEAD CHANGE · ${longDate(date)}`,
      lead,
      paragraphs,
      changes,
      methodVersion,
      generatedAt: now.toISOString(),
      supersededBy: null,
    };
  }

  // A4 — a round closed (ordinary cadence, Sundays), and the ratings moved.
  if (cadence === 'ordinary' && isSunday(now) && changes.length > 0) {
    const top = changes[0];
    const dir = top.delta > 0 ? 'gain' : 'shed';
    const lead = `The ratings moved this week across ${changes.length} ${changes.length === 1 ? 'school' : 'schools'}. ${top.name} saw the largest swing, to ${dir} ${fmtDelta(top.delta)} rating points and close on ${fmtRating(top.rating)}.`;
    const paragraphs: string[] = [];
    for (const c of changes.slice(1, 4)) {
      const d = c.delta > 0 ? 'gained' : 'lost';
      paragraphs.push(`${c.name} ${d} ${fmtDelta(c.delta)} rating points, to ${fmtRating(c.rating)}.`);
    }
    paragraphs.push(`${leader.name} lead the School Rugby Rankings on ${fmtRating(leader.rating)}.`);
    return {
      slug: `${season}/${date}-round-report`,
      season,
      date,
      trigger: 'A4',
      title: `Round report: ${top.name} lead the movers.`,
      dateline: `ROUND REPORT · ${longDate(date)} · ${changes.length} ${changes.length === 1 ? 'SCHOOL' : 'SCHOOLS'} MOVED`,
      lead,
      paragraphs,
      changes,
      methodVersion,
      generatedAt: now.toISOString(),
      supersededBy: null,
    };
  }

  return null;
}
