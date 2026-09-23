// The ranking sponsor band — a naming partner between the page title and the
// table, never inside a row, a rating, the mark or the nav. It collapses to
// nothing when no sponsor is set. Additional to AdSense, not a replacement.
//
// Pass `province` (a province key) on a province page: that province's own
// sponsor shows if set, otherwise it inherits the main sponsor. A sponsor may be
// a logo image (logoUrl) or plain text (name), with an editable lead-in label.

import { getSiteSettings, resolveSponsor } from '@/lib/data/siteSettings';

export default async function SponsorBand({ province }: { province?: string }) {
  const site = await getSiteSettings();
  const s = resolveSponsor(site, province);
  if (!s) return null; // band collapses when empty

  const content = (
    <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
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
        {s.label}
      </span>
      {s.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.logoUrl}
          alt={s.name || 'Sponsor'}
          style={{ height: 30, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block' }}
        />
      ) : (
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
          {s.name}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ padding: '13px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
      {s.url ? (
        <a href={s.url} target="_blank" rel="noopener" aria-label={s.name || 'Sponsor'}>
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
