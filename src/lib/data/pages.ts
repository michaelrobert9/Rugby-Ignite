import type { Page } from '../types';
import { deleteItem, getItem, readCollection, setItem } from './store';
import { DEFAULT_PAGES } from './defaultPages';

const COLLECTION = 'pages';

/**
 * All CMS pages: the defaults, with any stored edits overriding them (plus any
 * extra stored pages). Merging means editing one page never drops the rest.
 */
export async function listPages(): Promise<Page[]> {
  const stored = await readCollection<Page[]>(COLLECTION).catch(() => [] as Page[]);
  const byId = new Map<string, Page>();
  for (const p of DEFAULT_PAGES) byId.set(p.id, p);
  for (const p of stored) byId.set(p.id, p);
  return Array.from(byId.values());
}

export async function getPage(id: string): Promise<Page | undefined> {
  return (await getItem<Page>(COLLECTION, id)) ?? DEFAULT_PAGES.find((p) => p.id === id);
}

export async function savePage(page: Page): Promise<void> {
  await setItem(COLLECTION, page.id, page);
}

export async function deletePage(id: string): Promise<void> {
  await deleteItem(COLLECTION, id);
}

/** Pages shown in the top navigation, in order. */
export async function navPages(): Promise<Page[]> {
  return (await listPages()).filter((p) => p.showInNav).sort((a, b) => a.navOrder - b.navOrder);
}
