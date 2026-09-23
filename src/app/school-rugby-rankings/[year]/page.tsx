import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSiteSettings } from '@/lib/data/siteSettings';
import { getSportConfig } from '@/lib/data/config';
import { getSiteBuild, schoolSlug } from '@/lib/store/read';
import { getCurrentSeason, withSeason, seasonYears } from '@/lib/season';
import { DEFAULT_AD_SLOTS } from '@/lib/adsense';
import RankingScopeNav from '@/components/RankingScopeNav';
import RankingTable, { LastUpdatedLine } from '@/components/RankingTable';
import SponsorBand from '@/components/SponsorBand';
import MatchPulseCTA from '@/components/MatchPulseCTA';
import StoriesStrip from '@/components/StoriesStrip';
import AdUnit from '@/components/AdUnit';
import JsonLd from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rugbyignite.co.za').replace(/\/$/, '');

// Only the season years present in the data (plus the current one) are real pages.
async function knownYear(year: string): Promise<boolean> {
  const build = await getSiteBuild();
  return seasonYears(build.seasons).includes(year);
}

export async function generateMetadata(props: PageProps<'/school-rugby-rankings/[year]'>): Promise<Metadata> {
  const { year } = await props.params;
  if (!/^\d{4}$/.test(year) || !(await knownYear(year))) return {};
  const config = await getSportConfig('rugby');
  return {
    title: `South African School Rugby Rankings ${year} | Rugby Ignite`,
    description: withSeason(config.seasonIntro, year),
  };
}

export default async function SeasonRankingPage(props: PageProps<'/school-rugby-rankings/[year]'>) {
  const { year } = await props.params;
  if (!/^\d{4}$/.test(year) || !(await knownYear(year))) notFound();

  const [site, config, build] = await Promise.all([
    getSiteSettings(),
    getSportConfig('rugby'),
    getSiteBuild(),
  ]);
  const current = getCurrentSeason();
  const bottom = site.adsense?.slotBottom ?? DEFAULT_AD_SLOTS.bottom;
  const years = seasonYears(build.seasons).map((y) => ({ year: y, href: `/school-rugby-rankings/${y}` }));

  const listRows = (build.standingsByScope[year] ?? []).slice(0, 25);

  return (
    <div className="rir-container py-8 space-y-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `South African school rugby first team ranking — ${year} season`,
          numberOfItems: listRows.length,
          itemListElement: listRows.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: r.name,
            item: `${SITE}/school-rugby-rankings/${year}#${schoolSlug(r.name)}`,
          })),
        }}
      />

      <div className="space-y-1">
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
          First team · {year} season{year === current ? ' (in progress)' : ''}
        </div>
        <h1 className="text-4xl">South African School Rugby Rankings {year}</h1>
        <p className="text-sm" style={{ color: 'var(--body-2)', maxWidth: '60ch' }}>
          {withSeason(config.seasonIntro, year)}
        </p>
      </div>

      <SponsorBand />

      <div className="space-y-4">
        <RankingScopeNav allTimeHref="/" years={years} active={year} />
        <LastUpdatedLine />
        <RankingTable track="season" season={year} ads search />
      </div>

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
