import type { Metadata } from 'next';
import { getPage } from '@/lib/data/pages';
import { getSportConfig } from '@/lib/data/config';
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
  const [config, page] = await Promise.all([getSportConfig('rugby'), getPage('home')]);

  return (
    <div className="rir-container py-8 space-y-8">
      <RankingTabs
        season={{
          heading: config.seasonHeading,
          intro: config.seasonIntro,
          extra: <LastUpdatedLine />,
          table: <RankingTable track="season" limit={20} />,
        }}
        master={{
          heading: config.masterHeading,
          intro: config.masterIntro,
          table: <RankingTable track="master" limit={26} />,
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
