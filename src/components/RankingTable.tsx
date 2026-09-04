// A live School Rugby Rankings table (Elo), for one track, rendered from live
// Match Pulse data. Used by the home page and other pages via the [rankings]
// shortcode. Read-only.

import { loadSportData } from '@/lib/matchpulse/source';
import { computeLiveLadder } from '@/lib/matchpulse/liveRankings';
import { getSportConfig } from '@/lib/data/config';
import { TeamCell, PointsDelta, PositionDelta, fmtUpdated } from './rankingCells';

export async function LastUpdatedLine() {
  const { lastUpdated } = await loadSportData('rugby');
  return (
    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
    loadSportData('rugby'),
    getSportConfig('rugby'),
  ]);

  const ages = Array.from(new Set(matches.map((m) => m.ageGroup)));
  const age = ages.includes('1st') ? '1st' : (ages[0] ?? '1st');
  const seasonYear = season || config.currentSeason;

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
            <th>P</th>
            <th className="rir-col-wdl">W</th>
            <th className="rir-col-wdl">D</th>
            <th className="rir-col-wdl">L</th>
            <th>Win%</th>
            <th>Rating</th>
            <th>+/- Pts</th>
            <th>+/-</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={r.entityId} className={i === 0 ? 'rir-rank-1' : undefined}>
              <td className="rir-data font-semibold">{i + 1}</td>
              <td><TeamCell name={r.name} logoUrl={r.logoUrl} primaryColor={r.primaryColor} /></td>
              <td className="rir-data">{r.played}</td>
              <td className="rir-data rir-col-wdl">{r.wins}</td>
              <td className="rir-data rir-col-wdl">{r.draws}</td>
              <td className="rir-data rir-col-wdl">{r.losses}</td>
              <td className="rir-data">{r.winPercent.toFixed(1)}%</td>
              <td className="rir-data font-semibold" style={{ color: i === 0 ? 'var(--gold)' : undefined }}>{r.rating.toFixed(1)}</td>
              <td className="rir-data"><PointsDelta value={r.weekPoints} /></td>
              <td><PositionDelta value={r.movement} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
