// A live School Rugby Rankings table (Elo), for one track, rendered from live
// Match Pulse data. Used by the home page and other pages via the [rankings]
// shortcode. Read-only.

import { getCachedSportData } from '@/lib/matchpulse/cachedSource';
import { computeLiveLadder } from '@/lib/matchpulse/liveRankings';
import { getSportConfig } from '@/lib/data/config';
import { getCurrentSeason } from '@/lib/season';
import { TeamCell, PointsDelta, PositionDelta, fmtUpdated, rankClass } from './rankingCells';

export async function LastUpdatedLine() {
  const { lastUpdated } = await getCachedSportData('rugby');
  return (
    <p className="text-sm" style={{ color: 'var(--dim)' }}>
      Last updated: {lastUpdated ? fmtUpdated(lastUpdated) : 'awaiting the first verified result'}
    </p>
  );
}

export default async function RankingTable({
  track = 'master',
  season,
  limit,
}: {
  track?: 'season' | 'master';
  season?: string; // season year for the season track; defaults to currentSeason
  limit?: number; // omit for no cap (show every team)
}) {
  const [{ matches, orgs }, config] = await Promise.all([
    getCachedSportData('rugby'),
    getSportConfig('rugby'),
  ]);

  const ages = Array.from(new Set(matches.map((m) => m.ageGroup)));
  const age = ages.includes('1st') ? '1st' : (ages[0] ?? '1st');
  const seasonYear = season || getCurrentSeason();

  const { rows } = computeLiveLadder(matches, orgs, age, track, seasonYear, config);
  const shown = typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;

  if (shown.length === 0) {
    return (
      <div className="rir-card p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No results are available yet.
      </div>
    );
  }

  return (
    <div className="rir-table-wrap">
      <table className="rir-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Team</th>
            <th className="rir-col-sec">P</th>
            <th className="rir-col-wdl">W</th>
            <th className="rir-col-wdl">D</th>
            <th className="rir-col-wdl">L</th>
            <th>Win%</th>
            <th>Rating</th>
            <th className="rir-col-sec">+/- Pts</th>
            <th className="rir-col-sec">+/-</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={r.entityId} className={rankClass(i)}>
              <td className="rir-data font-semibold">{i + 1}</td>
              <td><TeamCell name={r.name} logoUrl={r.logoUrl} primaryColor={r.primaryColor} /></td>
              <td className="rir-data rir-dim rir-col-sec">{r.played}</td>
              <td className="rir-data rir-dim rir-col-wdl">{r.wins}</td>
              <td className="rir-data rir-dim rir-col-wdl">{r.draws}</td>
              <td className="rir-data rir-dim rir-col-wdl">{r.losses}</td>
              <td className="rir-data rir-dim">{r.winPercent.toFixed(1)}%</td>
              <td className="rir-data font-semibold">{r.rating.toFixed(1)}</td>
              <td className="rir-data rir-col-sec"><PointsDelta value={r.weekPoints} /></td>
              <td className="rir-col-sec"><PositionDelta value={r.movement} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
