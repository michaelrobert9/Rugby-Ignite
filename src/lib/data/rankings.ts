import { runFullRecalculation } from '../rankingEngine';
import type { MatchRating, Scope, TeamRating } from '../types';
import { getConfig } from './config';
import { listMatches } from './matches';
import { listTeams } from './teams';
import { queryItems, readCollection, writeCollection } from './store';

type RankingsStore = Record<string, TeamRating[]>;

interface RebuildMeta {
  lastRebuiltAt: string | null;
  matchesConsidered: number;
  teamsRanked: number;
  scopes: string[];
}

export async function rebuildRankings(now: Date = new Date()): Promise<RebuildMeta> {
  const [matches, teams, config] = await Promise.all([listMatches(), listTeams(), getConfig()]);

  const { teamRatings, matchRatings } = runFullRecalculation(matches, teams, config, now);

  const rankingsOut: RankingsStore = {};
  for (const [scope, teamMap] of teamRatings) {
    rankingsOut[scope] = Array.from(teamMap.values());
  }
  await writeCollection('rankings', rankingsOut);
  await writeCollection('matchRatings', matchRatings);

  const meta: RebuildMeta = {
    lastRebuiltAt: now.toISOString(),
    matchesConsidered: matches.filter((m) => m.rankingEligible && m.status === 'played').length,
    teamsRanked: teamRatings.get('master')?.size ?? 0,
    scopes: Array.from(teamRatings.keys()),
  };
  await writeCollection('meta', meta);

  return meta;
}

export async function getRebuildMeta(): Promise<RebuildMeta> {
  try {
    return await readCollection<RebuildMeta>('meta');
  } catch {
    return { lastRebuiltAt: null, matchesConsidered: 0, teamsRanked: 0, scopes: [] };
  }
}

async function loadRankingsStore(): Promise<RankingsStore> {
  try {
    return await readCollection<RankingsStore>('rankings');
  } catch {
    return {};
  }
}

/** Ranking rows for one scope ('master' or a season year), sorted best-first. */
export async function getRankingsForScope(scope: Scope): Promise<TeamRating[]> {
  const store = await loadRankingsStore();
  const rows = store[scope] ?? [];
  return rows.slice().sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst);
  });
}

export async function listScopes(): Promise<string[]> {
  return Object.keys(await loadRankingsStore());
}

export async function getTeamRating(teamId: string, scope: Scope): Promise<TeamRating | undefined> {
  const store = await loadRankingsStore();
  return store[scope]?.find((r) => r.teamId === teamId);
}

export async function getMatchRatingsForTeam(teamId: string, scope: Scope): Promise<MatchRating[]> {
  try {
    const rows = await queryItems<MatchRating>('matchRatings', 'teamId', '==', teamId);
    return rows
      .filter((r) => r.scope === scope)
      .sort((a, b) => b.matchDate.localeCompare(a.matchDate));
  } catch {
    return [];
  }
}
