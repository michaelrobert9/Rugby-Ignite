import Link from 'next/link';
import RankingsTable from './RankingsTable';
import { getRankingRows } from '@/lib/viewModels';
import { getConfig } from '@/lib/data/config';
import { listSeasons } from '@/lib/data/matches';
import { getRebuildMeta } from '@/lib/data/rankings';
import { PROVINCES, type Province } from '@/lib/types';

function tabClass(active: boolean): string {
  return `rir-btn ${active ? 'rir-btn-primary' : 'rir-btn-secondary'}`;
}

function isProvince(value: string | undefined): value is Province {
  return !!value && (PROVINCES as readonly string[]).includes(value);
}

export default async function RankingsBlock({
  scope,
  province,
  toggle = false,
  track,
  season,
}: {
  scope?: string;
  province?: string;
  toggle?: boolean;
  track?: string;
  season?: string;
}) {
  // Province-filtered table (intra-province fixtures only).
  const provinceName = province ?? (isProvince(scope) ? scope : undefined);
  if (isProvince(provinceName)) {
    const rows = await getRankingRows('master', provinceName);
    return (
      <RankingsTable
        rows={rows}
        ratingLabel="Rating"
        emptyMessage={`No intra-${provinceName} fixtures recorded yet.`}
      />
    );
  }

  // Master/season toggle (used on the home page).
  if (toggle) {
    const [config, seasons, meta] = await Promise.all([getConfig(), listSeasons(), getRebuildMeta()]);
    const activeTrack = track === 'season' ? 'season' : 'master';
    const activeSeason = season && seasons.includes(season) ? season : config.currentSeason;
    const activeScope = activeTrack === 'master' ? 'master' : activeSeason;
    const rows = await getRankingRows(activeScope);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/?track=master" className={tabClass(activeTrack === 'master')}>
            Master Ranking
          </Link>
          <Link href={`/?track=season&season=${activeSeason}`} className={tabClass(activeTrack === 'season')}>
            Season Ranking
          </Link>
          {activeTrack === 'season' && (
            <div className="flex items-center gap-1.5 ml-1">
              {seasons.map((s) => (
                <Link
                  key={s}
                  href={`/?track=season&season=${s}`}
                  className="rir-badge"
                  style={
                    s === activeSeason
                      ? { background: 'var(--night)', color: 'var(--chalk)' }
                      : { background: '#ece3d3', color: 'var(--color-text-muted)' }
                  }
                >
                  {s}
                </Link>
              ))}
            </div>
          )}
        </div>
        <RankingsTable rows={rows} ratingLabel="Rating" showProvince />
        {meta.lastRebuiltAt && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Last rebuilt {new Date(meta.lastRebuiltAt).toLocaleString('en-ZA')}
          </p>
        )}
      </div>
    );
  }

  // Plain table for an explicit master/season scope.
  const rows = await getRankingRows(scope || 'master');
  return <RankingsTable rows={rows} ratingLabel="Rating" showProvince />;
}
