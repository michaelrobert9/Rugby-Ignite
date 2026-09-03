import type { Post } from '../types';
import { deleteItem, getItem, readCollection, setItem } from './store';
import { DEFAULT_POSTS } from './defaultPosts';

const COLLECTION = 'posts';

function byDateDesc(a: Post, b: Post): number {
  return b.date.localeCompare(a.date);
}

/** Every post (all statuses), newest first — merges defaults with stored edits. */
export async function listPosts(): Promise<Post[]> {
  const stored = await readCollection<Post[]>(COLLECTION).catch(() => [] as Post[]);
  const byId = new Map<string, Post>();
  for (const p of DEFAULT_POSTS) byId.set(p.id, p);
  for (const p of stored) byId.set(p.id, p);
  return Array.from(byId.values()).sort(byDateDesc);
}

/** Published posts only, newest first — for the public News page. */
export async function listPublishedPosts(): Promise<Post[]> {
  return (await listPosts()).filter((p) => p.status === 'published');
}

export async function getPost(id: string): Promise<Post | undefined> {
  return (await getItem<Post>(COLLECTION, id)) ?? DEFAULT_POSTS.find((p) => p.id === id);
}

export async function savePost(post: Post): Promise<void> {
  await setItem(COLLECTION, post.id, post);
}

export async function deletePost(id: string): Promise<void> {
  await deleteItem(COLLECTION, id);
}

/** Turn a title into a URL-safe slug. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** A unique post id from a desired slug, avoiding collisions with existing ids. */
export async function uniquePostId(desired: string): Promise<string> {
  const base = slugify(desired) || 'post';
  const existing = new Set((await listPosts()).map((p) => p.id));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
