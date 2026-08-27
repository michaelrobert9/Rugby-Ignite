import Link from 'next/link';
import { notFound } from 'next/navigation';
import RankingsTable from '@/components/RankingsTable';
import { getConfig } from '@/lib/data/config';
import { PROVINCES, type Province } from '@/lib/types';
import { getRankingRows } from '@/lib/viewModels';

export const dynamic = 'force-dynamic';

export default async function ProvincePage(props: PageProps<'/provinces/[province]'>) {
  const { province: raw } = await props.params;
  const province = decodeURIComponent(raw) as Province;
  if (!PROVINCES.includes(province)) notFound();

  const [config, rows] = await Promise.all([getConfig(), getRankingRows('master', province)]);

  return (
    <div className="rir-container py-8 space-y-6">
      <div>
        <Link href="/provinces" className="text-xs hover:underline" style={{ color: 'var(--color-text-muted)' }}>
          ← All provinces
        </Link>
        <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--color-navy-900)' }}>
          {province}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {config.masterTitle}, filtered to fixtures between two {province} teams only.
        </p>
      </div>
      <RankingsTable rows={rows} ratingLabel="Rating" emptyMessage={`No intra-${province} fixtures recorded yet.`} />
    </div>
  );
}
