import type { Post } from '../types';
import postsSeed from '../../data/seed/posts.json';

/**
 * Seed news content, imported from the live Rugby Ignite WordPress site
 * (scripts/import-wordpress-posts.mjs). Bodies are in the site's markdown-lite
 * format (headings, lists, bold/italic, links, images, pipe tables), rendered
 * by src/lib/content.tsx. Stored edits in Firestore override these by id.
 */
export const DEFAULT_POSTS: Post[] = postsSeed as unknown as Post[];
