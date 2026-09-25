// The Rugby Ignite lockup — the supplied master artwork. Imported as module
// assets (not referenced from /public), so they are emitted to
// /_next/static/media and served through the same pipeline as the CSS/JS.
// Firebase App Hosting does not serve /public files for this app, so a bare
// "/logo-stacked.png" 404s.
//
// Two lockups:
//   stacked     — shield + RUGBY / IGNITE on two lines (the main/header mark)
//   horizontal  — shield + RUGBY IGNITE on one line (compact — footer, inline)

import stacked from '../../public/logo-stacked.png';
import horizontal from '../../public/logo-horizontal.png';
import website from '../../public/website-logo.png';

const SOURCES = { stacked, horizontal, website } as const;

export default function Logo({
  height = 44,
  variant = 'stacked',
  className,
}: {
  height?: number;
  variant?: 'stacked' | 'horizontal' | 'website';
  className?: string;
}) {
  const logo = SOURCES[variant];
  const width = Math.round((height * logo.width) / logo.height);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt="Rugby Ignite"
      width={width}
      height={height}
      style={{ height, width, display: 'block' }}
      className={className}
    />
  );
}
