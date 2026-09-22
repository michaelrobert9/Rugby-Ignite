// Sentence templates — the editorial voice as code (GENERATION.md §3). Every
// generated line comes from here, so the tone of the whole site changes in one
// place. Each carries exactly one line of method, and obeys the non-negotiable
// wording (§4): "rating" is the number and "ranking" is the position, never
// interchanged; always "rating points", never "points"; "method", never
// "algorithm"; home advantage is never mentioned as a factor; no school is ever
// mocked. Guardrails (§5) live with the callers (leadStory.ts): never a
// superlative that isn't computed, never a characterisation of a defeat.

import type { RatingHistoryRow } from '../store/types';

export function fmtRating(n: number): string {
  return n.toFixed(2);
}

export function fmtDelta(n: number): string {
  return Math.abs(n).toFixed(2);
}

/** The most-read sentence on the site — plain and factual: what moved, and the
 *  match that moved it. No "more/less than a … side" clause (it read the same
 *  for every result and confused more than it explained). */
export function movementSentence(school: string, r: RatingHistoryRow): string {
  if (r.outcome === 'draw') {
    if (Math.abs(r.ratingChange) < 0.005) {
      return `${school} drew ${r.pointsFor}–${r.pointsAgainst} with ${r.opponentName} — no rating points changed.`;
    }
    const dd = r.ratingChange > 0 ? 'gained' : 'lost';
    return `${school} ${dd} ${fmtDelta(r.ratingChange)} rating points drawing ${r.pointsFor}–${r.pointsAgainst} with ${r.opponentName}.`;
  }
  const gainedLost = r.outcome === 'win' ? 'gained' : 'lost';
  const vs = r.outcome === 'win' ? 'beating' : 'losing to';
  return `${school} ${gainedLost} ${fmtDelta(r.ratingChange)} rating points ${vs} ${r.opponentName} ${r.pointsFor}–${r.pointsAgainst}.`;
}

/** Fixture stakes — suppressed in festival mode (caller decides). */
export function fixtureStakesSentence(a: string, b: string, gap: number): string {
  return `${a} and ${b} are separated by ${fmtDelta(gap)}. Saturday decides who is higher.`;
}

/** Form Heat — always paired with a rank/band, never a bare number. */
export function formHeatSentence(school: string, ordinalRank: string): string {
  return `${school} carry the ${ordinalRank}-highest Form Heat in the top ten.`;
}

/** Off-season — states the silence with a live count. */
export function offSeasonSentence(weeks: number, leader: string, rating: number, round: number | null): string {
  const r = round != null ? ` since round ${round}` : '';
  return `No first team rugby has been played for ${weeks} ${weeks === 1 ? 'week' : 'weeks'}. Ratings are unchanged${r} and will stay unchanged until the next recorded fixture. ${leader} finished the season on ${fmtRating(rating)}.`;
}

/** Correction — states what changed at source and what it superseded. */
export function correctionSentence(args: {
  fixture: string;
  newScore: string;
  date: string;
  affected: number;
  from: string;
  to: string;
}): string {
  const { fixture, newScore, date, affected, from, to } = args;
  return `Match Pulse amended ${fixture} to ${newScore} on ${date}. The fixture was re-rated and ${affected} ${affected === 1 ? "school's" : "schools'"} ratings changed as a result. Ranking positions published between ${from} and ${to} were superseded; the original snapshot is preserved in the archive.`;
}

const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

/** Word ordinal for small counts (used in Form Heat / stakes copy). */
export function wordOrdinal(n: number): string {
  return ORDINALS[n] ?? `${n}th`;
}
