import type { Match } from '../types';
import { deleteItem, getItem, queryItems, readCollection, setItem } from './store';

const COLLECTION = 'matches';

export async function listMatches(): Promise<Match[]> {
  return readCollection<Match[]>(COLLECTION);
}

export async function getMatch(id: string): Promise<Match | undefined> {
  return getItem<Match>(COLLECTION, id);
}

export async function listMatchesForTeam(teamId: string): Promise<Match[]> {
  // Two targeted queries (home + away) instead of scanning every match, so a
  // public team page reads a handful of documents rather than thousands.
  const [asHome, asAway] = await Promise.all([
    queryItems<Match>(COLLECTION, 'homeTeamId', '==', teamId),
    queryItems<Match>(COLLECTION, 'awayTeamId', '==', teamId),
  ]);
  const byId = new Map<string, Match>();
  for (const m of [...asHome, ...asAway]) byId.set(m.id, m);
  return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveMatch(match: Match): Promise<void> {
  await setItem(COLLECTION, match.id, match);
}

export async function deleteMatch(id: string): Promise<void> {
  await deleteItem(COLLECTION, id);
}

export async function nextMatchId(): Promise<string> {
  const existing = new Set((await listMatches()).map((m) => m.id));
  let n = existing.size + 1;
  while (existing.has(`m-new-${n}`)) n++;
  return `m-new-${n}`;
}

export async function listSeasons(): Promise<string[]> {
  return Array.from(new Set((await listMatches()).map((m) => m.season))).sort();
}
