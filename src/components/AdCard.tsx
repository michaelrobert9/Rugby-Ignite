// A fixed advertising card. Drop [ad slot="1234567890"] into any page body where
// you want an ad. AdSense fills the card in place — it never moves or injects
// ads elsewhere. Until a publisher id + slot are set it shows a neutral "Ad
// space" placeholder so the layout position is visible.

import { getSiteSettings } from '@/lib/data/siteSettings';
import AdSlot from './AdSlot';

export default async function AdCard({ slot, label = 'Advertisement' }: { slot?: string; label?: string }) {
  const { adsenseClient } = await getSiteSettings();
  const live = Boolean(adsenseClient && slot);

  return (
    <div className="rir-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--color-text-muted)', padding: '6px 10px 0',
        }}
      >
        {label}
      </div>
      <div style={{ padding: '8px 10px 12px', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {live ? (
          <AdSlot client={adsenseClient} slot={slot!} />
        ) : (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Ad space</span>
        )}
      </div>
    </div>
  );
}
