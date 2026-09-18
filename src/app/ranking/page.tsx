import type { Metadata } from 'next';
import Link from 'next/link';
import RankingTable from '@/components/RankingTable';
import SponsorBand from '@/components/SponsorBand';
import MatchPulseCTA from '@/components/MatchPulseCTA';
import { getStandings, schoolSlug } from '@/lib/store/read';
import { getCurrentSeason, withSeason } from '@/lib/season';
import JsonLd from '@/components/JsonLd';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rugbyignite.co.za').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = getCurrentSeason();
  return {
    title: withSeason('The Ignite Rating — All-Time School Rugby Rankings {season} | Rugby Ignite', s),
    description:
      'Every South African school first XV rated 0–100 on the Ignite Rating. Whatever one side gains, the other loses — and every number names the match that moved it.',
  };
}

export default async function RankingPage(props: PageProps<'/ranking'>) {
  const searchParams = await props.searchParams;
  const selected = typeof searchParams.province === 'string' ? searchParams.province : undefined;

  // Province chips: only provinces actually present in the data.
  const master = await getStandings('master');
  const provinces = Array.from(
    new Set(master.map((r) => r.province).filter((p): p is string => !!p)),
  ).sort();

  const listRows = (selected ? master.filter((r) => r.province === selected) : master).slice(0, 25);

  return (
    <div className="rir-container py-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'The Ignite Rating — South African school rugby first XV ranking',
          numberOfItems: listRows.length,
          itemListElement: listRows.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: r.name,
            url: `${SITE}/school/${schoolSlug(r.name)}`,
          })),
        }}
      />
      <div className="space-y-2" style={{ maxWidth: '72rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--body-2)',
          }}
        >
          First XV · All recorded fixtures
        </div>
        <h1 className="text-3xl">The Ignite Rating</h1>
        <p className="text-base" style={{ maxWidth: '56ch', color: 'var(--body)' }}>
          Every first team rated 0 to 100. Whatever one side gains, the other loses. Every number names the
          match that moved it.
        </p>
      </div>

      <div className="mt-5" style={{ maxWidth: '72rem' }}>
        <SponsorBand />
      </div>

      {/* Province filter chips — generated from provinces present in the data. */}
      {provinces.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2" style={{ maxWidth: '72rem' }}>
          <ProvinceChip href="/ranking" label="All provinces" active={!selected} />
          {provinces.map((p) => (
            <ProvinceChip
              key={p}
              href={`/ranking?province=${encodeURIComponent(p)}`}
              label={p}
              active={selected === p}
            />
          ))}
        </div>
      )}

      <div className="mt-5" style={{ maxWidth: '72rem' }}>
        <RankingTable track="master" ads province={selected} />
      </div>

      <p className="mt-4 text-sm" style={{ maxWidth: '74ch', color: 'var(--body-2)' }}>
        Every row comes from the rating store — the province filters are generated from the provinces present in
        the data. No row is hand-placed, and no school is ever featured, pinned or promoted.
      </p>

      <div className="mt-6" style={{ maxWidth: '72rem' }}>
        <MatchPulseCTA />
      </div>
    </div>
  );
}

function ProvinceChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em',
        textTransform: 'uppercase', padding: '7px 12px',
        border: `1px solid ${active ? 'var(--coal)' : 'var(--rule)'}`,
        background: active ? 'var(--coal)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--body)',
      }}
    >
      {label}
    </Link>
  );
}
