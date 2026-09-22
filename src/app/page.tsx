import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/siteSettings';
import { getStandings, schoolSlug } from '@/lib/store/read';
import { getCurrentSeason, withSeason } from '@/lib/season';
import { DEFAULT_AD_SLOTS } from '@/lib/adsense';
import Link from 'next/link';
import RankingTable from '@/components/RankingTable';
import MatchPulseCTA from '@/components/MatchPulseCTA';
import StoriesStrip from '@/components/StoriesStrip';
import AdUnit from '@/components/AdUnit';
import JsonLd from '@/components/JsonLd';
import { PROVINCES } from '@/lib/matchpulse/provinces';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rugbyignite.co.za').replace(/\/$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  const season = getCurrentSeason();
  return {
    title: withSeason(site.seoTitle || 'South African School Rugby Rankings {season} | Rugby Ignite', season),
    description: withSeason(
      site.seoDescription ||
        'Every South African school first XV rated 0–100 on the Ignite Rating. Tap a school to see the match that moved its rating.',
      season,
    ),
    keywords: site.seoKeywords ? withSeason(site.seoKeywords, season) : undefined,
  };
}

export default async function HomePage() {
  const site = await getSiteSettings();
  const season = getCurrentSeason();
  const bottom = site.adsense?.slotBottom ?? DEFAULT_AD_SLOTS.bottom;

  // Structured data (top 25), mirroring the visible table.
  const master = await getStandings('master');
  const listRows = master.slice(0, 25);

  // Province chips — only provinces actually present in the data.
  const present = new Set(master.map((r) => r.province).filter(Boolean) as string[]);
  const provinceChips = PROVINCES.filter((p) => present.has(p.name));

  return (
    <div className="rir-container py-8 space-y-7">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'The Ignite Rating — South African school rugby first XV ranking',
          numberOfItems: listRows.length,
          itemListElement: listRows.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: r.name,
            item: `${SITE}/#${schoolSlug(r.name)}`,
          })),
        }}
      />

      <div className="space-y-1">
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
          First XV · All recorded fixtures
        </div>
        <h1 className="text-2xl">South African School Rugby Rankings</h1>
        <p className="text-sm" style={{ color: 'var(--body-2)', maxWidth: '60ch' }}>
          Every first team rated 0 to 100. Tap a school to see the match that moved its rating.
        </p>
      </div>

      {provinceChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {provinceChips.map((p) => (
            <Link
              key={p.key}
              href={`/ranking/${p.key}`}
              style={{
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '7px 12px', border: '1px solid var(--rule)', color: 'var(--body)',
              }}
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}

      <RankingTable track="master" ads search />

      {bottom && (
        <div className="rir-ad" aria-label="Advertisement">
          <span className="rir-ad-label">Advertisement</span>
          <AdUnit slot={bottom} />
        </div>
      )}

      <StoriesStrip />

      <MatchPulseCTA />
    </div>
  );
}
