import Link from 'next/link';
import type { RankingRow } from '@/lib/viewModels';

function MovementCell({ movement }: { movement: number | null }) {
  if (movement === null) {
    return (
      <span className="rir-badge" style={{ background: '#eef1f5', color: 'var(--color-text-muted)' }}>
        NEW
      </span>
    );
  }
  if (movement === 0) {
    return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  }
  const up = movement > 0;
  return (
    <span
      className="rir-badge"
      style={{
        background: up ? '#e9f7ee' : '#fbecec',
        color: up ? 'var(--color-up)' : 'var(--color-down)',
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(movement)}
    </span>
  );
}

export default function RankingsTable({
  rows,
  ratingLabel,
  showProvince = false,
  emptyMessage = 'No matches have fed this ranking yet.',
}: {
  rows: RankingRow[];
  ratingLabel: string;
  showProvince?: boolean;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rir-card p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rir-table-wrap">
      <table className="rir-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Team</th>
            {showProvince && <th>Province</th>}
            <th>Win%</th>
            <th>{ratingLabel}</th>
            <th>This week</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.teamId} className={r.position === 1 ? 'rir-rank-1' : undefined}>
              <td className="rir-data font-semibold">{r.position}</td>
              <td>
                <Link href={`/teams/${r.teamId}`} className="font-medium hover:underline" style={{ color: 'var(--color-navy-900)' }}>
                  {r.teamName}
                </Link>
              </td>
              {showProvince && (
                <td>
                  {r.province ? (
                    <Link href={`/provinces/${encodeURIComponent(r.province)}`} className="text-xs hover:underline" style={{ color: 'var(--color-text-muted)' }}>
                      {r.province}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
              )}
              <td className="rir-data">{r.winPercent.toFixed(1)}%</td>
              <td className="rir-data font-semibold" style={{ color: r.position === 1 ? 'var(--gold)' : undefined }}>
                {r.rating.toFixed(2)}
              </td>
              <td>
                <MovementCell movement={r.movement} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
