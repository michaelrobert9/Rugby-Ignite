'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { deleteMatch, nextMatchId, saveMatch } from './data/matches';
import { deleteTeam, nextTeamId, saveTeam } from './data/teams';
import { deleteVenue, nextVenueId, saveVenue } from './data/venues';
import { getConfig, saveConfig } from './data/config';
import { rebuildRankings } from './data/rankings';
import { PROVINCES, type Match, type MatchStatus, type Province, type RankingConfig, type Team, type Venue } from './types';

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function num(fd: FormData, key: string, fallback = 0): number {
  const v = str(fd, key);
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------- Teams ----------------

export async function saveTeamAction(formData: FormData) {
  const idInput = str(formData, 'id');
  const id = idInput || (await nextTeamId());
  const province = str(formData, 'province');
  const homeVenueId = str(formData, 'homeVenueId');

  const team: Team = {
    id,
    name: str(formData, 'name'),
    province: PROVINCES.includes(province as Province) ? (province as Province) : null,
    homeVenueId: homeVenueId || null,
    logoUrl: str(formData, 'logoUrl') || null,
    needsReview: formData.get('needsReview') === 'on',
  };
  await saveTeam(team);
  revalidatePath('/admin/teams');
  revalidatePath('/');
  revalidatePath(`/teams/${id}`);
  redirect('/admin/teams');
}

export async function deleteTeamAction(formData: FormData) {
  const id = str(formData, 'id');
  await deleteTeam(id);
  revalidatePath('/admin/teams');
  redirect('/admin/teams');
}

// ---------------- Venues ----------------

export async function saveVenueAction(formData: FormData) {
  const idInput = str(formData, 'id');
  const name = str(formData, 'name');
  const id = idInput || (await nextVenueId(name));

  const venue: Venue = {
    id,
    name,
    isNeutral: formData.get('isNeutral') === 'on',
  };
  await saveVenue(venue);
  revalidatePath('/admin/venues');
  redirect('/admin/venues');
}

export async function deleteVenueAction(formData: FormData) {
  const id = str(formData, 'id');
  await deleteVenue(id);
  revalidatePath('/admin/venues');
  redirect('/admin/venues');
}

// ---------------- Matches ----------------

export async function saveMatchAction(formData: FormData) {
  const idInput = str(formData, 'id');
  const id = idInput || (await nextMatchId());
  const homePointsStr = str(formData, 'homePoints');
  const awayPointsStr = str(formData, 'awayPoints');
  const venueId = str(formData, 'venueId');
  const status = str(formData, 'status') as MatchStatus;
  const dateInput = str(formData, 'date');
  const date = dateInput.length === 16 ? `${dateInput}:00` : dateInput;

  const match: Match = {
    id,
    homeTeamId: str(formData, 'homeTeamId'),
    awayTeamId: str(formData, 'awayTeamId'),
    homePoints: homePointsStr === '' ? null : Number(homePointsStr),
    awayPoints: awayPointsStr === '' ? null : Number(awayPointsStr),
    date,
    season: str(formData, 'season'),
    venueId: venueId || null,
    isFestival: formData.get('isFestival') === 'on',
    rankingEligible: formData.get('rankingEligible') === 'on',
    status: (['scheduled', 'played', 'cancelled', 'postponed'] as MatchStatus[]).includes(status) ? status : 'played',
  };
  await saveMatch(match);
  revalidatePath('/admin/matches');
  revalidatePath('/');
  redirect('/admin/matches');
}

export async function deleteMatchAction(formData: FormData) {
  const id = str(formData, 'id');
  await deleteMatch(id);
  revalidatePath('/admin/matches');
  redirect('/admin/matches');
}

// ---------------- Config ----------------

export async function saveConfigAction(formData: FormData) {
  const current = await getConfig();
  const config: RankingConfig = {
    ...current,
    kMaster: num(formData, 'kMaster', current.kMaster),
    masterSafetyCap: num(formData, 'masterSafetyCap', current.masterSafetyCap),
    kSeason: num(formData, 'kSeason', current.kSeason),
    seedFactor: num(formData, 'seedFactor', current.seedFactor),
    seasonMarginMultiplier: num(formData, 'seasonMarginMultiplier', current.seasonMarginMultiplier),
    seasonUpsetMultiplier: num(formData, 'seasonUpsetMultiplier', current.seasonUpsetMultiplier),
    seasonSafetyCap: num(formData, 'seasonSafetyCap', current.seasonSafetyCap),
    marginThreshold: num(formData, 'marginThreshold', current.marginThreshold),
    upsetThreshold: num(formData, 'upsetThreshold', current.upsetThreshold),
    homeAdvantage: num(formData, 'homeAdvantage', current.homeAdvantage),
    ratingDivisor: num(formData, 'ratingDivisor', current.ratingDivisor),
    baselineRating: num(formData, 'baselineRating', current.baselineRating),
    currentSeason: str(formData, 'currentSeason') || current.currentSeason,
    masterTitle: str(formData, 'masterTitle') || current.masterTitle,
    seasonTitle: str(formData, 'seasonTitle') || current.seasonTitle,
  };
  await saveConfig(config);
  revalidatePath('/admin/settings');
  revalidatePath('/');
  redirect('/admin/settings?saved=1');
}

// ---------------- Rebuild ----------------

export async function rebuildAction() {
  await rebuildRankings();
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/provinces');
  redirect('/admin?rebuilt=1');
}
