// The lead-story ladder (GENERATION.md §1). A fixed priority list — the first
// rule that fires wins and owns its sentence. L9 always fires, so the home page
// can never be empty. Rules that need data Rugby Ignite doesn't hold (upcoming
// fixtures for L6, so also the fixture-stakes rule) simply never fire — a
// guardrail, not a gap: the generator never fabricates what it cannot compute.
//
// The rule id is kept for debugging but is NOT shown in production (README §1);
// the eyebrow carries a human label instead.

import { fmtRating, fmtDelta, offSeasonSentence } from './sentences';
import { getSiteBuild } from '../store/read';
import { listSnapshots, readBuildMeta } from '../store/stateStore';
import type { CadenceMode, StandingRow } from '../store/types';

export interface LeadStory {
  ruleId: string;
  eyebrow: string;
  headline: string;
  standfirst: string;
}

export interface LeadStoryInputs {
  leader: StandingRow | null;
  runnerUp: StandingRow | null;
  priorLeaderId: string | null;
  everLedIds: Set<string>;
  biggestMover: { row: StandingRow; delta: number } | null;
  cadence: CadenceMode;
  weeksSinceLastFixture: number | null;
  round: number | null;
  movedThisWeek: boolean;
}

function eyebrow(label: string, round: number | null, cadence: CadenceMode): string {
  const parts = [round != null ? `Round ${round}` : null, label].filter(Boolean);
  if (cadence === 'off-season') return 'Off-season';
  if (cadence === 'festival') return `Festival · ${label}`;
  return parts.join(' · ') || label;
}

/** Pure ladder evaluation — deterministic from its inputs. */
export function evaluateLeadStory(i: LeadStoryInputs): LeadStory {
  const { leader, runnerUp, cadence, round } = i;

  if (!leader) {
    return {
      ruleId: 'L9',
      eyebrow: 'No fixtures yet',
      headline: 'No first team rugby has been rated yet.',
      standfirst: 'The rankings publish the moment the first verified result is captured on Match Pulse.',
    };
  }

  const gap = runnerUp ? leader.rating - runnerUp.rating : null;
  const runnerLine = runnerUp && gap != null
    ? `${runnerUp.name} are second on ${fmtRating(runnerUp.rating)}, ${fmtDelta(gap)} behind.`
    : 'No other school is within reach at the top.';

  // L1 / L2 — the leader changed since the last snapshot.
  const leaderChanged = i.priorLeaderId != null && i.priorLeaderId !== leader.teamId;
  if (leaderChanged) {
    const firstEver = !i.everLedIds.has(leader.teamId);
    return {
      ruleId: firstEver ? 'L1' : 'L2',
      eyebrow: eyebrow('Lead change', round, cadence),
      headline: firstEver
        ? `${leader.name} are ranked first for the first time.`
        : `${leader.name} take top spot for the first time this season.`,
      standfirst: `${leader.name} now lead the School Rugby Rankings on ${fmtRating(leader.rating)}. ${runnerLine}`,
    };
  }

  // L3 — the largest rating swing of the round is ≥ 4.00.
  if (i.biggestMover && Math.abs(i.biggestMover.delta) >= 4) {
    const { row, delta } = i.biggestMover;
    const dir = delta > 0 ? 'gain' : 'shed';
    return {
      ruleId: 'L3',
      eyebrow: eyebrow('Biggest swing', round, cadence),
      headline: `${row.name} ${dir} ${fmtDelta(delta)} rating points, the largest swing of the round.`,
      standfirst: `${row.name} sit on ${fmtRating(row.rating)}. ${leader.name} lead on ${fmtRating(leader.rating)}.`,
    };
  }

  // L7 — the ratings moved this week; report the standing leader.
  if (i.movedThisWeek) {
    return {
      ruleId: 'L7',
      eyebrow: eyebrow('This week', round, cadence),
      headline: `${leader.name} lead the School Rugby Rankings on ${fmtRating(leader.rating)}.`,
      standfirst: runnerLine,
    };
  }

  // L8 — a mid-season break (a gap, but under six weeks).
  if (i.weeksSinceLastFixture != null && i.weeksSinceLastFixture >= 1 && i.weeksSinceLastFixture < 6) {
    return {
      ruleId: 'L8',
      eyebrow: 'This week',
      headline: `No rugby this week. ${leader.name} lead on ${fmtRating(leader.rating)}.`,
      standfirst: runnerLine,
    };
  }

  // L9 — off-season floor. Always fires if nothing above did.
  const weeks = i.weeksSinceLastFixture ?? 6;
  return {
    ruleId: 'L9',
    eyebrow: 'Off-season',
    headline: `No first team rugby has been played for ${weeks} ${weeks === 1 ? 'week' : 'weeks'}.`,
    standfirst: offSeasonSentence(weeks, leader.name, leader.rating, round),
  };
}

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
function captureDay(now: Date): string {
  return new Date(now.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Assemble the ladder inputs from the store and evaluate. */
export async function getLeadStory(now: Date = new Date()): Promise<LeadStory> {
  const [build, snapshots, meta] = await Promise.all([
    getSiteBuild(),
    listSnapshots('master'),
    readBuildMeta(),
  ]);

  const master = build.standingsByScope['master'] ?? [];
  const leader = master[0] ?? null;
  const runnerUp = master[1] ?? null;

  const today = captureDay(now);
  const priorSnaps = snapshots.filter((s) => s.date < today);
  const priorLeaderId = priorSnaps[0]?.rows[0]?.teamId ?? null;
  const everLedIds = new Set<string>();
  for (const s of priorSnaps) {
    const top = s.rows[0]?.teamId;
    if (top) everLedIds.add(top);
  }

  let biggestMover: { row: StandingRow; delta: number } | null = null;
  for (const row of master) {
    if (row.weekPoints == null) continue;
    if (!biggestMover || Math.abs(row.weekPoints) > Math.abs(biggestMover.delta)) {
      biggestMover = { row, delta: row.weekPoints };
    }
  }
  const movedThisWeek = master.some((r) => r.weekPoints != null && r.weekPoints !== 0);

  const cadence = meta?.cadence ?? build.meta?.cadence ?? 'ordinary';
  const lastDate = meta?.lastFixtureDate ?? build.meta?.lastFixtureDate ?? null;
  const weeksSinceLastFixture = lastDate
    ? Math.floor((now.getTime() - new Date(`${lastDate}T00:00:00Z`).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  return evaluateLeadStory({
    leader,
    runnerUp,
    priorLeaderId,
    everLedIds,
    biggestMover,
    cadence,
    weeksSinceLastFixture,
    round: meta?.round ?? null,
    movedThisWeek,
  });
}
