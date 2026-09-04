import Link from 'next/link';
import { refreshRankingsAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

const CARDS = [
  { href: '/admin/settings', title: 'Rankings', body: 'The points-exchange formula behind the live School Rugby Rankings.' },
  { href: '/admin/pages', title: 'Pages', body: 'Edit the home page, methodology and province pages (text and layout).' },
  { href: '/admin/news', title: 'News', body: 'Write and manage news posts.' },
  { href: '/admin/seo', title: 'SEO', body: 'Site title, description and keywords (with automatic season year).' },
  { href: '/admin/ads', title: 'Ads', body: 'AdSense publisher ID, ad cards and ads.txt.' },
];

export default async function AdminDashboard(props: PageProps<'/admin'>) {
  const searchParams = await props.searchParams;

  return (
    <div className="space-y-6">
      {searchParams.refreshed === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Rankings refreshed from Match Pulse.
        </div>
      )}

      <div className="rir-card p-5">
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Rugby Ignite admin</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          The rankings are captured from Match Pulse and cached for speed, refreshing automatically every few
          minutes. Use the button below to pull the latest results immediately.
        </p>
        <form action={refreshRankingsAction} className="mt-3">
          <button type="submit" className="rir-btn rir-btn-secondary">Refresh rankings now</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rir-card p-5 block hover:shadow-sm transition-shadow">
            <div className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>{c.title}</div>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
