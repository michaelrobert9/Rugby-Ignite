import Link from 'next/link';

// The ranking scope switcher: an "All-Time" link followed by one link per
// season year. Every option is a real URL (its own page) so each season ranks
// on its own in search — picking a year navigates rather than toggling. The
// active option carries the Ember Deep underline; the rest sit back in body-2.
export default function RankingScopeNav({
  allTimeHref,
  years,
  active,
}: {
  allTimeHref: string;
  years: { year: string; href: string }[];
  active: 'all' | string; // 'all' or the active season year
}) {
  return (
    <nav className="rir-scope-nav" aria-label="Ranking view">
      <ScopeLink href={allTimeHref} active={active === 'all'}>All-Time</ScopeLink>
      {years.map((y) => (
        <ScopeLink key={y.year} href={y.href} active={active === y.year}>
          {y.year}
        </ScopeLink>
      ))}
    </nav>
  );
}

function ScopeLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`rir-scope-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}
