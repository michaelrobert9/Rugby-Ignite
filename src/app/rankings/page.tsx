import Link from 'next/link';
import { rankedSports, loadSportData } from '@/lib/matchpulse/source';
import { computeRatings } from '@/lib/matchpulse/ratingEngine';
import type { SportKey, Track } from '@/lib/matchpulse/types';

export const dynamic = 'force-dynamic';

const ageLabel = (a: string) => {
  if (a === '1st') return '1st Team';
  return /^u\d+$/i.test(a) ? a.toUpperCase() : a.charAt(0).toUpperCase() + a.slice(1);
};

type Sel = { sport: string; age: string; track: Track; season: string };

function href(base: Sel, patch: Partial<Sel>): string {
  const s = { ...base, ...patch };
  return `/rankings?sport=${s.sport}&age=${encodeURIComponent(s.age)}&track=${s.track}&season=${s.season}`;
}

function Chip({ active, href: h, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={h}
      className="rir-badge"
      style={active ? { background: 'var(--night)', color: 'var(--chalk)' } : { background: '#ece3d3', color: 'var(--color-text-muted)' }}
    >
      {children}
    </Link>
  );
}

export default async function RankingsPage(props: PageProps<'/rankings'>) {
  const sp = await props.searchParams;
  const sports = await rankedSports();

  if (sports.length === 0) {
    return (
      <div className="rir-container py-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Rankings</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>No sports have rankings switched on yet.</p>
      </div>
    );
  }

  const sportKey = (typeof sp.sport === 'string' && sports.some((s) => s.key === sp.sport) ? sp.sport : sports[0].key) as SportKey;
  const sport = sports.find((s) => s.key === sportKey)!;

  const { matches, orgs } = await loadSportData(sportKey);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));

  const ages = Array.from(new Set(matches.map((m) => m.ageGroup))).sort();
  const seasons = Array.from(new Set(matches.map((m) => m.season))).sort();
  const age = typeof sp.age === 'string' && ages.includes(sp.age) ? sp.age : (ages[0] ?? '');
  const track: Track = sp.track === 'season' ? 'season' : 'master';
  const season = typeof sp.season === 'string' && seasons.includes(sp.season) ? sp.season : (seasons[seasons.length - 1] ?? '');
  const sel: Sel = { sport: sportKey, age, track, season };

  const { rows, conserved } = computeRatings({
    matches,
    sport: sportKey,
    ageGroup: age,
    track,
    season,
    nameFor: (id) => orgName.get(id) ?? id,
  });

  const hasData = matches.length > 0;

  return (
    <div className="rir-container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Rankings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {sport.name}{age ? ` · ${ageLabel(age)}` : ''} · {track === 'master' ? 'Master (all-time)' : `Season ${season}`}
        </p>
      </div>

      {!hasData ? (
        <div className="rir-card p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No live results are available for {sport.name} yet.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--color-text-muted)' }}>Sport</span>
            {sports.map((s) => <Chip key={s.key} active={s.key === sportKey} href={href(sel, { sport: s.key })}>{s.name}</Chip>)}
          </div>

          {ages.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--color-text-muted)' }}>Age group</span>
              {ages.map((a) => <Chip key={a} active={a === age} href={href(sel, { age: a })}>{ageLabel(a)}</Chip>)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--color-text-muted)' }}>Track</span>
            <Chip active={track === 'master'} href={href(sel, { track: 'master' })}>Master</Chip>
            <Chip active={track === 'season'} href={href(sel, { track: 'season' })}>Season</Chip>
            {track === 'season' && seasons.map((y) => <Chip key={y} active={y === season} href={href(sel, { track: 'season', season: y })}>{y}</Chip>)}
          </div>

          <div className="rir-table-wrap">
            <table className="rir-table">
              <thead>
                <tr><th>Pos</th><th>Team</th><th>Win%</th><th>Rating</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.entityId} className={i === 0 ? 'rir-rank-1' : undefined}>
                    <td className="rir-data font-semibold">{i + 1}</td>
                    <td className="font-medium" style={{ color: 'var(--color-navy-900)' }}>{r.name}</td>
                    <td className="rir-data">{r.winPercent.toFixed(1)}%</td>
                    <td className="rir-data font-semibold" style={{ color: i === 0 ? 'var(--gold)' : undefined }}>{r.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Reading LIVE Match Pulse data (read-only). Points-exchange rating out of 100 — every team starts at 50, and each match only moves points between the two teams{conserved ? ' (pool verified balanced)' : ''}.
          </p>
        </>
      )}
    </div>
  );
}
