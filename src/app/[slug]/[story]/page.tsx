// A generated story at /{season}/{slug} (Website Brief §03). Frozen at
// publication and never edited; a later correction adds a banner only. The
// first path segment is the season, the second the story slug.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readArticle } from '@/lib/store/stateStore';
import { MATCHPULSE } from '@/lib/matchpulseLinks';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: PageProps<'/[slug]/[story]'>): Promise<Metadata> {
  const { slug, story } = await props.params;
  const a = await readArticle(`${slug}/${story}`);
  if (!a) return {};
  return { title: `${a.title} | Rugby Ignite`, description: a.lead };
}

export default async function StoryPage(props: PageProps<'/[slug]/[story]'>) {
  const { slug, story } = await props.params;
  const a = await readArticle(`${slug}/${story}`);
  if (!a) notFound();

  return (
    <div className="rir-container py-8">
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--ink)' }}>
        <div className="rir-subline">/{a.season}/{story}</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ember-deep)' }}>
          Permanent · never updated
        </div>
      </div>

      {a.supersededBy && (
        <div className="rir-card p-4 text-sm" style={{ marginTop: 16, background: '#fbeee6', borderColor: '#e3c9bb' }}>
          A result in this report was later amended on Match Pulse. The ratings were recomputed; this article is
          left exactly as published.{' '}
          <Link href="/corrections" className="rir-link">See the correction →</Link>
        </div>
      )}

      <h1 className="text-3xl" style={{ margin: '20px 0 0', maxWidth: '21ch' }}>{a.title}</h1>
      <div className="rir-subline" style={{ marginTop: 14 }}>{a.dateline}</div>

      <div className="grid gap-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', marginTop: 26, alignItems: 'start' }}>
        <div>
          <p style={{ margin: '0 0 16px', fontSize: 18, lineHeight: 1.65, color: 'var(--ink)' }}>{a.lead}</p>
          {a.paragraphs.map((p, idx) => (
            <p key={idx} style={{ margin: '0 0 16px', fontSize: 16, lineHeight: 1.75 }}>{p}</p>
          ))}
          <div className="rir-subline" style={{ borderTop: '1px solid var(--rule)', marginTop: 22, paddingTop: 14, lineHeight: 1.9 }}>
            Generated {a.generatedAt.slice(0, 10)} · Method v{a.methodVersion}<br />
            Match data from{' '}
            <a href={MATCHPULSE.rugby} target="_blank" rel="noopener" className="rir-link">Match Pulse</a> ·{' '}
            <Link href="/" className="rir-link">Current ranking</Link>
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: 18 }}>
          <div className="rir-card" style={{ padding: 20, borderColor: 'var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
              Every change this round · largest first
            </div>
            {a.changes.map((c) => (
              <div key={c.name} className="grid items-center" style={{ gridTemplateColumns: '1fr 52px 58px', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{c.name}</div>
                <div className="rir-data" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ink)' }}>
                  {c.delta === 0 ? '—' : `${c.delta > 0 ? '▲' : '▼'} ${Math.abs(c.delta).toFixed(2)}`}
                </div>
                <div className="rir-data" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ink)' }}>{c.rating.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
