// The School Rugby Rankings table, rendered from the persisted state store (with
// a live-build fallback). Brand Book v7.0 §06 layout: POS · FIRST XV (province +
// match count beneath) · WIN% · HEAT (Form Heat gauge) · RATING · RTG PTS. On a
// phone it collapses to three columns — position, school, rating — with win% and
// movement demoted under the school name. Read-only.

import { getSiteSettings } from '@/lib/data/siteSettings';
import { getCurrentSeason } from '@/lib/season';
import Link from 'next/link';
import { getStandings, schoolSlug } from '@/lib/store/read';
import { DEFAULT_AD_SLOTS } from '@/lib/adsense';
import { PointsDelta, fmtUpdated, rankClass } from './rankingCells';
import { TeamCell } from './TeamCell';
import { HeatGauge } from './FormGauge';
import AdUnit from './AdUnit';
import { getSiteBuild } from '@/lib/store/read';

const RANKING_TABLE_COLS = 6; // POS, FIRST XV, WIN%, HEAT, RATING, RTG PTS
const MID_AFTER_ROW = 20; // insert the MID ad after this row

function AdBlock({ slot }: { slot: string }) {
  if (!slot) return null;
  return (
    <div className="rir-ad">
      <AdUnit slot={slot} />
    </div>
  );
}

export async function LastUpdatedLine() {
  const build = await getSiteBuild();
  const iso = build.meta?.builtAt ?? null;
  return (
    <p className="text-sm" style={{ color: 'var(--dim)' }}>
      Last updated: {iso ? fmtUpdated(iso) : 'awaiting the first verified result'}
    </p>
  );
}

export default async function RankingTable({
  track = 'master',
  season,
  limit,
  ads = false,
  province,
}: {
  track?: 'season' | 'master';
  season?: string;
  limit?: number;
  ads?: boolean;
  province?: string; // filter to one province (by name), re-ranked within it
}) {
  const scope = track === 'master' ? 'master' : season || getCurrentSeason();
  const [allRows, site] = await Promise.all([
    getStandings(scope), // cap AFTER any province filter
    ads ? getSiteSettings() : Promise.resolve(null),
  ]);
  const filtered = province ? allRows.filter((r) => r.province === province) : allRows;
  const rows = typeof limit === 'number' && limit > 0 ? filtered.slice(0, limit) : filtered;

  if (rows.length === 0) {
    return (
      <div className="rir-card p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No results are available yet.
      </div>
    );
  }

  const slots = {
    top: site?.adsense?.slotTop ?? DEFAULT_AD_SLOTS.top,
    mid: site?.adsense?.slotMid ?? DEFAULT_AD_SLOTS.mid,
    bottom: site?.adsense?.slotBottom ?? DEFAULT_AD_SLOTS.bottom,
  };

  const bodyRows = rows.map((r, i) => (
    <tr key={r.teamId} className={rankClass(i)}>
      <td>{i + 1}</td>
      <td>
        <Link href={`/school/${schoolSlug(r.name)}`} className="rir-school-link">
          <TeamCell name={r.name} logoUrl={r.logoUrl} primaryColor={r.primaryColor} />
        </Link>
        <div className="rir-subline">
          {[r.province, `${r.played} ${r.played === 1 ? 'match' : 'matches'}`].filter(Boolean).join(' · ')}
        </div>
        <div className="rir-subline rir-mobile-only">
          {r.winPercent.toFixed(1)}% · <PointsDelta value={r.weekPoints} />
        </div>
      </td>
      <td className="rir-data rir-dim rir-col-sec" style={{ textAlign: 'right' }}>{r.winPercent.toFixed(1)}%</td>
      <td className="rir-col-sec" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex' }}><HeatGauge heat={r.formHeat} /></div>
      </td>
      <td className="rir-rating" style={{ textAlign: 'right' }}>{r.rating.toFixed(2)}</td>
      <td className="rir-col-sec" style={{ textAlign: 'right' }}><PointsDelta value={r.weekPoints} /></td>
    </tr>
  ));

  if (ads && slots.mid && rows.length > MID_AFTER_ROW) {
    bodyRows.splice(
      MID_AFTER_ROW,
      0,
      <tr key="ad-mid">
        <td colSpan={RANKING_TABLE_COLS} style={{ padding: 0, borderLeft: 'none' }}>
          <div className="rir-ad">
            <AdUnit slot={slots.mid} />
          </div>
        </td>
      </tr>,
    );
  }

  const table = (
    <div className="rir-table-wrap">
      <table className="rir-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>First XV</th>
            <th className="rir-col-sec" style={{ textAlign: 'right' }}>Win%</th>
            <th className="rir-col-sec" style={{ textAlign: 'center' }}>Heat</th>
            <th style={{ textAlign: 'right' }}>Rating</th>
            <th className="rir-col-sec" style={{ textAlign: 'right' }}>Rtg Pts</th>
          </tr>
        </thead>
        <tbody>{bodyRows}</tbody>
      </table>
    </div>
  );

  if (!ads) return table;

  return (
    <div className="space-y-4">
      <AdBlock slot={slots.top} />
      {table}
      <AdBlock slot={slots.bottom} />
    </div>
  );
}
