import Link from 'next/link';
import { listPages } from '@/lib/data/pages';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  const pages = (await listPages()).slice().sort((a, b) => a.navOrder - b.navOrder);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          Pages
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Edit the title, SEO details and body text of each public page. Drop a{' '}
          <code>[rankings]</code> shortcode into a page&apos;s body to place its live table.
        </p>
      </div>
      <div className="rir-table-wrap">
        <table className="rir-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Nav label</th>
              <th>URL</th>
              <th>In nav</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.title}</td>
                <td>{p.navLabel}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{p.slug}</td>
                <td>{p.showInNav ? 'Yes' : '—'}</td>
                <td>
                  <Link href={`/admin/pages/${p.id}`} className="text-xs hover:underline" style={{ color: 'var(--color-navy-900)' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
