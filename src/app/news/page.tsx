import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedPosts } from '@/lib/data/posts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'News — Rugby Ignite',
  description: 'Weekly ranking updates, results and announcements from Rugby Ignite.',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function NewsPage() {
  const posts = await listPublishedPosts();

  return (
    <div className="rir-container py-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
        News
      </h1>

      {posts.length === 0 ? (
        <div className="rir-card p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No news posted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <article key={p.id} className="rir-card p-5">
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {fmtDate(p.date)} · {p.author}
              </div>
              <h2 className="text-lg font-semibold mt-1">
                <Link href={`/news/${p.slug}`} className="hover:underline" style={{ color: 'var(--color-navy-900)' }}>
                  {p.title}
                </Link>
              </h2>
              {p.excerpt && (
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {p.excerpt}
                </p>
              )}
              <Link href={`/news/${p.slug}`} className="rir-link text-sm mt-3 inline-block hover:underline">
                Read more →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
