import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/data/pages';
import { pageIdForProvince } from '@/lib/data/defaultPages';
import { RichText, type ShortcodeRenderer } from '@/lib/content';
import RankingsBlock from '@/components/RankingsBlock';
import { PROVINCES, type Province } from '@/lib/types';

export const dynamic = 'force-dynamic';

function resolveProvince(raw: string): Province | undefined {
  const decoded = decodeURIComponent(raw);
  return (PROVINCES as readonly string[]).includes(decoded) ? (decoded as Province) : undefined;
}

export async function generateMetadata(props: PageProps<'/provinces/[province]'>): Promise<Metadata> {
  const { province } = await props.params;
  const p = resolveProvince(province);
  if (!p) return {};
  const page = await getPage(pageIdForProvince(p));
  return { title: page?.metaTitle, description: page?.metaDescription };
}

export default async function ProvincePage(props: PageProps<'/provinces/[province]'>) {
  const { province } = await props.params;
  const p = resolveProvince(province);
  if (!p) notFound();
  const page = await getPage(pageIdForProvince(p));
  if (!page) notFound();

  const renderShortcode: ShortcodeRenderer = (name, attrs, key) => {
    if (name !== 'rankings') return null;
    return <RankingsBlock key={key} scope={attrs.scope ?? page.rankingScope} province={attrs.province ?? p} />;
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
