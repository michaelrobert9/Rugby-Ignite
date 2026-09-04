import Link from 'next/link';

export const dynamic = 'force-dynamic';

const CARDS = [
  { href: '/admin/settings', title: 'Ranking settings', body: 'The points-exchange formula behind the live School Rugby Rankings.' },
  { href: '/admin/pages', title: 'Pages', body: 'Edit the home page, methodology and province pages (text and layout).' },
  { href: '/admin/news', title: 'News', body: 'Write and manage news posts.' },
  { href: '/admin/ads', title: 'Ads', body: 'AdSense publisher ID, ad cards and ads.txt.' },
];

export default async function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="rir-card p-5">
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Rugby Ignite admin</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          The rankings read live from Match Pulse and recompute on every page load — there is nothing to rebuild
          here. Use the sections below to manage the site.
        </p>
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
