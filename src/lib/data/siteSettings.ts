import { readCollection, writeCollection } from './store';

// Site-wide settings (not ranking-specific): AdSense and ads.txt. Stored as a
// single 'site' document; falls back to empty defaults when unset.

export interface SiteSettings {
  /** AdSense publisher id, e.g. "ca-pub-1234567890123456". Empty = ads off. */
  adsenseClient: string;
  /** Contents served at /ads.txt (one line per network). */
  adsTxt: string;
  /** Site-wide SEO. {season} is replaced with the current season year. */
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

const COLLECTION = 'site';

const DEFAULTS: SiteSettings = {
  adsenseClient: '',
  adsTxt: '',
  seoTitle: 'School Rugby Rankings {season} | South African 1st XV Rankings — Rugby Ignite',
  seoDescription:
    'View the latest South African school rugby rankings for the {season} season — 1st XV form, ranking points, movement and results, plus the All-Time School Rugby Ratings.',
  seoKeywords:
    'school rugby rankings, South African school rugby, 1st XV rankings, schoolboy rugby, rugby rankings {season}, Rugby Ignite',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await readCollection<Partial<SiteSettings>>(COLLECTION);
    return { ...DEFAULTS, ...(raw ?? {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await writeCollection(COLLECTION, settings);
}
