import type { Metadata } from 'next';
import { getPage } from '@/lib/data/pages';
import { RichText } from '@/lib/content';
import { rankingShortcodes } from '@/components/rankingShortcodes';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home');
  return { title: page?.metaTitle, description: page?.metaDescription };
}

export default async function HomePage() {
  const page = await getPage('home');
  if (!page) return null;

  return (
    <div className="rir-container py-8 space-y-5">
      <RichText body={page.body} renderShortcode={rankingShortcodes} />
    </div>
  );
}
