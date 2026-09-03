// Match Pulse–shaped SAMPLE data, used until the read-only live adapter is
// pointed at the real sport databases. Generated deterministically from a
// latent "strength" per org so the resulting ladders read sensibly (stronger
// schools rank higher) — no randomness, stable across runs.

import type { MPMatch, MPOrg, MPTeam, SportKey } from './types';

const ORGS: Array<MPOrg & { strength: number }> = [
  { id: 'org-paarlgim', name: 'Paarl Gimnasium', strength: 92 },
  { id: 'org-grey', name: 'Grey College', strength: 86 },
  { id: 'org-affies', name: 'Afrikaanse Hoër Seunskool', strength: 80 },
  { id: 'org-monument', name: 'Hoërskool Monument', strength: 74 },
  { id: 'org-maritzburg', name: 'Maritzburg College', strength: 68 },
  { id: 'org-westville', name: 'Westville Boys High', strength: 62 },
];

export const SAMPLE_ORGS: MPOrg[] = ORGS.map(({ id, name }) => ({ id, name }));

const AGES = ['u19', 'u16'];
const SEASONS = ['2025', '2026'];
// A couple of orgs field a B side, so team-level differs from org-level.
const B_SIDE_ORGS = new Set(['org-paarlgim', 'org-grey']);

export const SAMPLE_TEAMS: MPTeam[] = (() => {
  const teams: MPTeam[] = [];
  for (const o of ORGS) {
    for (const age of AGES) {
      const label = age.toUpperCase();
      teams.push({ id: `${o.id}-${age}-a`, orgId: o.id, name: `${o.name} ${label}A`, ageGroup: age });
      if (B_SIDE_ORGS.has(o.id)) {
        teams.push({ id: `${o.id}-${age}-b`, orgId: o.id, name: `${o.name} ${label}B`, ageGroup: age });
      }
    }
  }
  return teams;
})();

const teamId = (orgId: string, age: string, side: 'a' | 'b' = 'a') => `${orgId}-${age}-${side}`;

// Deterministic scoreline from two strengths, in the sport's unit.
function scoreline(sport: SportKey, sh: number, sa: number, seed: number): [number, number] {
  const diff = sh - sa;
  if (sport === 'rugby') {
    const base = 22 + (seed % 7);
    const h = Math.max(0, Math.round(base + diff * 0.45 + (seed % 5)));
    const a = Math.max(0, Math.round(base - diff * 0.45 + ((seed * 3) % 5)));
    return [h, a];
  }
  // goal sports
  const base = 3 + (seed % 3);
  const h = Math.max(0, Math.round(base + diff * 0.06));
  const a = Math.max(0, Math.round(base - diff * 0.06));
  return [h, a];
}

function buildMatches(sport: SportKey): MPMatch[] {
  const out: MPMatch[] = [];
  let n = 0;
  for (const season of SEASONS) {
    for (const age of AGES) {
      // Single round-robin among the A sides.
      for (let i = 0; i < ORGS.length; i++) {
        for (let j = i + 1; j < ORGS.length; j++) {
          const home = ORGS[i];
          const away = ORGS[j];
          n += 1;
          const [hs, as] = scoreline(sport, home.strength, away.strength, n);
          const month = 3 + (n % 6);
          out.push({
            id: `${sport}-${season}-${age}-${n}`,
            sport,
            ageGroup: age,
            season,
            date: `${season}-${String(month).padStart(2, '0')}-${String(10 + (n % 18)).padStart(2, '0')}`,
            homeOrgId: home.id,
            awayOrgId: away.id,
            homeTeamId: teamId(home.id, age),
            awayTeamId: teamId(away.id, age),
            homeScore: hs,
            awayScore: as,
            homeTries: sport === 'rugby' ? Math.round(hs / 6) : null,
            awayTries: sport === 'rugby' ? Math.round(as / 6) : null,
          });
        }
      }
      // A few B-side fixtures so the team ladder has more than the A sides.
      const bs = Array.from(B_SIDE_ORGS);
      for (const orgId of bs) {
        for (const opp of ORGS.slice(0, 3)) {
          if (opp.id === orgId) continue;
          n += 1;
          const strengthB = (ORGS.find((o) => o.id === orgId)!.strength) - 15;
          const [hs, as] = scoreline(sport, strengthB, opp.strength, n);
          out.push({
            id: `${sport}-${season}-${age}-b-${n}`,
            sport,
            ageGroup: age,
            season,
            date: `${season}-0${3 + (n % 6)}-${String(5 + (n % 20)).padStart(2, '0')}`,
            homeOrgId: orgId,
            awayOrgId: opp.id,
            homeTeamId: teamId(orgId, age, 'b'),
            awayTeamId: teamId(opp.id, age),
            homeScore: hs,
            awayScore: as,
            homeTries: sport === 'rugby' ? Math.round(hs / 6) : null,
            awayTries: sport === 'rugby' ? Math.round(as / 6) : null,
          });
        }
      }
    }
  }
  return out;
}

// Rugby and hockey have sample results; waterpolo/netball are empty for now.
export const SAMPLE_MATCHES: Record<SportKey, MPMatch[]> = {
  rugby: buildMatches('rugby'),
  hockey: buildMatches('hockey'),
  waterpolo: [],
  netball: [],
};
