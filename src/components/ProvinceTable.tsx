// A provincial win-percentage table (no ratings) rendered from live Match Pulse
// data, via the [province_rankings province="gauteng" track="season|all"] shortcode.

import { getCachedSportData } from '@/lib/matchpulse/cachedSource';
import { computeProvinceTable, provinceByKey } from '@/lib/matchpulse/provinces';
import { getCurrentSeason } from '@/lib/season';
import { TeamCell } from './TeamCell';

export default async function ProvinceTable({
  province,
  track = 'season',
  season,
}: {
  province: string;
  track?: 'season' | 'all';
  season?: string; // season year for the season track; defaults to currentSeason
}) {
  const def = provinceByKey(province);
  if (!def) return null;

  const { matches, orgs } = await getCachedSportData('rugby');
  const seasonYear = season || getCurrentSeason();
  const rows = computeProvinceTable(matches, orgs, def, track, seasonYear);

  if (rows.length === 0) {
    return (
      <div className="rir-card p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No {def.name} results recorded yet{track === 'season' ? ` for the ${seasonYear} season` : ''}.
      </div>
    );
  }

  return (
    <div className="rir-table-wrap">
      <table className="rir-table rir-table--stats">
        <thead>
          <tr>
            <th className="rir-col-pos">Pos</th>
            <th>1st Team</th>
            <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>P</th>
            <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>W</th>
            <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>D</th>
            <th className="rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>L</th>
            <th className="rir-col-win" style={{ textAlign: 'right' }}>Win %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.entityId}>
              <td>{i + 1}</td>
              <td><TeamCell name={r.name} logoUrl={r.logoUrl} primaryColor={r.primaryColor} /></td>
              <td className="rir-data rir-dim rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>{r.played}</td>
              <td className="rir-data rir-dim rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>{r.wins}</td>
              <td className="rir-data rir-dim rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>{r.draws}</td>
              <td className="rir-data rir-dim rir-col-pwdl rir-col-stat" style={{ textAlign: 'right' }}>{r.losses}</td>
              <td className="rir-rating rir-col-win" style={{ textAlign: 'right', color: i === 0 ? 'var(--ember-deep)' : 'var(--ink)' }}>{r.winPercent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
