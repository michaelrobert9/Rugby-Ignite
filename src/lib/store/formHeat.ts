// Form Heat — a 0–100 reading of a school's RECENT FORM, opponent-weighted.
//
// Per the owner's decision (2026-09-18): Form Heat is driven by recent results,
// not by the rating value and not by match scores. We read the school's most
// recent rated fixtures on the current-season track and sum their rating-point
// movements — which are already opponent-weighted by the method (beating a
// strong side moves more than beating a weak one). A school on a good run reads
// hot; the table leader can read cold if it has been static. Heat is withheld
// out of season and in festival mode (handled by the caller).

import type { MatchRating } from '../types';
import type { HeatParams } from './methodConfig';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Compute Form Heat for every team on a season scope, from that scope's rating
 * history. `history` may contain rows for any scope; only rows matching `scope`
 * are used. Returns a whole-number 0–100 per team that had at least one rated
 * fixture on the scope (teams with none are absent → caller shows no heat).
 */
export function computeFormHeat(
  history: MatchRating[],
  scope: string,
  heat: HeatParams,
): Map<string, number> {
  const byTeam = new Map<string, MatchRating[]>();
  for (const row of history) {
    if (row.scope !== scope) continue;
    if (!byTeam.has(row.teamId)) byTeam.set(row.teamId, []);
    byTeam.get(row.teamId)!.push(row);
  }

  const out = new Map<string, number>();
  for (const [teamId, rows] of byTeam) {
    // Most recent `window` fixtures, chronological (matchDate, then a stable
    // tiebreak on matchId so same-day order is deterministic).
    rows.sort((a, b) => a.matchDate.localeCompare(b.matchDate) || a.matchId.localeCompare(b.matchId));
    const recent = rows.slice(-heat.window);
    const swing = recent.reduce((sum, r) => sum + r.ratingChange, 0);
    // Neutral form sits at 50 (Warm); a good run heats, a bad run cools.
    out.set(teamId, Math.round(clamp(50 + heat.factor * swing, 0, 100)));
  }
  return out;
}
