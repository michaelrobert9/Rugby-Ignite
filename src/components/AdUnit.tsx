'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ADSENSE_CLIENT } from '@/lib/adsense';

// One explicit AdSense display unit. The loader (adsbygoogle.js) is added once
// in the root layout; here we declare the <ins> and ask AdSense to fill it.
//
// The <ins> is keyed on the current pathname so a client-side navigation
// remounts it (a fresh element with no data-adsbygoogle-status), and the push
// re-runs — otherwise AdSense would treat the already-initialised slot as done
// and the ad would go blank after navigating.
export default function AdUnit({ slot, className }: { slot: string; className?: string }) {
  const pathname = usePathname();
  const ref = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getAttribute('data-adsbygoogle-status')) return; // already filled/initialised
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Loader not present (blocked, no consent, or not yet configured) — leave empty.
    }
  }, [pathname]);

  return (
    <ins
      key={`${slot}-${pathname}`}
      ref={ref}
      className={className ? `adsbygoogle ${className}` : 'adsbygoogle'}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
