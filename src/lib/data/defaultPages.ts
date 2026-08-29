import { PROVINCE_NAV_ORDER, type Page, type Province } from '../types';

/** URL slug for a province page, e.g. 'Western Cape' -> 'western-cape'. */
export function provinceSlug(province: Province): string {
  return province.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Map a province to its CMS page id (same as its slug). */
export function pageIdForProvince(province: Province): string {
  return provinceSlug(province);
}

const HOME: Page = {
  id: 'home',
  slug: '/',
  navLabel: 'Home',
  navOrder: 0,
  showInNav: true,
  title: 'Master Ranking',
  metaTitle: 'Rugby Ignite — School Rugby Rankings',
  metaDescription: 'Ignite the passion. Honour the game. The complete record of South African school rugby.',
  rankingScope: 'master',
  body: [
    'One continuous rating across every fixture ever played. Never resets.',
    '',
    '[rankings toggle="true"]',
  ].join('\n'),
};

const PROVINCE_PAGES: Page[] = PROVINCE_NAV_ORDER.map((province, i) => ({
  id: pageIdForProvince(province),
  slug: `/${provinceSlug(province)}`,
  navLabel: province,
  navOrder: i + 1,
  showInNav: true,
  title: province,
  metaTitle: `${province} — Rugby Ignite Rankings`,
  metaDescription: `School rugby rankings for ${province}, filtered to fixtures between two ${province} teams.`,
  rankingScope: province,
  body: [
    `The ${province} table, filtered to fixtures between two ${province} teams only.`,
    '',
    '[rankings]',
  ].join('\n'),
}));

/** Seed content for the editable pages. */
export const DEFAULT_PAGES: Page[] = [HOME, ...PROVINCE_PAGES];
