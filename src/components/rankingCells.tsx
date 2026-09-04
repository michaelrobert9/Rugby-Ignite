// Shared presentational cells for the ranking tables (used by the home page,
// the /rankings view and the province tables). No data access here.

export function monogram(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// Podium styling by zero-based row index: #1 Ember, #2–#3 Gold (brand book v6).
// Returns the row class the ranking tables hang the medal treatment off.
export function rankClass(i: number): string | undefined {
  return i === 0 ? 'rir-rank-1' : i === 1 ? 'rir-rank-2' : i === 2 ? 'rir-rank-3' : undefined;
}

// South African school sport — always UTC+2, no daylight saving.
export function fmtUpdated(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg',
  }).format(d);
  return `${date} at ${time} GMT+0200`;
}

// Team name matching Match Pulse, with its crest (or a brand-coloured monogram
// when the organisation has no logo).
export function TeamCell({ name, logoUrl, primaryColor }: { name: string; logoUrl: string | null; primaryColor: string | null }) {
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

// A quiet "NEW" tag for entries with no prior snapshot to compare against.
function NewTag() {
  return (
    <span className="rir-badge" style={{ background: 'var(--offwhite)', color: 'var(--dim)', border: '1px solid var(--light)' }}>NEW</span>
  );
}

// Rating points gained/lost since the last Thursday 23:59 reset. Plain mono
// text — green up, Ember down, Dim when flat (deltas signal, never decorate).
export function PointsDelta({ value }: { value: number | null }) {
  if (value === null) return <NewTag />;
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return <span className="rir-data" style={{ color: 'var(--dim)' }}>—</span>;
  const up = rounded > 0;
  return (
    <span className="rir-data" style={{ color: up ? 'var(--color-up)' : 'var(--color-down)', fontWeight: 700 }}>
      {up ? '+' : '−'}{Math.abs(rounded).toFixed(1)}
    </span>
  );
}

// Leaderboard positions gained/lost since the last Thursday 23:59 reset.
export function PositionDelta({ value }: { value: number | null }) {
  if (value === null) return <NewTag />;
  if (value === 0) return <span className="rir-data" style={{ color: 'var(--dim)' }}>—</span>;
  const up = value > 0;
  return (
    <span className="rir-data" style={{ color: up ? 'var(--color-up)' : 'var(--color-down)', fontWeight: 700 }}>
      {up ? '▲' : '▼'} {Math.abs(value)}
    </span>
  );
}
