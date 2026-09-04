'use client';

import { useState } from 'react';

interface TabContent {
  heading: string;
  intro: string;
  extra?: React.ReactNode; // e.g. the "last updated" line (season only)
  table: React.ReactNode; // server-rendered live table
}

// Season / All-Time tabs for the home page. Both tables are rendered on the
// server and passed in; switching tabs just shows the other one and swaps the
// heading + intro copy — instant, no reload. Styled to the Rugby Ignite brand
// (ember accent underline on the active tab).
export default function RankingTabs({
  season,
  master,
  defaultTab = 'season',
}: {
  season: TabContent;
  master: TabContent;
  defaultTab?: 'season' | 'master';
}) {
  const [tab, setTab] = useState<'season' | 'master'>(defaultTab);
  const active = tab === 'season' ? season : master;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Ranking view" className="flex gap-1" style={{ borderBottom: '1px solid #e5ddce' }}>
        <TabButton active={tab === 'season'} onClick={() => setTab('season')}>Season</TabButton>
        <TabButton active={tab === 'master'} onClick={() => setTab('master')}>All-Time</TabButton>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>{active.heading}</h1>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)', maxWidth: '52rem' }}>{active.intro}</p>
        {active.extra && <div className="mt-2">{active.extra}</div>}
      </div>

      {/* Both tables stay mounted; only the active one is shown. */}
      <div hidden={tab !== 'season'}>{season.table}</div>
      <div hidden={tab !== 'master'}>{master.table}</div>
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
