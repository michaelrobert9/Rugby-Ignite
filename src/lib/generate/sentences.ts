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

/** The most-read sentence on the site — one movement, one line of method. */
export function movementSentence(school: string, r: RatingHistoryRow): string {
  if (r.outcome === 'draw') {
    return `${school} drew ${r.pointsFor}–${r.pointsAgainst} with ${r.opponentName}, who were rated ${fmtRating(r.opponentRatingBefore)} going in.`;
  }
  const gainedLost = r.outcome === 'win' ? 'gained' : 'lost';
  const vs = r.outcome === 'win' ? 'beating' : 'losing to';
  const winDefeat = r.outcome === 'win' ? 'win' : 'defeat';
  // "moved more/less than a result against a lower/higher-rated side would" —
  // relative to the opponent's strength, never a value judgement of the rugby.
  const stronger = r.opponentRatingBefore >= r.ratingBefore;
  const moreLess = stronger ? 'more' : 'less';
  const lowerHigher = stronger ? 'lower' : 'higher';
  return `${school} ${gainedLost} ${fmtDelta(r.ratingChange)} rating points ${vs} ${r.opponentName} ${r.pointsFor}–${r.pointsAgainst}. ${r.opponentName} were rated ${fmtRating(r.opponentRatingBefore)} going in, so the ${winDefeat} moved ${moreLess} than a result against a ${lowerHigher}-rated side would.`;
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
  return `No first XV rugby has been played for ${weeks} ${weeks === 1 ? 'week' : 'weeks'}. Ratings are unchanged${r} and will stay unchanged until the next recorded fixture. ${leader} finished the season on ${fmtRating(rating)}.`;
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
