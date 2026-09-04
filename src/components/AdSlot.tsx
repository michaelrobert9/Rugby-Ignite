'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// One AdSense display ad unit. The loader script is added in the root layout
// when a publisher id is set; here we just declare the slot and ask AdSense to
// fill it. Placement is fixed by where the [ad] card sits — never auto-injected.
export default function AdSlot({ client, slot }: { client: string; slot: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense not loaded (blocked, or no consent) — leave the slot empty. */
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '100%' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
