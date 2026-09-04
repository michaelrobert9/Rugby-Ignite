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
          The easy way: add your publisher ID below and let AdSense place ads for you. No ad units or cards to set up.
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
              From your AdSense account (Account → Account information). Leave blank to turn ads off. When set, the
              AdSense script loads across the whole site.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              ads.txt
            </label>
            <textarea className="rir-input" name="adsTxt" rows={4} defaultValue={site.adsTxt} placeholder="Leave blank to auto-generate the standard AdSense line from your publisher ID." style={{ fontFamily: 'var(--font-mono, monospace)' }} />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Served at <code>/ads.txt</code> (AdSense checks this to verify your account). Leave it blank and, once
              a publisher ID is set, the standard line — <code>google.com, pub-…, DIRECT, f08c47fec0942fa0</code> —
              is generated for you. Paste your own only if AdSense gives you a specific ads.txt to use.
            </p>
          </div>
          <button type="submit" className="rir-btn rir-btn-primary">Save ad settings</button>
        </div>
      </form>

      <div className="rir-card p-5 text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Simplest: let AdSense place the ads (Auto ads)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Enter your <strong>publisher ID</strong> above and save.</li>
          <li>In your AdSense account, open <strong>Ads → By site</strong>, add <strong>rugbyignite.co.za</strong> (if it isn&apos;t already), and switch <strong>Auto ads ON</strong>.</li>
          <li>That&apos;s it — AdSense places and manages the ads across the site automatically. Nothing to add to any page.</li>
        </ol>
      </div>

      <div className="rir-card p-5 text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Optional: fixed ad slots (only if you want exact placement)</h2>
        <p>
          If you&apos;d rather control where ads sit, keep Auto ads off, create a <strong>Display ad unit</strong> in AdSense
          for each spot, and drop its slot ID into a page or post: <code>[ad slot=&quot;1234567890&quot;]</code>. You can skip
          this entirely if you&apos;re using Auto ads.
        </p>
      </div>
    </div>
  );
}
