import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="rir-container py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
          Rugby Ignite Admin
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Rankings read live from Match Pulse (results, teams and venues all live on Match Pulse).
          Here you manage the ranking settings, pages and news for the Rugby Ignite site.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="flex md:flex-col gap-1 md:w-48 shrink-0 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-white"
              style={{ color: 'var(--color-navy-900)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
