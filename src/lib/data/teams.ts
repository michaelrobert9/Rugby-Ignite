import type { Team } from '../types';
import { deleteItem, getItem, readCollection, setItem } from './store';

const COLLECTION = 'teams';

export async function listTeams(): Promise<Team[]> {
  return readCollection<Team[]>(COLLECTION);
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return getItem<Team>(COLLECTION, id);
}

export async function saveTeam(team: Team): Promise<void> {
  await setItem(COLLECTION, team.id, team);
}

export async function deleteTeam(id: string): Promise<void> {
  await deleteItem(COLLECTION, id);
}

export async function nextTeamId(): Promise<string> {
  const teams = await listTeams();
  let n = teams.length + 1;
  const existing = new Set(teams.map((t) => t.id));
  while (existing.has(`t-new-${n}`)) n++;
  return `t-new-${n}`;
}
