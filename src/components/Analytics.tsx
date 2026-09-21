'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Google Analytics (GA4) loader. Renders the gtag tags only when a measurement
// id is configured and the visitor is not in the admin area, so admin traffic
// isn't counted. The id comes from Site settings (Admin → SEO).
export default function Analytics({ id }: { id: string }) {
  const pathname = usePathname();
  if (!id || pathname?.startsWith('/admin')) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
