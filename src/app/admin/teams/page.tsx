import Link from 'next/link';
import { listTeams } from '@/lib/data/teams';
import { listVenues } from '@/lib/data/venues';

export const dynamic = 'force-dynamic';

export default async function AdminTeamsPage() {
  const [teamsRaw, venues] = await Promise.all([listTeams(), listVenues()]);
  const teams = teamsRaw.slice().sort((a, b) => a.name.localeCompare(b.name));
  const venueById = new Map(venues.map((v) => [v.id, v]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          Teams ({teams.length})
        </h2>
        <Link href="/admin/teams/new" className="rir-btn rir-btn-primary">
          + New team
        </Link>
      </div>
      <div className="rir-table-wrap">
        <table className="rir-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Province</th>
              <th>Home venue</th>
              <th>Flags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const venue = t.homeVenueId ? venueById.get(t.homeVenueId) : undefined;
              return (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td>{t.province ?? <span style={{ color: 'var(--color-down)' }}>none</span>}</td>
                  <td>{venue?.name ?? <span style={{ color: 'var(--color-text-muted)' }}>none</span>}</td>
                  <td>
                    {t.needsReview && (
                      <span className="rir-badge" style={{ background: '#fff4e0', color: '#8a5a00' }}>
                        needs review
                      </span>
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/teams/${t.id}`} className="text-xs hover:underline" style={{ color: 'var(--color-navy-900)' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
