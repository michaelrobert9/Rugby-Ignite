import type { Metadata } from 'next';
import { getPage } from '@/lib/data/pages';
import { getSportConfig } from '@/lib/data/config';
import { loadSportData } from '@/lib/matchpulse/source';
import { RichText } from '@/lib/content';
import { rankingShortcodes } from '@/components/rankingShortcodes';
import RankingTabs from '@/components/RankingTabs';
import RankingTable, { LastUpdatedLine } from '@/components/RankingTable';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home');
  return { title: page?.metaTitle, description: page?.metaDescription };
}

export default async function HomePage() {
  const [config, page, { matches }] = await Promise.all([
    getSportConfig('rugby'),
    getPage('home'),
    loadSportData('rugby'),
  ]);

  // Every season that appears in the data, oldest → newest.
  const years = Array.from(new Set(matches.map((m) => m.season))).sort();
  if (!years.includes(config.currentSeason) && years.length) {
    // currentSeason always available even if it has no matches yet
    years.push(config.currentSeason);
    years.sort();
  }

  return (
    <div className="rir-container py-8 space-y-8">
      <RankingTabs
        master={{
          heading: config.masterHeading,
          intro: config.masterIntro,
          table: <RankingTable track="master" />,
        }}
        season={{
          heading: config.seasonHeading,
          intro: config.seasonIntro,
          extra: <LastUpdatedLine />,
          years: years.map((year) => ({ year, table: <RankingTable track="season" season={year} /> })),
        }}
      />

      {page?.body && (
        <div style={{ maxWidth: '52rem' }}>
          <RichText body={page.body} renderShortcode={rankingShortcodes} />
        </div>
      )}
    </div>
  );
}
