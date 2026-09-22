'use client';

import { useMemo, useState } from 'react';
import Logo from './Logo';
import RankingRows, { type ExpandRow } from './RankingRows';

// The ranking board: an optional search field above the table, then the lockup
// and the four-column table. Search matches every way a school is written
// (Paarl Gim, Gimnasium, Gym) so it can replace a browse tree and an A–Z. The
// province filter is applied server-side; positions stay national.
export default function RankingBoard({
  rows,
  adSlot = '',
  search = false,
}: {
  rows: ExpandRow[];
  adSlot?: string;
  search?: boolean;
}) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sq = squash(query);
    return rows.filter((r) => r.name.toLowerCase().includes(query) || squash(r.name).includes(sq));
  }, [q, rows]);

  return (
    <div>
      {search && (
        <div style={{ marginBottom: 14 }}>
          <input
            className="rir-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a school — Paarl Gim, Grey, Affies…"
            aria-label="Find a school"
          />
        </div>
      )}
      <div className="rir-table-wrap">
        <div className="rir-table-lockup">
          <Logo variant="horizontal" height={30} />
        </div>
        <table className="rir-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>Pos</th>
              <th>1st Team</th>
              <th style={{ textAlign: 'right' }}>Rating</th>
              <th style={{ textAlign: 'right', width: 90 }}>Change</th>
            </tr>
          </thead>
          <RankingRows rows={filtered} adSlot={adSlot} />
        </table>
        {search && filtered.length === 0 && (
          <div className="p-6 text-center text-sm" style={{ color: 'var(--body-2)' }}>
            No school matches “{q}”.
          </div>
        )}
      </div>
    </div>
  );
}
