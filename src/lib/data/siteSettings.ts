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
   *  table, always on the home page. */
  sponsor?: Sponsor;
  /** When true (default), the main sponsor also shows on EVERY province page and
   *  overrides any per-province sponsor. When false, the main sponsor shows only
   *  on the home page and each province shows its own sponsor (or nothing). */
  sponsorEverywhere?: boolean;
  /** Per-province sponsor overrides, keyed by province key (e.g. "gauteng").
   *  Used only when `sponsorEverywhere` is false. */
  provinceSponsors?: Record<string, Sponsor>;
  /** Legacy flat fields (pre per-province). Read as a fallback for `sponsor`. */
  sponsorName?: string;
  sponsorUrl?: string;
  /** Weekly + end-of-season auto-posting (ported from the WordPress plugin). */
  autoPost?: AutoPostSettings;
}

export interface AutoPostSettings {
  /** Master switch for the weekly post. */
  enabled: boolean;
  /** Only publish a weekly post when the ranking has changed since the last one. */
  onlyWhenChanged: boolean;
  /** Publish immediately, or save as a draft for review. */
  status: 'published' | 'draft';
  /** Publish the end-of-season wrap-up (once per season, after the last fixture). */
  eosEnabled: boolean;
  /** Days to wait after the season's final fixture before the EOS post is eligible. */
  eosDelayDays: number;
  /** Bookkeeping, written by the generator. */
  lastRunAt?: string;
  lastPostId?: string;
  lastSignature?: string; // change-detection fingerprint of the last posted table
  eosPublishedSeasons?: string[]; // seasons whose EOS post has been published
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

/** The effective sponsor for a scope. The home page always uses the main
 *  sponsor. A province page uses the main sponsor when `sponsorEverywhere` is on
 *  (the default — it overrides every province), otherwise the province's own
 *  sponsor with NO fallback to main. Returns null when there is nothing to show. */
export function resolveSponsor(site: SiteSettings, provinceKey?: string): Sponsor | null {
  const main: Sponsor =
    site.sponsor ?? { name: site.sponsorName ?? '', logoUrl: '', url: site.sponsorUrl ?? '', label: '' };
  const everywhere = site.sponsorEverywhere !== false; // default true

  let s: Sponsor;
  if (!provinceKey || everywhere) {
    s = main; // home always; provinces too when "everywhere" is on
  } else {
    s = site.provinceSponsors?.[provinceKey] ?? { name: '', logoUrl: '', url: '', label: '' };
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
  sponsorEverywhere: true,
  provinceSponsors: {},
  sponsorName: '',
  sponsorUrl: '',
  autoPost: {
    enabled: false,
    onlyWhenChanged: true,
    status: 'published',
    eosEnabled: false,
    eosDelayDays: 3,
    eosPublishedSeasons: [],
  },
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
