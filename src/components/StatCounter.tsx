'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// StatCounter loader. Renders the counter only when BOTH a project id and a
// security code are configured, and never in the admin area (so admin traffic
// isn't counted). Values come from Site settings (Admin → SEO).
export default function StatCounter({ project, security }: { project: string; security: string }) {
  const pathname = usePathname();
  const p = project.trim();
  const s = security.trim();
  if (!p || !s || pathname?.startsWith('/admin')) return null;

  return (
    <>
      <Script id="statcounter-init" strategy="afterInteractive">
        {`var sc_project=${JSON.stringify(p)};var sc_invisible=1;var sc_security=${JSON.stringify(s)};var sc_https=1;`}
      </Script>
      <Script src="https://www.statcounter.com/counter/counter.js" strategy="afterInteractive" />
      <noscript>
        <div className="statcounter">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="statcounter"
            src={`https://c.statcounter.com/${p}/0/${s}/1/`}
            alt="Web Analytics"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </noscript>
    </>
  );
}
