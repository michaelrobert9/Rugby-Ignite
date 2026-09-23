// The province ranking view rendered in place of the [province_tabs] shortcode
// on a province page. It mirrors the home page: an "All-Time" link plus one link
// per season year (each a real URL), a heading that names the scope, and the
// province win-% table. `active` decides which scope is shown; the page body's
// top text (above the shortcode) is untouched.

import { provinceByKey } from '@/lib/matchpulse/provinces';
import { getSiteBuild } from '@/lib/store/read';
import { seasonYears } from '@/lib/season';
import RankingScopeNav from './RankingScopeNav';
import ProvinceTable from './ProvinceTable';
import SponsorBand from './SponsorBand';

export default async function ProvinceRankingView({
  province,
  slug,
  active = 'all',
}: {
  province: string; // province key, e.g. "gauteng"
  slug: string; // the province page's own path, e.g. "/gauteng-school-rugby-ranking"
  active?: 'all' | string; // 'all' or a season year
}) {
  const def = provinceByKey(province);
  if (!def) return null;

  const base = slug.startsWith('/') ? slug : `/${slug}`;
  const build = await getSiteBuild();
  const years = seasonYears(build.seasons).map((year) => ({ year, href: `${base}/${year}` }));

  const onAll = active === 'all';
  const heading = onAll ? `${def.name} Rugby Rankings — All-Time` : `${def.name} School Rugby Rankings ${active}`;
  const intro = onAll
    ? `Win percentage across every season on record — only matches between two ${def.name} schools count.`
    : `The ${active} season by win percentage — only matches between two ${def.name} schools count.`;

  return (
    <div className="space-y-4">
      <SponsorBand province={province} />
      <RankingScopeNav allTimeHref={base} years={years} active={active} />
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{heading}</h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--body-2)', maxWidth: '52rem' }}>{intro}</p>
      </div>
      <ProvinceTable province={province} track={onAll ? 'all' : 'season'} season={onAll ? undefined : active} />
    </div>
  );
}
