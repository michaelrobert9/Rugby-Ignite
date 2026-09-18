// The ranking sponsor band — Brand Book v7.0: a naming partner sits between the
// page title and the table, never inside a row, a rating, the mark or the nav.
// It collapses to nothing when no sponsor is set. This is an ADDITIONAL revenue
// stream alongside AdSense (owner decision, 2026-09-18), not a replacement.

import { getSiteSettings } from '@/lib/data/siteSettings';

export default async function SponsorBand() {
  const site = await getSiteSettings();
  const name = site.sponsorName?.trim();
  if (!name) return null; // band collapses when empty

  const label = (
    <>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--body-2)',
          flex: 'none',
        }}
      >
        In association with
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--coal)',
        }}
      >
        {name}
      </span>
    </>
  );

  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: '13px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}
    >
      {site.sponsorUrl?.trim() ? (
        <a href={site.sponsorUrl.trim()} target="_blank" rel="noopener" className="flex items-center gap-3">
          {label}
        </a>
      ) : (
        label
      )}
    </div>
  );
}
