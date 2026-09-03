import Link from 'next/link';
import { rankedSports, loadSportData } from '@/lib/matchpulse/source';
import { computeLiveLadder } from '@/lib/matchpulse/liveRankings';
import { getSportConfig } from '@/lib/data/config';
import type { SportKey, Track } from '@/lib/matchpulse/types';

const ageLabel = (a: string) => {
  if (a === '1st') return '1st Team';
  return /^u\d+$/i.test(a) ? a.toUpperCase() : a.charAt(0).toUpperCase() + a.slice(1);
};

// South African school sport — always UTC+2, no daylight saving.
function fmtUpdated(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg',
  }).format(d);
  return `${date} at ${time} GMT+0200`;
}

type SP = { [key: string]: string | string[] | undefined };
type Sel = { sport: string; age: string; track: Track; season: string };

function href(base: string, sel: Sel, patch: Partial<Sel>): string {
  const s = { ...sel, ...patch };
  return `${base}?sport=${s.sport}&age=${encodeURIComponent(s.age)}&track=${s.track}&season=${s.season}`;
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

export default async function LiveRankings({ sp, basePath = '/' }: { sp: SP; basePath?: string }) {
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

  const [{ matches, orgs, lastUpdated }, config] = await Promise.all([
    loadSportData(sportKey),
    getSportConfig(sportKey),
  ]);

  const ages = Array.from(new Set(matches.map((m) => m.ageGroup))).sort();
  const seasons = Array.from(new Set(matches.map((m) => m.season))).sort();
  const age = typeof sp.age === 'string' && ages.includes(sp.age) ? sp.age : (ages[0] ?? '');
  const track: Track = sp.track === 'season' ? 'season' : 'master';
  const season =
    typeof sp.season === 'string' && seasons.includes(sp.season)
      ? sp.season
      : (seasons.includes(config.currentSeason) ? config.currentSeason : seasons[seasons.length - 1] ?? '');
  const sel: Sel = { sport: sportKey, age, track, season };

  const { rows, conserved } = computeLiveLadder(matches, orgs, age, track, season, config);

  const hasData = matches.length > 0 && rows.length > 0;
  const trackTitle = track === 'master' ? config.masterTitle : `${config.seasonTitle} — ${season}`;

  return (
    <div className="rir-container py-8 space-y-6">
      {/* Disclaimer / last-updated banner */}
      <div className="rir-card p-4" style={{ borderLeft: '3px solid var(--gold)' }}>
        <div className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>School {sport.name} Rankings</div>
        <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-navy-900)' }}>
          Last updated: {lastUpdated ? fmtUpdated(lastUpdated) : 'awaiting the first verified result'}
        </div>
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Both the {config.currentSeason} {config.seasonTitle} and All-Time {sport.name} Ratings are refreshed
          automatically as verified South African school {sport.name.toLowerCase()} results are added to Rugby Ignite.
        </p>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Rankings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {sport.name}{age ? ` · ${ageLabel(age)}` : ''} · {trackTitle}
        </p>
      </div>

      {!hasData ? (
        <div className="rir-card p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No live results are available for {sport.name}{age ? ` (${ageLabel(age)})` : ''} yet.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--color-text-muted)' }}>Sport</span>
            {sports.map((s) => <Chip key={s.key} active={s.key === sportKey} href={href(basePath, sel, { sport: s.key })}>{s.name}</Chip>)}
          </div>

          {ages.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--color-text-muted)' }}>Age group</span>
              {ages.map((a) => <Chip key={a} active={a === age} href={href(basePath, sel, { age: a })}>{ageLabel(a)}</Chip>)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--color-text-muted)' }}>Track</span>
            <Chip active={track === 'master'} href={href(basePath, sel, { track: 'master' })}>{config.masterTitle}</Chip>
            <Chip active={track === 'season'} href={href(basePath, sel, { track: 'season' })}>{config.seasonTitle}</Chip>
            {track === 'season' && seasons.map((y) => <Chip key={y} active={y === season} href={href(basePath, sel, { track: 'season', season: y })}>{y}</Chip>)}
          </div>

          <div className="rir-table-wrap">
            <table className="rir-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>P</th>
                  <th className="rir-col-wdl">W</th>
                  <th className="rir-col-wdl">D</th>
                  <th className="rir-col-wdl">L</th>
                  <th>Win%</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.entityId} className={i === 0 ? 'rir-rank-1' : undefined}>
                    <td className="rir-data font-semibold">{i + 1}</td>
                    <td className="font-medium" style={{ color: 'var(--color-navy-900)' }}>{r.name}</td>
                    <td className="rir-data">{r.played}</td>
                    <td className="rir-data rir-col-wdl">{r.wins}</td>
                    <td className="rir-data rir-col-wdl">{r.draws}</td>
                    <td className="rir-data rir-col-wdl">{r.losses}</td>
                    <td className="rir-data">{r.winPercent.toFixed(1)}%</td>
                    <td className="rir-data font-semibold" style={{ color: i === 0 ? 'var(--gold)' : undefined }}>{r.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Reading LIVE Match Pulse data (read-only), replayed first match → last. Every team starts at {config.baselineRating}.
            {track === 'master'
              ? ` Master is a World Rugby points exchange (K=${config.kMaster}) — each match only moves points between the two teams${conserved ? ', pool verified balanced' : ''}.`
              : ` Season is seeded from Master at the season start (seed factor ${config.seedFactor}) and re-rated with its own K=${config.kSeason}.`}
            {' '}The full formula and every setting are on the admin Settings page.
          </p>
        </>
      )}
    </div>
  );
}
