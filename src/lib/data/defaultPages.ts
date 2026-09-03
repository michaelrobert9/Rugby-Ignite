import type { Page } from '../types';

// The home page is now the live rankings view itself (src/app/page.tsx renders
// <LiveRankings/>), so it carries no editable body. It stays here only so the
// nav has a "Home" entry and metadata resolves.
const HOME: Page = {
  id: 'home',
  slug: '/',
  navLabel: 'Home',
  navOrder: 0,
  showInNav: true,
  title: 'Rankings',
  metaTitle: 'Rugby Ignite — School Rugby Rankings',
  metaDescription: 'Live South African school rugby rankings — Master and Season, refreshed as verified results are added.',
  rankingScope: 'master',
  body: '',
};

/** Seed content for the editable pages. */
export const DEFAULT_PAGES: Page[] = [HOME];
