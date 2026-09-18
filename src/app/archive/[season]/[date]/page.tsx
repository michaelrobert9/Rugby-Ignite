import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readSnapshot } from '@/lib/store/stateStore';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: PageProps<'/archive/[season]/[date]'>): Promise<Metadata> {
  const { date } = await props.params;
  return {
    title: `Ranking snapshot · ${date} | Rugby Ignite`,
    description: `The frozen All-Time School Rugby Ranking as it stood on ${date}. Snapshots are immutable once written.`,
  };
}

export default async function ArchivePage(props: PageProps<'/archive/[season]/[date]'>) {
  const { date } = await props.params;
  const snapshot = await readSnapshot(`master__${date}`);
  if (!snapshot) notFound();

  return (
    <div className="rir-container py-8">
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
        Archive · frozen snapshot · method v{snapshot.methodVersion}
      </div>
      <h1 className="text-3xl" style={{ margin: '9px 0 8px' }}>All-Time Ranking · {snapshot.date}</h1>
      <p className="text-sm" style={{ maxWidth: '60ch', color: 'var(--body-2)' }}>
        This is the ranking exactly as it stood on {snapshot.date}. Snapshots are immutable — if a later result
        was amended on Match Pulse, this page keeps its numbers and gains a link to the correction.
      </p>

      <div className="rir-table-wrap" style={{ marginTop: 20 }}>
        <table className="rir-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>First XV</th>
              <th style={{ textAlign: 'right' }}>Rating</th>
              <th className="rir-col-sec" style={{ textAlign: 'right' }}>+/-</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((r, i) => (
              <tr key={r.teamId}>
                <td>{i + 1}</td>
                <td style={{ fontWeight: 500, color: 'var(--coal)' }}>{r.name}</td>
                <td className="rir-rating" style={{ textAlign: 'right' }}>{r.rating.toFixed(2)}</td>
                <td className="rir-data rir-col-sec" style={{ textAlign: 'right', color: 'var(--coal)', fontWeight: 600 }}>
                  {r.movement == null ? '—' : r.movement === 0 ? '—' : `${r.movement > 0 ? '▲' : '▼'} ${Math.abs(r.movement)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
