// The stories block that sits below the ranking on the home page. Lists the
// most recent generated stories; renders nothing when there are none (a module
// disappears rather than showing empty).

import Link from 'next/link';
import { listArticles } from '@/lib/store/stateStore';

export default async function StoriesStrip() {
  const articles = await listArticles(5);
  if (articles.length === 0) return null;

  return (
    <section>
      <div
        style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--body-2)', borderBottom: '1px solid var(--rule)',
          paddingBottom: 8,
        }}
      >
        Stories
      </div>
      {articles.map((a) => {
        const slug = a.slug.split('/')[1];
        return (
          <Link
            key={a.slug}
            href={`/${a.season}/${slug}`}
            className="block"
            style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)', textDecoration: 'none', color: 'inherit' }}
          >
            <div className="rir-subline" style={{ marginTop: 0 }}>{a.dateline}</div>
            <div style={{ marginTop: 3, color: 'var(--ink)', fontWeight: 500 }}>{a.title}</div>
          </Link>
        );
      })}
    </section>
  );
}
