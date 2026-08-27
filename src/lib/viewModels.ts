import { getRankingsForScope } from './data/rankings';
import { listTeams } from './data/teams';
import type { Province, Scope, TeamRating } from './types';

export interface RankingRow {
  position: number;
  teamId: string;
  teamName: string;
  province: Province | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winPercent: number;
  rating: number;
  movement: number | null;
}

function toRow(position: number, tr: TeamRating, teamName: string, province: Province | null): RankingRow {
  const winPercent = tr.matchesPlayed > 0 ? Math.round((tr.wins / tr.matchesPlayed) * 1000) / 10 : 0;
  return {
    position,
    teamId: tr.teamId,
    teamName,
    province,
    played: tr.matchesPlayed,
    wins: tr.wins,
    draws: tr.draws,
    losses: tr.losses,
    winPercent,
    rating: tr.rating,
    movement: tr.movement,
  };
}

/** Rankings for a scope ('master' or a season year), optionally restricted to one province. */
export async function getRankingRows(scope: Scope, province?: Province): Promise<RankingRow[]> {
  const [teams, scopeRatings] = await Promise.all([listTeams(), getRankingsForScope(scope)]);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const rows = scopeRatings
    .filter((tr) => !province || teamById.get(tr.teamId)?.province === province)
    .map((tr, i) => toRow(i + 1, tr, teamById.get(tr.teamId)?.name ?? tr.teamId, teamById.get(tr.teamId)?.province ?? null));

  // Re-number positions when filtered to a province, so it reads as that
  // province's own table (position 1..N), not the master leaderboard's
  // absolute position.
  if (province) {
    return rows.map((r, i) => ({ ...r, position: i + 1 }));
  }
  return rows;
}
