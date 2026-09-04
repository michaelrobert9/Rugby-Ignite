// Provincial win-percentage tables. These do NOT use the ratings/Elo system —
// they are a plain win percentage, counting ONLY matches played between two
// schools of the same province (a fair, like-for-like regional view).
//
// Province membership comes from each Match Pulse organisation's free-text
// `region`. Because that text varies ("Western Province" vs "Western Cape"),
// each province lists the region keywords that map to it. If live data uses a
// label none of these match, that province table is simply empty until the
// alias is added here.

import type { MPMatch, MPOrg } from './types';

export interface ProvinceDef {
  key: string; // url segment / page id, e.g. 'gauteng'
  name: string; // display name, e.g. 'Gauteng'
  aliases: string[]; // lowercase substrings matched against an org's region
}

export const PROVINCES: ProvinceDef[] = [
  { key: 'gauteng', name: 'Gauteng', aliases: ['gauteng', 'golden lions', 'lions', 'johannesburg', 'pretoria', 'noordvaal', 'jhb', 'joburg'] },
  { key: 'western-cape', name: 'Western Cape', aliases: ['western cape', 'western province', 'wp', 'boland', 'cape town', 'south western districts', 'swd'] },
  { key: 'kzn', name: 'KZN', aliases: ['kzn', 'kwazulu', 'natal', 'sharks', 'durban', 'midlands'] },
  { key: 'eastern-cape', name: 'Eastern Cape', aliases: ['eastern cape', 'eastern province', 'border', 'ep', 'ekapa', ' ep '] },
  { key: 'free-state', name: 'Free State', aliases: ['free state', 'cheetahs', 'bloemfontein', 'vrystaat'] },
];

export function provinceByKey(key: string): ProvinceDef | undefined {
  return PROVINCES.find((p) => p.key === key);
}

function regionMatches(region: string | null | undefined, aliases: string[]): boolean {
  if (!region) return false;
  const r = ` ${region.toLowerCase().trim()} `;
  return aliases.some((a) => r.includes(a.toLowerCase()));
}

export interface ProvinceRow {
  entityId: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winPercent: number;
}

/**
 * Win-percentage table for one province and one track:
 *   track 'season' → matches in `season` only; track 'all' → every season.
 * Only matches where BOTH schools belong to the province are counted.
 */
export function computeProvinceTable(
  matches: MPMatch[],
  orgs: MPOrg[],
  province: ProvinceDef,
  track: 'season' | 'all',
  season: string,
): ProvinceRow[] {
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const inProvince = new Set(orgs.filter((o) => regionMatches(o.region, province.aliases)).map((o) => o.id));

  const acc = new Map<string, { played: number; wins: number; draws: number; losses: number }>();
  const get = (id: string) => {
    let a = acc.get(id);
    if (!a) { a = { played: 0, wins: 0, draws: 0, losses: 0 }; acc.set(id, a); }
    return a;
  };

  for (const m of matches) {
    if (track === 'season' && m.season !== season) continue;
    if (m.homeOrgId === m.awayOrgId) continue;
    if (!inProvince.has(m.homeOrgId) || !inProvince.has(m.awayOrgId)) continue;
    const home = get(m.homeOrgId);
    const away = get(m.awayOrgId);
    home.played += 1;
    away.played += 1;
    if (m.homeScore > m.awayScore) { home.wins += 1; away.losses += 1; }
    else if (m.homeScore < m.awayScore) { home.losses += 1; away.wins += 1; }
    else { home.draws += 1; away.draws += 1; }
  }

  const rows: ProvinceRow[] = Array.from(acc.entries()).map(([id, a]) => {
    const org = orgById.get(id);
    return {
      entityId: id,
      name: org?.name ?? id,
      logoUrl: org?.logoUrl ?? null,
      primaryColor: org?.primaryColor ?? null,
      played: a.played,
      wins: a.wins,
      draws: a.draws,
      losses: a.losses,
      winPercent: a.played ? Math.round((a.wins / a.played) * 1000) / 10 : 0,
    };
  });

  rows.sort(
    (x, y) =>
      y.winPercent - x.winPercent ||
      y.wins - x.wins ||
      y.played - x.played ||
      x.name.localeCompare(y.name),
  );
  return rows;
}
