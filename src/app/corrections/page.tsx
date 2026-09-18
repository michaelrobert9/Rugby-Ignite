import type { Metadata } from 'next';
import { listCorrections } from '@/lib/store/stateStore';
import { MATCHPULSE } from '@/lib/matchpulseLinks';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Corrections | Rugby Ignite',
  description:
    'When Match Pulse changes a result, Rugby Ignite recalculates from that fixture forward and publishes the change here — automatically, without editing the record in place.',
};

export default async function CorrectionsPage() {
  const corrections = await listCorrections();

  return (
    <div className="rir-container py-8">
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
        Corrections · automatic
      </div>
      <h1 className="text-3xl" style={{ margin: '9px 0 8px', maxWidth: '24ch' }}>When Match Pulse changes a result, we say so</h1>
      <p className="text-base" style={{ maxWidth: '64ch', lineHeight: 1.7 }}>
        A ranking that silently recomputes is a ranking nobody trusts. Because ingestion is automatic, corrections
        are too: if a rated fixture’s score or date changes at source, Rugby Ignite recalculates from that fixture
        forward and publishes an entry here — without anyone deciding to, and without editing the record in place.
      </p>

      {corrections.length === 0 ? (
        <div className="rir-card p-6 text-sm" style={{ marginTop: 24, color: 'var(--body-2)' }}>
          No corrections have been needed. When a result is amended on Match Pulse, the change and every rating it
          moved will appear here. If a result looks wrong, report it on{' '}
          <a href={MATCHPULSE.rugby} target="_blank" rel="noopener" className="rir-link">Match Pulse</a> — the
          ranking cannot be lobbied, because the ranking does not hold the data.
        </div>
      ) : (
        <div className="space-y-5" style={{ marginTop: 24 }}>
          {corrections.map((c) => (
            <div key={c.id} className="rir-card" style={{ borderColor: 'var(--coal)' }}>
              <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--rule)' }}>
                <div className="flex flex-wrap items-baseline justify-between" style={{ gap: 12 }}>
                  <h2 className="text-lg">{c.headline}</h2>
                  <div className="rir-subline">Detected {c.detectedAt.slice(0, 10)}</div>
                </div>
                <p className="text-sm" style={{ marginTop: 11, lineHeight: 1.7, maxWidth: '76ch' }}>{c.summary}</p>
              </div>
              <table className="rir-table" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    <th>First XV</th>
                    <th style={{ textAlign: 'right' }}>Was</th>
                    <th style={{ textAlign: 'right' }}>Now</th>
                    <th style={{ textAlign: 'right' }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.teamId}>
                      <td style={{ fontWeight: 500, color: 'var(--coal)' }}>{r.name}</td>
                      <td className="rir-data rir-dim" style={{ textAlign: 'right' }}>{r.was.toFixed(2)}</td>
                      <td className="rir-data" style={{ textAlign: 'right', color: 'var(--coal)', fontWeight: 600 }}>{r.now.toFixed(2)}</td>
                      <td className="rir-data" style={{ textAlign: 'right', color: 'var(--coal)', fontWeight: 600 }}>
                        {r.delta === 0 ? '— 0.00' : `${r.delta > 0 ? '▲' : '▼'} ${Math.abs(r.delta).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
