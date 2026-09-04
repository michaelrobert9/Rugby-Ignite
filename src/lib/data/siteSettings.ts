import { readCollection, writeCollection } from './store';

// Site-wide settings (not ranking-specific): AdSense and ads.txt. Stored as a
// single 'site' document; falls back to empty defaults when unset.

export interface SiteSettings {
  /** AdSense publisher id, e.g. "ca-pub-1234567890123456". Empty = ads off. */
  adsenseClient: string;
  /** Contents served at /ads.txt (one line per network). */
  adsTxt: string;
}

const COLLECTION = 'site';

const DEFAULTS: SiteSettings = { adsenseClient: '', adsTxt: '' };

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
