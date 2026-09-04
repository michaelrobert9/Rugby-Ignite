import type { Metadata } from 'next';
import { getPage } from '@/lib/data/pages';
import { getSportConfig } from '@/lib/data/config';
import { getSiteSettings } from '@/lib/data/siteSettings';
import { loadSportData } from '@/lib/matchpulse/source';
import { getCurrentSeason, withSeason } from '@/lib/season';
import { RichText } from '@/lib/content';
import { rankingShortcodes } from '@/components/rankingShortcodes';
import RankingTabs from '@/components/RankingTabs';
import RankingTable, { LastUpdatedLine } from '@/components/RankingTable';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [site, page] = await Promise.all([getSiteSettings(), getPage('home')]);
  const season = getCurrentSeason();
  return {
    title: withSeason(site.seoTitle || page?.metaTitle || 'Rugby Ignite', season),
    description: withSeason(site.seoDescription || page?.metaDescription || '', season),
    keywords: site.seoKeywords ? withSeason(site.seoKeywords, season) : undefined,
  };
}

export default async function HomePage() {
  const [config, page, { matches }] = await Promise.all([
    getSportConfig('rugby'),
    getPage('home'),
    loadSportData('rugby'),
  ]);

  const season = getCurrentSeason();

  // Every season that appears in the data, plus the current one, oldest → newest.
  const years = Array.from(new Set([...matches.map((m) => m.season), season])).sort();

  return (
    <div className="rir-container py-8 space-y-8">
      <RankingTabs
        master={{
          heading: withSeason(config.masterHeading, season),
          intro: withSeason(config.masterIntro, season),
          table: <RankingTable track="master" />,
        }}
        season={{
          heading: withSeason(config.seasonHeading, season),
          intro: withSeason(config.seasonIntro, season),
          extra: <LastUpdatedLine />,
          years: years.map((year) => ({ year, table: <RankingTable track="season" season={year} /> })),
        }}
      />

      {page?.body && (
        <div style={{ maxWidth: '52rem' }}>
          <RichText body={withSeason(page.body, season)} renderShortcode={rankingShortcodes} />
        </div>
      )}
    </div>
  );
}
