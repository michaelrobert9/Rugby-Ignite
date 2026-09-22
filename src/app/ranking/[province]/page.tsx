import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RankingTable from '@/components/RankingTable';
import SponsorBand from '@/components/SponsorBand';
import { provinceByKey } from '@/lib/matchpulse/provinces';
import { getCurrentSeason, withSeason } from '@/lib/season';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: PageProps<'/ranking/[province]'>): Promise<Metadata> {
  const { province } = await props.params;
  const def = provinceByKey(province);
  if (!def) return {};
  const s = getCurrentSeason();
  return {
    title: withSeason(`${def.name} School Rugby Rankings {season} | Rugby Ignite`, s),
    description: `The ${def.name} first teams on the Ignite Rating. A province view — positions stay national, so fourth in ${def.name} still means fourth in the country.`,
  };
}

export default async function ProvinceRankingPage(props: PageProps<'/ranking/[province]'>) {
  const { province } = await props.params;
  const def = provinceByKey(province);
  if (!def) notFound();

  return (
    <div className="rir-container py-8 space-y-5">
      <div className="space-y-1">
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
          Province view · positions stay national
        </div>
        <h1 className="text-2xl">{def.name} School Rugby Rankings</h1>
        <p className="text-sm" style={{ color: 'var(--body-2)', maxWidth: '60ch' }}>
          The {def.name} first teams, in their national order — fourth here still means fourth in the country.{' '}
          <Link href="/" className="rir-link">See the full national ranking →</Link>
        </p>
      </div>

      <SponsorBand />

      <RankingTable track="master" province={def.name} />
    </div>
  );
}
