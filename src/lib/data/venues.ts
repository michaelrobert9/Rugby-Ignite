import type { Venue } from '../types';
import { deleteItem, getItem, readCollection, setItem } from './store';

const COLLECTION = 'venues';

export async function listVenues(): Promise<Venue[]> {
  return readCollection<Venue[]>(COLLECTION);
}

export async function getVenue(id: string): Promise<Venue | undefined> {
  return getItem<Venue>(COLLECTION, id);
}

export async function saveVenue(venue: Venue): Promise<void> {
  await setItem(COLLECTION, venue.id, venue);
}

export async function deleteVenue(id: string): Promise<void> {
  await deleteItem(COLLECTION, id);
}

export async function nextVenueId(name: string): Promise<string> {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const existing = new Set((await listVenues()).map((v) => v.id));
  let id = `v-${slug}`;
  let n = 2;
  while (existing.has(id)) {
    id = `v-${slug}-${n}`;
    n++;
  }
  return id;
}
