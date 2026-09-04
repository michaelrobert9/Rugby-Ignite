import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/data/pages';
import { RichText } from '@/lib/content';
import { rankingShortcodes } from '@/components/rankingShortcodes';
import { getCurrentSeason, withSeason } from '@/lib/season';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPage(slug);
  if (!page || page.id === 'home') return {};
  const s = getCurrentSeason();
  return { title: withSeason(page.metaTitle, s), description: withSeason(page.metaDescription, s) };
}

export default async function CmsPage(props: PageProps<'/[slug]'>) {
  const { slug } = await props.params;
  const page = await getPage(slug);
  // 'home' is served at '/', not here.
  if (!page || page.id === 'home') notFound();

  const season = getCurrentSeason();

  return (
    <div className="rir-container py-8">
      <div className="space-y-5" style={{ maxWidth: '52rem' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>{withSeason(page.title, season)}</h1>
        <RichText body={withSeason(page.body, season)} renderShortcode={rankingShortcodes} />
      </div>
    </div>
  );
}
