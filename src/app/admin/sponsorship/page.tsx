import { getSiteSettings, type Sponsor } from '@/lib/data/siteSettings';
import { PROVINCES } from '@/lib/matchpulse/provinces';
import SponsorshipEditor from './SponsorshipEditor';

export const dynamic = 'force-dynamic';

const EMPTY: Sponsor = { name: '', logoUrl: '', url: '', label: '' };

export default async function SponsorshipSettingsPage(props: PageProps<'/admin/sponsorship'>) {
  const searchParams = await props.searchParams;
  const site = await getSiteSettings();

  const mainSponsor: Sponsor =
    site.sponsor ?? { name: site.sponsorName ?? '', logoUrl: '', url: site.sponsorUrl ?? '', label: '' };

  const scopes = [
    { key: 'main', label: 'Main', sponsor: mainSponsor },
    ...PROVINCES.map((p) => ({
      key: p.key,
      label: p.name,
      sponsor: site.provinceSponsors?.[p.key] ?? EMPTY,
    })),
  ];

  const initialScope = typeof searchParams.scope === 'string' ? searchParams.scope : 'main';

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
          The ranking naming partner. A band — “In association with [Sponsor]” — sits between a ranking&apos;s title
          and its table. Set a <strong>Main</strong> sponsor for the home page; tick <em>Show on every page</em> to
          roll it across all provinces, or untick it to sell each province to its own sponsor on that province&apos;s
          tab. Each sponsor can be a name or a logo (via image URL), with its own lead-in text. Separate from and
          additional to AdSense.
        </p>
      </div>

      <SponsorshipEditor scopes={scopes} initialScope={initialScope} everywhere={site.sponsorEverywhere !== false} />

      <div className="rir-card p-5 text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Coming later: paid sponsorship</h2>
        <p>
          A payment gateway can be added here so a sponsor can pay for a naming slot (main or a specific province)
          directly. Not built yet — for now, set the name/logo and link manually when a sponsor comes on board.
        </p>
      </div>
    </div>
  );
}
