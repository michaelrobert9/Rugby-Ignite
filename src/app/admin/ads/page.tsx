import { getSiteSettings } from '@/lib/data/siteSettings';
import { saveSiteSettingsAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function AdsSettingsPage(props: PageProps<'/admin/ads'>) {
  const searchParams = await props.searchParams;
  const site = await getSiteSettings();

  return (
    <div className="space-y-6">
      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Ad settings saved.
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Advertising (AdSense)</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Ads only appear where you place an <code>[ad]</code> card, never automatically over the content.
        </p>
      </div>

      <form action={saveSiteSettingsAction} className="space-y-6">
        <div className="rir-card p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              AdSense publisher ID
            </label>
            <input className="rir-input" name="adsenseClient" defaultValue={site.adsenseClient} placeholder="ca-pub-1234567890123456" />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              From your AdSense account (Account → Settings). Leave blank to turn ads off. When set, the AdSense
              script loads site-wide and your <code>[ad]</code> cards fill.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              ads.txt (optional)
            </label>
            <textarea className="rir-input" name="adsTxt" rows={4} defaultValue={site.adsTxt} placeholder="Leave blank to auto-generate the standard AdSense line from your publisher ID." style={{ fontFamily: 'var(--font-mono, monospace)' }} />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Served at <code>/ads.txt</code>. If blank and a publisher ID is set, the standard
              <code> google.com, pub-…, DIRECT, f08c47fec0942fa0</code> line is generated automatically.
            </p>
          </div>
          <button type="submit" className="rir-btn rir-btn-primary">Save ad settings</button>
        </div>
      </form>

      <div className="rir-card p-5 text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>How to place ads</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>In AdSense, create a <strong>Display ad unit</strong> for each slot you want. Copy its <strong>ad slot ID</strong> (the <code>data-ad-slot</code> number).</li>
          <li>In <strong>Pages</strong> (or a post), drop an ad card where you want it: <code>[ad slot=&quot;1234567890&quot;]</code>. Add an optional label with <code>[ad slot=&quot;1234567890&quot; label=&quot;Sponsored&quot;]</code>.</li>
          <li>Keep AdSense <strong>Auto ads OFF</strong> for this site so Google never injects ads over your content — these fixed cards are the only placements.</li>
        </ol>
      </div>
    </div>
  );
}
