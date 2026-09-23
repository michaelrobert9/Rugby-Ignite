import { redirect, permanentRedirect } from 'next/navigation';

// Season ranking pages moved to /school-rugby-rankings/{year} (SEO-friendly).
// Keep old links working with a permanent redirect; non-year paths go home.
export default async function LegacySeasonRankingPage(props: PageProps<'/rankings/[year]'>) {
  const { year } = await props.params;
  if (/^\d{4}$/.test(year)) permanentRedirect(`/school-rugby-rankings/${year}`);
  redirect('/');
}
