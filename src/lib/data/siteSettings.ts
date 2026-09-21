import { readCollection, writeCollection } from './store';

// Site-wide settings (not ranking-specific): AdSense and ads.txt. Stored as a
// single 'site' document; falls back to empty defaults when unset.

export interface SiteSettings {
  /** AdSense publisher id, e.g. "ca-pub-1234567890123456". Empty = ads off. */
  adsenseClient: string;
  /** Contents served at /ads.txt (one line per network). */
  adsTxt: string;
  /** Explicit rankings ad-unit slot ids. Empty string for a slot = no ad there. */
  adsense?: {
    slotTop: string;
    slotMid: string;
    slotBottom: string;
  };
  /** Site-wide SEO. {season} is replaced with the current season year. */
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  /** Google Analytics measurement id (e.g. "G-XXXXXXXXXX"). Empty = analytics off. */
  gaMeasurementId?: string;
  /** Ranking sponsor. Shown in the band between the page title and the table;
   *  never inside a row, a rating, the mark or the nav. Empty = band collapses. */
  sponsorName?: string;
  sponsorUrl?: string;
}

const COLLECTION = 'site';

const DEFAULTS: SiteSettings = {
  adsenseClient: '',
  adsTxt: '',
  adsense: { slotTop: '3417521276', slotMid: '1896556042', slotBottom: '1367529272' },
  seoTitle: 'School Rugby Rankings {season} | South African 1st XV Rankings — Rugby Ignite',
  seoDescription:
    'View the latest South African school rugby rankings for the {season} season — 1st XV form, ranking points, movement and results, plus the All-Time School Rugby Ratings.',
  seoKeywords:
    'school rugby rankings, South African school rugby, 1st XV rankings, schoolboy rugby, rugby rankings {season}, Rugby Ignite',
  gaMeasurementId: '',
  sponsorName: '',
  sponsorUrl: '',
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
