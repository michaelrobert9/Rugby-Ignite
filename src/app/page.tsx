import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/siteSettings';
import { getPage } from '@/lib/data/pages';
import { getStandings, getSiteBuild, schoolSlug } from '@/lib/store/read';
import { getCurrentSeason, withSeason, seasonYears } from '@/lib/season';
import { DEFAULT_AD_SLOTS } from '@/lib/adsense';
import { RichText } from '@/lib/content';
import { rankingShortcodes } from '@/components/rankingShortcodes';
import RankingScopeNav from '@/components/RankingScopeNav';
import RankingTable, { LastUpdatedLine } from '@/components/RankingTable';
import SponsorBand from '@/components/SponsorBand';
import MatchPulseCTA from '@/components/MatchPulseCTA';
import StoriesStrip from '@/components/StoriesStrip';
import AdUnit from '@/components/AdUnit';
import JsonLd from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rugbyignite.co.za').replace(/\/$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  const season = getCurrentSeason();
  return {
    title: withSeason(site.seoTitle || 'South African School Rugby Rankings {season} | Rugby Ignite', season),
    description: withSeason(
      site.seoDescription ||
        "South African school rugby rankings for every first team, powered by a points-exchange system modelled on World Rugby's. See each school's rating, weekly movement and the match that last moved it.",
      season,
    ),
    keywords: site.seoKeywords ? withSeason(site.seoKeywords, season) : undefined,
  };
}

export default async function HomePage() {
  const [site, page, build] = await Promise.all([
    getSiteSettings(),
    getPage('home'),
    getSiteBuild(),
  ]);
  const season = getCurrentSeason();
  const bottom = site.adsense?.slotBottom ?? DEFAULT_AD_SLOTS.bottom;

  // Every season year gets its own page (/rankings/{year}); this is the All-Time
  // page, so the scope nav links out to each of them. Newest first.
  const years = seasonYears(build.seasons).map((year) => ({ year, href: `/rankings/${year}` }));

  // Structured data (top 25), mirroring the visible table.
  const master = await getStandings('master');
  const listRows = master.slice(0, 25);

  return (
    <div className="rir-container py-8 space-y-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'The Ignite Rating — South African school rugby first team ranking',
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
          First team · All recorded fixtures
        </div>
        <h1 className="text-4xl">South African School Rugby Rankings</h1>
        <p className="text-sm" style={{ color: 'var(--body-2)', maxWidth: '60ch' }}>
          Every South African school first team, ranked with a points-exchange
          system modelled on World Rugby&apos;s: schools trade rating points with
          every result — win and you take points off your opponent, lose and you
          give them up. Tap any school to see the match that last moved it.
        </p>
      </div>

      <SponsorBand />

      <div className="space-y-4">
        <RankingScopeNav allTimeHref="/" years={years} active="all" />
        <LastUpdatedLine />
        <RankingTable track="master" ads search />
      </div>

      {bottom && (
        <div className="rir-ad" aria-label="Advertisement">
          <span className="rir-ad-label">Advertisement</span>
          <AdUnit slot={bottom} />
        </div>
      )}

      <StoriesStrip />

      {page?.body && (
        <div style={{ maxWidth: '52rem' }}>
          <RichText body={withSeason(page.body, season)} renderShortcode={rankingShortcodes} />
        </div>
      )}

      <MatchPulseCTA />
    </div>
  );
}
