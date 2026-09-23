'use client';

import { useMemo, useState } from 'react';
import RankingRows, { type ExpandRow } from './RankingRows';

// The ranking board: an optional search field above the four-column table.
// Search matches every way a school is written
// (Paarl Gim, Gimnasium, Gym) so it can replace a browse tree and an A–Z. The
// province filter is applied server-side; positions stay national.
export default function RankingBoard({
  rows,
  adSlot = '',
  search = false,
  stats = false,
}: {
  rows: ExpandRow[];
  adSlot?: string;
  search?: boolean;
  stats?: boolean; // province table: add Played / Won / Drawn / Lost / Win %
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
        <table className={`rir-table${stats ? ' rir-table--stats' : ''}`}>
          <thead>
            <tr>
              <th className="rir-col-pos">Pos</th>
              <th>1st Team</th>
              {stats && (
                <>
                  <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>P</th>
                  <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>W</th>
                  <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>D</th>
                  <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>L</th>
                  <th className="rir-col-win" style={{ textAlign: 'right' }}>Win %</th>
                </>
              )}
              <th className="rir-col-rating" style={{ textAlign: 'right' }}>Rating</th>
              <th className="rir-col-change" style={{ textAlign: 'right' }}>Change</th>
            </tr>
          </thead>
          <RankingRows rows={filtered} adSlot={adSlot} stats={stats} />
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
