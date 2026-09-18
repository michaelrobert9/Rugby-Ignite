// Correction builder (GENERATION.md §8). When a rated fixture is amended at
// source, Rugby Ignite recomputes from that fixture forward and publishes a
// correction: what changed at source, how many schools it moved, and was/now/
// delta per school. It never edits the record in place — superseded snapshots
// and articles keep their numbers and gain a banner (done by the caller).

import { correctionSentence } from './sentences';
import type { CorrectionRow, StandingRow, StoredCorrection } from '../store/types';

export interface AmendedFixture {
  fixtureId: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
}

export interface CorrectionInputs {
  now: Date;
  id: string;
  amended: AmendedFixture[];
  priorMaster: Map<string, { name: string; rating: number }>; // "was"
  nowMaster: StandingRow[]; // "now"
  fromDate: string;
  toDate: string;
  methodVersion: string;
}

/** Build the correction event from the before/after master standings. Null if nothing moved. */
export function buildCorrection(i: CorrectionInputs): StoredCorrection | null {
  const rows: CorrectionRow[] = [];
  for (const r of i.nowMaster) {
    const was = i.priorMaster.get(r.teamId);
    if (!was) continue; // a brand-new school has no "was"
    const delta = Math.round((r.rating - was.rating) * 100) / 100;
    if (Math.abs(delta) < 0.01) continue;
    rows.push({ teamId: r.teamId, name: r.name, was: was.rating, now: r.rating, delta });
  }
  if (rows.length === 0) return null;
  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const first = i.amended[0];
  const newScore = first && first.homeScore != null && first.awayScore != null
    ? `${first.homeScore}–${first.awayScore}`
    : 'a new result';
  const fixture = first ? `the ${first.homeName} v ${first.awayName} result` : 'a fixture';

  const summary = correctionSentence({
    fixture,
    newScore,
    date: first?.date ?? i.toDate,
    affected: rows.length,
    from: i.fromDate,
    to: i.toDate,
  });

  return {
    id: i.id,
    detectedAt: i.now.toISOString(),
    fixtureId: first?.fixtureId ?? '',
    headline: 'Score amended at source',
    summary,
    scope: 'master',
    fromDate: i.fromDate,
    toDate: i.toDate,
    affected: rows.length,
    rows: rows.slice(0, 30),
  };
}
