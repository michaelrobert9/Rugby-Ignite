// The Rugby Ignite lockup — the supplied master artwork. Imported as a module
// asset (not referenced from /public), so it is emitted to /_next/static/media
// and served through the same pipeline as the CSS/JS. Firebase App Hosting does
// not serve /public files for this app, so a bare "/logo-stacked.png" 404s.

import logo from '../../public/logo-stacked.png';

export default function Logo({ height = 44, className }: { height?: number; className?: string }) {
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
