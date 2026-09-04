// Match Pulse–shaped data model for the ranking system.
//
// The system reads Match Pulse data READ-ONLY and computes ratings in memory —
// it never writes back. A "sport" is its own named Firestore database
// (rugby/hockey/…). Within a sport, results are grouped by AGE GROUP (which is
// the team dimension — a school's side for that age group). Rankings are one
// ladder per sport × age group, on two tracks (Master = all-time, Season).

export type SportKey = 'rugby' | 'hockey' | 'waterpolo' | 'netball';

export interface SportDef {
  key: SportKey;
  name: string;
  scoreUnit: 'points' | 'goals';
  rankingsEnabled: boolean; // admin toggle: does this sport get rankings
}

export interface MPOrg {
  id: string;
  name: string; // canonical school / club name from Match Pulse `organizations`
  matchName?: string | null; // short "match name" Match Pulse shows on match cards
  logoUrl?: string | null; // organisation crest/logo URL, when set
  primaryColor?: string | null; // brand colour, for the monogram fallback
  region?: string | null; // Match Pulse `region` (e.g. "Western Province") — used for province tables
}

/** A finalised result, normalised from a sport DB's `matches` collection. */
export interface MPMatch {
  id: string;
  sport: SportKey;
  ageGroup: string; // 'u19' | 'u16' | '1st' | …
  season: string; // e.g. '2026'
  date: string; // ISO 'YYYY-MM-DD'
  homeOrgId: string;
  awayOrgId: string;
  homeScore: number;
  awayScore: number;
  // Rugby only, when known — reserved for future bonus-point tuning.
  homeTries?: number | null;
  awayTries?: number | null;
}

export type Track = 'master' | 'season';
