import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RankingTable, { LastUpdatedLine } from '@/components/RankingTable';
import RankingScopeNav from '@/components/RankingScopeNav';
import SponsorBand from '@/components/SponsorBand';
import { provinceByKey } from '@/lib/matchpulse/provinces';
import { getSiteBuild } from '@/lib/store/read';
import { getCurrentSeason, withSeason, seasonYears } from '@/lib/season';

export const dynamic = 'force-dynamic';

async function knownYear(year: string): Promise<boolean> {
  const build = await getSiteBuild();
  return seasonYears(build.seasons).includes(year);
}

export async function generateMetadata(props: PageProps<'/ranking/[province]/[year]'>): Promise<Metadata> {
  const { province, year } = await props.params;
  const def = provinceByKey(province);
  if (!def || !/^\d{4}$/.test(year) || !(await knownYear(year))) return {};
  return {
    title: `${def.name} School Rugby Rankings ${year} | Rugby Ignite`,
    description: `The ${def.name} first teams for the ${year} season on the Ignite Rating — played, won, drawn, lost and win rate. Positions stay national.`,
  };
}

export default async function ProvinceSeasonRankingPage(props: PageProps<'/ranking/[province]/[year]'>) {
  const { province, year } = await props.params;
  const def = provinceByKey(province);
  if (!def || !/^\d{4}$/.test(year) || !(await knownYear(year))) notFound();

  const build = await getSiteBuild();
  const current = getCurrentSeason();
  const years = seasonYears(build.seasons).map((y) => ({ year: y, href: `/ranking/${province}/${y}` }));

  return (
    <div className="rir-container py-8 space-y-5">
      <div className="space-y-1">
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
          Province view · {year} season{year === current ? ' (in progress)' : ''} · positions stay national
        </div>
        <h1 className="text-2xl">{def.name} School Rugby Rankings {year}</h1>
        <p className="text-sm" style={{ color: 'var(--body-2)', maxWidth: '60ch' }}>
          {withSeason(`The ${def.name} first teams for the ${year} season, in their national order.`, year)}{' '}
          <Link href={`/ranking/${province}`} className="rir-link">See the {def.name} all-time ranking →</Link>
        </p>
      </div>

      <SponsorBand />

      <div className="space-y-4">
        <RankingScopeNav allTimeHref={`/ranking/${province}`} years={years} active={year} />
        <LastUpdatedLine />
        <RankingTable track="season" season={year} province={def.name} stats />
      </div>
    </div>
  );
}
