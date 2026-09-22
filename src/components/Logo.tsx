// The Rugby Ignite lockup — the supplied master artwork (flame-shield + wordmark)
// from public/logo-stacked.png. Used in the header, footer and ranking card so
// the site uses the real logo file rather than a re-drawn version.

export default function Logo({ height = 44, className }: { height?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-stacked.png"
      alt="Rugby Ignite"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
      className={className}
    />
  );
}
