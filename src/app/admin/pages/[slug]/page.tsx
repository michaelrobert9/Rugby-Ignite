import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageForm from '@/components/PageForm';
import { getPage } from '@/lib/data/pages';

export const dynamic = 'force-dynamic';

export default async function EditPagePage(props: PageProps<'/admin/pages/[slug]'>) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/admin/pages" className="text-xs hover:underline" style={{ color: 'var(--color-text-muted)' }}>
            ← All pages
          </Link>
          <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
            Edit “{page.title}”
          </h2>
        </div>
        <Link href={page.id === 'home' ? '/' : page.slug || '/'} className="rir-btn rir-btn-secondary" target="_blank">
          View page ↗
        </Link>
      </div>

      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Page saved.
        </div>
      )}

      <PageForm page={page} />
    </div>
  );
}
