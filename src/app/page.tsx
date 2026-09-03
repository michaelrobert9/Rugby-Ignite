import type { Metadata } from 'next';
import LiveRankings from '@/components/LiveRankings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rugby Ignite — School Rugby Rankings',
  description: 'Live South African school rugby rankings — Master and Season, refreshed as verified results are added.',
};

export default async function HomePage(props: PageProps<'/'>) {
  const sp = await props.searchParams;
  return <LiveRankings sp={sp} basePath="/" />;
}
