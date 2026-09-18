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

// A quiet "NEW" tag for entries with no prior snapshot to compare against.
function NewTag() {
  return (
    <span className="rir-badge" style={{ background: 'var(--offwhite)', color: 'var(--dim)', border: '1px solid var(--light)' }}>NEW</span>
  );
}

// Rating points gained/lost since the last Thursday 23:59 reset. Brand Book
// v7.0: an arrow plus a figure, always in coal — never green/red, so the table
// reads correctly in greyscale and for colour-blind readers.
export function PointsDelta({ value }: { value: number | null }) {
  if (value === null) return <NewTag />;
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return <span className="rir-data" style={{ color: 'var(--dim)' }}>— 0.00</span>;
  const up = rounded > 0;
  return (
    <span className="rir-data" style={{ color: 'var(--coal)', fontWeight: 600 }}>
      {up ? '▲' : '▼'} {Math.abs(rounded).toFixed(2)}
    </span>
  );
}

// Leaderboard positions gained/lost since the last Thursday 23:59 reset.
// Arrow plus a figure, in coal only (never colour-coded) — same rule as points.
export function PositionDelta({ value }: { value: number | null }) {
  if (value === null) return <NewTag />;
  if (value === 0) return <span className="rir-data" style={{ color: 'var(--dim)' }}>—</span>;
  const up = value > 0;
  return (
    <span className="rir-data" style={{ color: 'var(--coal)', fontWeight: 600 }}>
      {up ? '▲' : '▼'} {Math.abs(value)}
    </span>
  );
}
