import type { ShortcodeRenderer } from '@/lib/content';
import RankingTable, { LastUpdatedLine } from './RankingTable';

// Shortcodes usable in editable page bodies:
//   [rankings track="season" limit="20"]  – live School Rugby Rankings table (Elo)
//   [rankings track="master" limit="26"]  – All-Time School Rugby Ratings table
//   [last_updated]                        – "Last updated: …" line from the live data
export const rankingShortcodes: ShortcodeRenderer = (name, attrs, key) => {
  if (name === 'rankings') {
    const track = attrs.track === 'season' ? 'season' : 'master';
    const n = attrs.limit ? Number(attrs.limit) : NaN;
    return <RankingTable key={key} track={track} limit={Number.isFinite(n) ? n : undefined} />;
  }
  if (name === 'last_updated' || name === 'rankings_last_updated') {
    return <LastUpdatedLine key={key} />;
  }
  return null;
};
