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

// Rating points gained/lost since the last Thursday 23:59 reset.
function PointsDelta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="rir-badge" style={{ background: '#eef1f5', color: 'var(--color-text-muted)' }}>NEW</span>;
  }
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  const up = rounded > 0;
  return (
    <span style={{ color: up ? 'var(--color-up)' : 'var(--color-down)', fontWeight: 600 }}>
      {up ? '+' : '−'}{Math.abs(rounded).toFixed(1)}
    </span>
  );
}

// Leaderboard positions gained/lost since the last Thursday 23:59 reset.
function PositionDelta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="rir-badge" style={{ background: '#eef1f5', color: 'var(--color-text-muted)' }}>NEW</span>;
  }
  if (value === 0) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  const up = value > 0;
  return (
    <span className="rir-badge" style={{ background: up ? '#e9f7ee' : '#fbecec', color: up ? 'var(--color-up)' : 'var(--color-down)' }}>
      {up ? '▲' : '▼'} {Math.abs(value)}
    </span>
  );
}

function monogram(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// Team name matching Match Pulse, with its crest (or a brand-coloured monogram
// when the organisation has no logo).
function TeamCell({ name, logoUrl, primaryColor }: { name: string; logoUrl: string | null; primaryColor: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
      ) : (
        <span
          aria-hidden
          style={{
            width: 24, height: 24, borderRadius: 4, flexShrink: 0,
            background: primaryColor || 'var(--night)', color: 'var(--chalk)',
            fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {monogram(name)}
        </span>
      )}
      <span className="font-medium" style={{ color: 'var(--color-navy-900)' }}>{name}</span>
    </div>
  );
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
                  <th>+/- Pts</th>
                  <th>+/-</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.entityId} className={i === 0 ? 'rir-rank-1' : undefined}>
                    <td className="rir-data font-semibold">{i + 1}</td>
                    <td><TeamCell name={r.name} logoUrl={r.logoUrl} primaryColor={r.primaryColor} /></td>
                    <td className="rir-data">{r.played}</td>
                    <td className="rir-data rir-col-wdl">{r.wins}</td>
                    <td className="rir-data rir-col-wdl">{r.draws}</td>
                    <td className="rir-data rir-col-wdl">{r.losses}</td>
                    <td className="rir-data">{r.winPercent.toFixed(1)}%</td>
                    <td className="rir-data font-semibold" style={{ color: i === 0 ? 'var(--gold)' : undefined }}>{r.rating.toFixed(1)}</td>
                    <td className="rir-data"><PointsDelta value={r.weekPoints} /></td>
                    <td><PositionDelta value={r.movement} /></td>
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
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <strong>+/- Pts</strong> is the rating gained or lost, and <strong>+/-</strong> the positions moved, since the weekly reset — every Thursday at 23:59 (SA time). Teams new since then show <span className="rir-badge" style={{ background: '#eef1f5', color: 'var(--color-text-muted)' }}>NEW</span>.
          </p>
        </>
      )}
    </div>
  );
}
