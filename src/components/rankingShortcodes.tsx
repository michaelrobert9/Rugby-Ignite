import type { ShortcodeRenderer } from '@/lib/content';
import RankingTable, { LastUpdatedLine } from './RankingTable';
import ProvinceTable from './ProvinceTable';
import AdCard from './AdCard';

// Shortcodes usable in editable page bodies:
//   [rankings track="season" limit="20"]           – live School Rugby Rankings table (Elo)
//   [rankings track="master" limit="26"]           – All-Time School Rugby Ratings table
//   [last_updated]                                 – "Last updated: …" line from the live data
//   [province_rankings province="gauteng" track="season|all"] – provincial win-% table
export const rankingShortcodes: ShortcodeRenderer = (name, attrs, key) => {
  if (name === 'rankings') {
    const track = attrs.track === 'season' ? 'season' : 'master';
    const n = attrs.limit ? Number(attrs.limit) : NaN;
    return <RankingTable key={key} track={track} limit={Number.isFinite(n) ? n : undefined} />;
  }
  if (name === 'province_rankings') {
    const track = attrs.track === 'all' ? 'all' : 'season';
    return <ProvinceTable key={key} province={attrs.province ?? ''} track={track} />;
  }
  if (name === 'last_updated' || name === 'rankings_last_updated') {
    return <LastUpdatedLine key={key} />;
  }
  if (name === 'ad') {
    return <AdCard key={key} slot={attrs.slot} label={attrs.label} />;
  }
  return null;
};
