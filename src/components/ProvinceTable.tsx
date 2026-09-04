// A provincial win-percentage table (no ratings) rendered from live Match Pulse
// data, via the [province_rankings province="gauteng" track="season|all"] shortcode.

import { getCachedSportData } from '@/lib/matchpulse/cachedSource';
import { computeProvinceTable, provinceByKey } from '@/lib/matchpulse/provinces';
import { getCurrentSeason } from '@/lib/season';
import { TeamCell } from './rankingCells';

export default async function ProvinceTable({
  province,
  track = 'season',
}: {
  province: string;
  track?: 'season' | 'all';
}) {
  const def = provinceByKey(province);
  if (!def) return null;

  const { matches, orgs } = await getCachedSportData('rugby');
  const season = getCurrentSeason();
  const rows = computeProvinceTable(matches, orgs, def, track, season);

  if (rows.length === 0) {
    return (
      <div className="rir-card p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No {def.name} results recorded yet{track === 'season' ? ` for the ${season} season` : ''}.
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
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.entityId} className={i === 0 ? 'rir-rank-1' : undefined}>
              <td className="rir-data font-semibold">{i + 1}</td>
              <td><TeamCell name={r.name} logoUrl={r.logoUrl} primaryColor={r.primaryColor} /></td>
              <td className="rir-data">{r.played}</td>
              <td className="rir-data rir-col-wdl">{r.wins}</td>
              <td className="rir-data rir-col-wdl">{r.draws}</td>
              <td className="rir-data rir-col-wdl">{r.losses}</td>
              <td className="rir-data font-semibold" style={{ color: i === 0 ? 'var(--gold)' : undefined }}>{r.winPercent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
