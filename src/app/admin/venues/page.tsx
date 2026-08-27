import Link from 'next/link';
import { listVenues } from '@/lib/data/venues';

export const dynamic = 'force-dynamic';

export default async function AdminVenuesPage() {
  const venues = (await listVenues()).slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          Venues ({venues.length})
        </h2>
        <Link href="/admin/venues/new" className="rir-btn rir-btn-primary">
          + New venue
        </Link>
      </div>
      <div className="rir-table-wrap">
        <table className="rir-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Neutral?</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id}>
                <td className="font-medium">{v.name}</td>
                <td>{v.isNeutral ? 'Yes' : ''}</td>
                <td>
                  <Link href={`/admin/venues/${v.id}`} className="text-xs hover:underline" style={{ color: 'var(--color-navy-900)' }}>
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
