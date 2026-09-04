import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/data/pages';
import { RichText } from '@/lib/content';
import { rankingShortcodes } from '@/components/rankingShortcodes';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPage(slug);
  if (!page || page.id === 'home') return {};
  return { title: page.metaTitle, description: page.metaDescription };
}

export default async function CmsPage(props: PageProps<'/[slug]'>) {
  const { slug } = await props.params;
  const page = await getPage(slug);
  // 'home' is served at '/', not here.
  if (!page || page.id === 'home') notFound();

  return (
    <div className="rir-container py-8">
      <div className="space-y-5" style={{ maxWidth: '52rem' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>{page.title}</h1>
        <RichText body={page.body} renderShortcode={rankingShortcodes} />
      </div>
    </div>
  );
}
