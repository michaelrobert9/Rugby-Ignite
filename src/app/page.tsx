import type { Metadata } from 'next';
import { getPage } from '@/lib/data/pages';
import { RichText, type ShortcodeRenderer } from '@/lib/content';
import RankingsBlock from '@/components/RankingsBlock';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home');
  return { title: page?.metaTitle, description: page?.metaDescription };
}

export default async function HomePage(props: PageProps<'/'>) {
  const searchParams = await props.searchParams;
  const page = await getPage('home');
  if (!page) return null;

  const track = typeof searchParams.track === 'string' ? searchParams.track : undefined;
  const season = typeof searchParams.season === 'string' ? searchParams.season : undefined;

  const renderShortcode: ShortcodeRenderer = (name, attrs, key) => {
    if (name !== 'rankings') return null;
    return (
      <RankingsBlock
        key={key}
        scope={attrs.scope ?? page.rankingScope}
        province={attrs.province}
        toggle={attrs.toggle === 'true'}
        track={track}
        season={season}
      />
    );
  };

  return (
    <div className="rir-container py-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
        {page.title}
      </h1>
      <RichText body={page.body} renderShortcode={renderShortcode} />
    </div>
  );
}
