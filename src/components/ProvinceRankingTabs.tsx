// The All-Time / Season tabbed view for one province, mirroring the home page
// but built from the provincial win-percentage tables. Rendered via the
// [province_tabs province="gauteng"] shortcode. Read-only.

import { getCachedSportData } from '@/lib/matchpulse/cachedSource';
import { provinceByKey } from '@/lib/matchpulse/provinces';
import { getCurrentSeason } from '@/lib/season';
import RankingTabs from './RankingTabs';
import ProvinceTable from './ProvinceTable';

export default async function ProvinceRankingTabs({ province }: { province: string }) {
  const def = provinceByKey(province);
  if (!def) return null;

  const { matches } = await getCachedSportData('rugby');
  const season = getCurrentSeason();

  // Every season that appears in the data, plus the current one, oldest → newest.
  const years = Array.from(new Set([...matches.map((m) => m.season), season])).sort();

  return (
    <RankingTabs
      headingLevel="h2"
      master={{
        heading: `Overall ${def.name} Standings`,
        intro: `Win percentage across every season on record, counting only matches between two ${def.name} schools.`,
        table: <ProvinceTable province={province} track="all" />,
      }}
      season={{
        heading: `${def.name} School Rugby Rankings`,
        intro: `This season's win percentage, counting only matches between two ${def.name} schools.`,
        years: years.map((year) => ({
          year,
          table: <ProvinceTable province={province} track="season" season={year} />,
        })),
      }}
    />
  );
}
