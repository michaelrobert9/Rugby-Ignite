import type { Metadata } from 'next';
import Link from 'next/link';
import { listArticles } from '@/lib/store/stateStore';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stories | Rugby Ignite',
  description:
    'Generated, permanent reports on the South African school rugby rankings — lead changes and round reports, each frozen at publication and never edited.',
};

export default async function StoriesPage() {
  const articles = await listArticles(60);

  return (
    <div className="rir-container py-8">
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
        Stories · permanent, never updated
      </div>
      <h1 className="text-3xl" style={{ margin: '9px 0 8px' }}>The record, as it happened</h1>
      <p className="text-base" style={{ maxWidth: '60ch', lineHeight: 1.7 }}>
        The ranking page is always current, so it can never tell you what happened on a given weekend. Each story
        below is frozen at publication and never touched again — a dated point in the season you can cite.
      </p>

      {articles.length === 0 ? (
        <div className="rir-card p-6 text-sm" style={{ marginTop: 24, color: 'var(--body-2)' }}>
          No stories have been published yet. When the leader changes or a round closes, a report is generated and
          appears here — automatically, and permanently.
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          {articles.map((a) => {
            const [, slug] = a.slug.split('/');
            return (
              <Link
                key={a.slug}
                href={`/stories/${a.season}/${slug}`}
                className="block"
                style={{ padding: '18px 0', borderBottom: '1px solid var(--rule)', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="rir-subline">{a.dateline}</div>
                <div className="text-lg" style={{ marginTop: 4, color: 'var(--coal)' }}>{a.title}</div>
                <div className="text-sm" style={{ marginTop: 4, color: 'var(--body-2)' }}>{a.lead}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
