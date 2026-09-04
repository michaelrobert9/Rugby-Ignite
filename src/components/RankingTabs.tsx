'use client';

import { useState } from 'react';

interface SeasonYear {
  year: string;
  table: React.ReactNode; // server-rendered live table for that season
}

// Season / All-Time tabs for the home page. All-Time is first and shown by
// default. The Season tab lets the viewer pick any year. Every table is
// rendered on the server and passed in; switching tab/year just shows the
// matching one (instant, no reload) and the heading + intro copy follow.
export default function RankingTabs({
  master,
  season,
  lastUpdated,
}: {
  master: { heading: string; intro: string; table: React.ReactNode };
  season: { heading: string; intro: string; years: SeasonYear[] };
  lastUpdated?: React.ReactNode; // shown on both tabs
}) {
  const [tab, setTab] = useState<'master' | 'season'>('master');
  const latest = season.years.length ? season.years[season.years.length - 1].year : '';
  const [year, setYear] = useState<string>(latest);

  const onMaster = tab === 'master';
  const heading = onMaster ? master.heading : season.heading;
  const intro = onMaster ? master.intro : season.intro;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Ranking view" className="flex gap-1" style={{ borderBottom: '1px solid #e5ddce' }}>
        <TabButton active={onMaster} onClick={() => setTab('master')}>All-Time</TabButton>
        <TabButton active={!onMaster} onClick={() => setTab('season')}>Season</TabButton>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>{heading}</h1>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)', maxWidth: '52rem' }}>{intro}</p>
        {lastUpdated && <div className="mt-2">{lastUpdated}</div>}
      </div>

      {/* Season year picker */}
      {!onMaster && season.years.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--color-text-muted)' }}>Season</span>
          {season.years.map((y) => (
            <button
              key={y.year}
              type="button"
              onClick={() => setYear(y.year)}
              className="rir-badge"
              style={
                y.year === year
                  ? { background: 'var(--night)', color: 'var(--chalk)', cursor: 'pointer', border: 'none' }
                  : { background: '#ece3d3', color: 'var(--color-text-muted)', cursor: 'pointer', border: 'none' }
              }
            >
              {y.year}
            </button>
          ))}
        </div>
      )}

      {/* All tables stay mounted; only the active one shows. */}
      <div hidden={!onMaster}>{master.table}</div>
      {season.years.map((y) => (
        <div key={y.year} hidden={onMaster || y.year !== year}>{y.table}</div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="px-4 py-2 text-sm font-semibold"
      style={{
        color: active ? 'var(--color-navy-900)' : 'var(--color-text-muted)',
        borderBottom: `3px solid ${active ? 'var(--ember)' : 'transparent'}`,
        marginBottom: -1,
        background: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
