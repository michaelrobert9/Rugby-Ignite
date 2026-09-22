'use client';

import { useState } from 'react';
import AdUnit from './AdUnit';

export interface ExpandRow {
  teamId: string;
  rank: number; // national position — stays national even in a province view
  name: string;
  logoUrl: string | null; // school crest from Match Pulse, when set
  province: string | null;
  rating: number;
  change: number | null; // rating-point movement since the Thursday cutoff
  isLeader: boolean;
  reason: string | null; // the generated movement sentence
  citationLabel: string | null; // "Opponent 24–17 · 7 Aug 2027"
  citationHref: string;
  seasonOpen: number | null;
  seasonNow: number | null;
}

function Change({ value }: { value: number | null }) {
  if (value == null) return <span className="rir-data" style={{ color: 'var(--body-2)' }}>NEW</span>;
  if (value === 0) return <span className="rir-data" style={{ color: 'var(--body-2)' }}>— 0.00</span>;
  return (
    <span className="rir-data" style={{ color: 'var(--ink)', fontWeight: 600 }}>
      {value > 0 ? '▲' : '▼'} {Math.abs(value).toFixed(2)}
    </span>
  );
}

// One in-feed ad after row 10 — past the point most visitors have found their
// school, never above the ranking or between the top ten (Website Brief §04).
const AD_AFTER_ROW = 10;

export default function RankingRows({ rows, adSlot = '' }: { rows: ExpandRow[]; adSlot?: string }) {
  const [open, setOpen] = useState<string | null>(null);

  const out: React.ReactNode[] = [];
  rows.forEach((r, i) => {
    const isOpen = open === r.teamId;
    out.push(
      <tr
        key={r.teamId}
        onClick={() => setOpen(isOpen ? null : r.teamId)}
        style={{ cursor: 'pointer' }}
        aria-expanded={isOpen}
      >
        <td>{r.rank}</td>
        <td>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {r.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.logoUrl}
                alt=""
                aria-hidden
                width={24}
                height={24}
                loading="lazy"
                style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <span style={{ fontWeight: 500, color: 'var(--ink)', minWidth: 0, overflowWrap: 'anywhere', lineHeight: 1.25 }}>{r.name}</span>
          </span>
        </td>
        <td
          className="rir-rating"
          style={{ textAlign: 'right', color: r.isLeader ? 'var(--ember-deep)' : 'var(--ink)' }}
        >
          {r.rating.toFixed(2)}
        </td>
        <td style={{ textAlign: 'right' }}><Change value={r.change} /></td>
      </tr>,
    );

    if (isOpen) {
      out.push(
        <tr key={`${r.teamId}-x`} className="rir-expand">
          <td colSpan={4}>
            <div className="rir-expand-inner">
              {r.reason && <p className="rir-expand-reason">{r.reason}</p>}
              <div className="rir-expand-meta">
                {r.citationLabel && (
                  <a href={r.citationHref} target="_blank" rel="noopener" className="rir-link">
                    {r.citationLabel} →
                  </a>
                )}
                {r.seasonOpen != null && r.seasonNow != null && (
                  <span className="rir-data" style={{ color: 'var(--body-2)' }}>
                    Season {r.seasonOpen.toFixed(2)} → {r.seasonNow.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>,
      );
    }

    if (adSlot && i + 1 === AD_AFTER_ROW && rows.length > AD_AFTER_ROW) {
      out.push(
        <tr key="ad-infeed" className="rir-adrow">
          <td colSpan={4}>
            <div className="rir-ad" aria-label="Advertisement">
              <span className="rir-ad-label">Advertisement</span>
              <AdUnit slot={adSlot} />
            </div>
          </td>
        </tr>,
      );
    }
  });

  return <tbody>{out}</tbody>;
}
