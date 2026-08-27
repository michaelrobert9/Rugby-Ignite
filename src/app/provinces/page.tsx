import Link from 'next/link';
import { listTeams } from '@/lib/data/teams';
import { PROVINCES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProvincesIndexPage() {
  const teams = await listTeams();
  const counts = new Map<string, number>();
  for (const t of teams) {
    if (!t.province) continue;
    counts.set(t.province, (counts.get(t.province) ?? 0) + 1);
  }

  return (
    <div className="rir-container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
          Provinces
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Each table only counts fixtures between two teams in the same province — the best way
          to see who&apos;s on top locally, and it keeps rivalries together. Cross-province
          fixtures still count toward the Master and Season rankings.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PROVINCES.map((p) => (
          <Link key={p} href={`/provinces/${encodeURIComponent(p)}`} className="rir-card p-5 hover:shadow-sm transition-shadow">
            <div className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
              {p}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {counts.get(p) ?? 0} team{(counts.get(p) ?? 0) === 1 ? '' : 's'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
