// Match Pulse–shaped data model for the ranking test bed.
//
// These shapes mirror the real Match Pulse platform (a shared Firebase project
// with one named Firestore database per sport). The ranking system reads this
// data READ-ONLY and computes ratings in memory — it never writes back.
//
// A "sport" has its own database (rugby/hockey/waterpolo/netball). Within a
// sport, results are grouped by AGE GROUP (u19, u16, …). Rankings are computed
// per sport × age group, on two tracks (Master = continuous, Season = per year),
// at two levels: organisation (school/club) and individual team (e.g. U16A).

export type SportKey = 'rugby' | 'hockey' | 'waterpolo' | 'netball';

export interface SportDef {
  key: SportKey;
  name: string;
  /** How a score is expressed — drives labels and the ranking margin scale. */
  scoreUnit: 'points' | 'goals';
  /** Admin toggle: does this sport get a ranking system at all. */
  rankingsEnabled: boolean;
}

export interface MPOrg {
  id: string;
  name: string; // school / club name
}

/** An individual side within an org, e.g. "Paarl Gimnasium U16A". */
export interface MPTeam {
  id: string;
  orgId: string;
  name: string;
  ageGroup: string; // 'u19' | 'u16' | 'senior' | …
}

/** A finalised result, normalised from a sport DB's `matches` collection. */
export interface MPMatch {
  id: string;
  sport: SportKey;
  ageGroup: string;
  season: string; // e.g. '2026'
  date: string; // ISO
  homeOrgId: string;
  awayOrgId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  // Rugby only, when known (used for future bonus-point tuning). null = unknown.
  homeTries?: number | null;
  awayTries?: number | null;
}

export type Track = 'master' | 'season';
export type RankLevel = 'org' | 'team';

/** One row in a computed ladder. */
export interface RatingRow {
  entityId: string;
  name: string;
  subtitle?: string; // e.g. org name under a team, or province
  rating: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winPercent: number;
}
