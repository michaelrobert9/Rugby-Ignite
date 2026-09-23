import { getSiteSettings } from '@/lib/data/siteSettings';
import { saveSponsorAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function SponsorshipSettingsPage(props: PageProps<'/admin/sponsorship'>) {
  const searchParams = await props.searchParams;
  const site = await getSiteSettings();

  return (
    <div className="space-y-6">
      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Sponsorship saved.
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Sponsorship</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          The ranking naming partner. When set, a band — “In association with [Sponsor]” — appears between a
          ranking&apos;s title and its table, on the home page and every province page. It never sits inside a row, a
          rating, the logo or the nav. This is separate from and additional to AdSense.
        </p>
      </div>

      <form action={saveSponsorAction} className="space-y-6">
        <div className="rir-card p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Sponsor name
            </label>
            <input className="rir-input" name="sponsorName" defaultValue={site.sponsorName ?? ''} placeholder="e.g. Acme Sports" />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Leave blank to hide the sponsor band everywhere.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Sponsor link (optional)
            </label>
            <input className="rir-input" name="sponsorUrl" defaultValue={site.sponsorUrl ?? ''} placeholder="https://sponsor.example" />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              If set, the sponsor name links here (opens in a new tab). Leave blank for plain text.
            </p>
          </div>
          <button type="submit" className="rir-btn rir-btn-primary">Save sponsorship</button>
        </div>
      </form>

      <div className="rir-card p-5 text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Live preview</h2>
        {site.sponsorName?.trim() ? (
          <p>
            The band currently reads <strong>In association with {site.sponsorName.trim()}</strong>
            {site.sponsorUrl?.trim() ? <> (linked to {site.sponsorUrl.trim()})</> : null}.
          </p>
        ) : (
          <p>No sponsor set — the band is hidden. Add a name above to show it.</p>
        )}
      </div>

      <div className="rir-card p-5 text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Coming later: paid sponsorship</h2>
        <p>
          A payment gateway can be added here so a sponsor can pay for the naming slot directly. Not built yet —
          for now, set the name and link manually above when a sponsor comes on board.
        </p>
      </div>
    </div>
  );
}
