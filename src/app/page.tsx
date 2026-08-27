import Link from 'next/link';
import RankingsTable from '@/components/RankingsTable';
import { getConfig } from '@/lib/data/config';
import { listSeasons } from '@/lib/data/matches';
import { getRebuildMeta } from '@/lib/data/rankings';
import { getRankingRows } from '@/lib/viewModels';

export const dynamic = 'force-dynamic';

export default async function HomePage(props: PageProps<'/'>) {
  const searchParams = await props.searchParams;
  const [config, seasons, meta] = await Promise.all([getConfig(), listSeasons(), getRebuildMeta()]);

  const track = searchParams.track === 'season' ? 'season' : 'master';
  const season =
    typeof searchParams.season === 'string' && seasons.includes(searchParams.season)
      ? searchParams.season
      : config.currentSeason;

  const scope = track === 'master' ? 'master' : season;
  const rows = await getRankingRows(scope);
  const title = track === 'master' ? config.masterTitle : `${config.seasonTitle} — ${season}`;

  return (
    <div className="rir-container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
          {title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {track === 'master'
            ? 'One continuous rating across every fixture ever played. Never resets.'
            : `Resets each season, seeded from Master. ${rows.length} team${rows.length === 1 ? '' : 's'} active in ${season}.`}
          {meta.lastRebuiltAt && (
            <> · Last rebuilt {new Date(meta.lastRebuiltAt).toLocaleString('en-ZA')}</>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/?track=master" className={tabClass(track === 'master')}>
          Master Ranking
        </Link>
        <Link href={`/?track=season&season=${season}`} className={tabClass(track === 'season')}>
          Season Ranking
        </Link>
        {track === 'season' && (
          <div className="flex items-center gap-1.5 ml-1">
            {seasons.map((s) => (
              <Link
                key={s}
                href={`/?track=season&season=${s}`}
                className="rir-badge"
                style={
                  s === season
                    ? { background: 'var(--color-navy-900)', color: '#fff' }
                    : { background: '#eef1f5', color: 'var(--color-text-muted)' }
                }
              >
                {s}
              </Link>
            ))}
          </div>
        )}
      </div>

      <RankingsTable rows={rows} ratingLabel={track === 'master' ? 'Rating' : 'Rating'} showProvince />

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Browse by province for a region-only table — see{' '}
        <Link href="/provinces" className="underline">
          Provinces
        </Link>
        .
      </p>
    </div>
  );
}

function tabClass(active: boolean): string {
  return `rir-btn ${active ? 'rir-btn-primary' : 'rir-btn-secondary'}`;
}
