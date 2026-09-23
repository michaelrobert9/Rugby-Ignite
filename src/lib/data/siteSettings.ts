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
  /** Ranking sponsor (main): shown in the band between the page title and the
   *  table, on the home page and as the fallback on province pages. */
  sponsor?: Sponsor;
  /** Per-province sponsor overrides, keyed by province key (e.g. "gauteng").
   *  A province with its own sponsor shows it; otherwise it inherits the main. */
  provinceSponsors?: Record<string, Sponsor>;
  /** Legacy flat fields (pre per-province). Read as a fallback for `sponsor`. */
  sponsorName?: string;
  sponsorUrl?: string;
}

/** A ranking naming partner. `label` overrides the "In association with" lead-in;
 *  `logoUrl` (an image URL) is shown instead of the name when set. */
export interface Sponsor {
  name: string;
  logoUrl: string;
  url: string;
  label: string;
}

export const DEFAULT_SPONSOR_LABEL = 'In association with';

/** The effective sponsor for a scope: a province's own sponsor when it has one,
 *  otherwise the main sponsor (with legacy fields as a last fallback). Returns
 *  null when there is nothing to show (no name and no logo). */
export function resolveSponsor(site: SiteSettings, provinceKey?: string): Sponsor | null {
  const main: Sponsor =
    site.sponsor ?? { name: site.sponsorName ?? '', logoUrl: '', url: site.sponsorUrl ?? '', label: '' };
  let s = main;
  if (provinceKey) {
    const p = site.provinceSponsors?.[provinceKey];
    if (p && (p.name?.trim() || p.logoUrl?.trim())) s = p;
  }
  if (!s.name?.trim() && !s.logoUrl?.trim()) return null;
  return {
    name: s.name?.trim() ?? '',
    logoUrl: s.logoUrl?.trim() ?? '',
    url: s.url?.trim() ?? '',
    label: s.label?.trim() || DEFAULT_SPONSOR_LABEL,
  };
}

const COLLECTION = 'site';

const DEFAULTS: SiteSettings = {
  adsenseClient: '',
  adsTxt: '',
  adsense: { slotTop: '3417521276', slotMid: '1896556042', slotBottom: '1367529272' },
  seoTitle: 'School Rugby Rankings {season} | South African First Team Rankings — Rugby Ignite',
  seoDescription:
    'View the latest South African school rugby rankings for the {season} season — first team form, ranking points, movement and results, plus the All-Time School Rugby Ratings.',
  seoKeywords:
    'school rugby rankings, South African school rugby, first team rankings, schoolboy rugby, rugby rankings {season}, Rugby Ignite',
  gaMeasurementId: '',
  sponsor: { name: '', logoUrl: '', url: '', label: '' },
  provinceSponsors: {},
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
