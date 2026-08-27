import Link from 'next/link';
import { listMatches } from '@/lib/data/matches';
import { listTeams } from '@/lib/data/teams';
import { listVenues } from '@/lib/data/venues';
import { getRebuildMeta } from '@/lib/data/rankings';
import { rebuildAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard(props: PageProps<'/admin'>) {
  const searchParams = await props.searchParams;
  const [teams, venues, matches, meta] = await Promise.all([
    listTeams(),
    listVenues(),
    listMatches(),
    getRebuildMeta(),
  ]);

  const needsReview = teams.filter((t) => t.needsReview);
  const rankingEligiblePlayed = matches.filter((m) => m.rankingEligible && m.status === 'played').length;

  return (
    <div className="space-y-6">
      {searchParams.rebuilt === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Rankings rebuilt successfully.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Teams" value={teams.length} href="/admin/teams" />
        <StatTile label="Venues" value={venues.length} href="/admin/venues" />
        <StatTile label="Matches (ranking-eligible, played)" value={rankingEligiblePlayed} href="/admin/matches" />
      </div>

      <div className="rir-card p-5">
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          Rebuild rankings
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Both tracks are stateful and order-dependent, so this always replays every eligible
          match from scratch, chronologically — the same approach the live plugin uses.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Last rebuilt: {meta.lastRebuiltAt ? new Date(meta.lastRebuiltAt).toLocaleString('en-ZA') : 'never'}
          {meta.lastRebuiltAt && <> · {meta.matchesConsidered} matches · {meta.teamsRanked} teams · scopes: {meta.scopes.join(', ')}</>}
        </p>
        <form action={rebuildAction} className="mt-3">
          <button type="submit" className="rir-btn rir-btn-primary">
            Rebuild Master + all Seasons
          </button>
        </form>
      </div>

      {needsReview.length > 0 && (
        <div className="rir-card p-5">
          <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
            Needs review ({needsReview.length})
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Flagged during the historical import — confirm province/venue assignment.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {needsReview.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/teams/${t.id}`} className="hover:underline" style={{ color: 'var(--color-navy-900)' }}>
                  {t.name}
                </Link>{' '}
                <span style={{ color: 'var(--color-text-muted)' }}>— currently {t.province ?? 'no province'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rir-card p-5 block hover:shadow-sm transition-shadow">
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </div>
      <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-navy-900)' }}>
        {value}
      </div>
    </Link>
  );
}
