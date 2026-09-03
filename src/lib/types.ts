// Shared types for the Rugby Ignite data model.
//
// These shapes are deliberately identical to what the plan calls for in
// Firestore: `teams`, `venues`, `matches`, and computed `rankings`. The data
// access layer (lib/data/*.ts) reads/writes these shapes against local JSON
// files today; swapping to Firestore later means re-implementing the same
// function signatures against the Firestore SDK, not changing these types.

export const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'Eastern Cape',
  'KZN',
  'Free State',
] as const;

export type Province = (typeof PROVINCES)[number];

/** Display order for the province nav tabs. */
export const PROVINCE_NAV_ORDER: Province[] = [
  'Gauteng',
  'Western Cape',
  'KZN',
  'Eastern Cape',
  'Free State',
];

/**
 * An editable CMS page (home + each province). Content is authored as text
 * with [rankings] shortcodes that expand to live ranking tables.
 */
export interface Page {
  id: string; // slug, also the document id: 'home', 'gauteng', 'kzn', ...
  slug: string; // URL path used for this page (informational + SEO)
  navLabel: string; // label shown in the top navigation
  navOrder: number;
  showInNav: boolean;
  title: string; // H1 shown on the page
  metaTitle: string; // <title> / SEO
  metaDescription: string; // meta description / SEO
  body: string; // markdown-lite content with [rankings ...] shortcodes
  /** Default ranking scope for a bare [rankings] shortcode: 'master' or a Province. */
  rankingScope: string;
}

export interface Venue {
  id: string;
  name: string;
  isNeutral: boolean;
}

export interface Team {
  id: string;
  name: string;
  province: Province | null;
  homeVenueId: string | null;
  logoUrl: string | null;
  /** Flagged during the historical import — needs a human to confirm province/venue. */
  needsReview: boolean;
}

export type MatchStatus = 'scheduled' | 'played' | 'cancelled' | 'postponed';

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homePoints: number | null;
  awayPoints: number | null;
  date: string; // ISO 8601
  season: string; // e.g. "2026"
  venueId: string | null;
  /** Disables home advantage even if venueId matches the home team's homeVenueId. */
  isFestival: boolean;
  /** Whether this fixture should feed the ranking engine at all. */
  rankingEligible: boolean;
  status: MatchStatus;
}

export const TRACK_MASTER = 'master' as const;
export type Scope = typeof TRACK_MASTER | string; // 'master' | a season year, e.g. "2026"

export interface TeamRating {
  teamId: string;
  scope: Scope;
  startingRating: number;
  rating: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Position change since the last Thursday 23:59 snapshot. Null = "NEW" this week. */
  movement: number | null;
  weekPoints: number | null;
}

export interface MatchRating {
  matchId: string;
  teamId: string;
  opponentId: string;
  scope: Scope;
  matchDate: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  expectedScore: number;
  isHome: boolean;
  homeAdvantageApplied: boolean;
  pointsFor: number;
  pointsAgainst: number;
  outcome: 'win' | 'loss' | 'draw';
  marginBonus: boolean;
  upsetTier: number;
  capped: boolean;
}

export interface RankingConfig {
  kMaster: number;
  masterSafetyCap: number;
  /** A winning margin at/above masterMarginThreshold multiplies the exchange. */
  masterMarginMultiplier: number;
  masterMarginThreshold: number;
  /** Beating a team ranked ≥ masterUpsetThreshold places above multiplies the
   *  exchange. Applied SYMMETRICALLY (winner +x, loser −x) so Master stays a
   *  pure points exchange — the pool is conserved whatever this is set to. */
  masterUpsetMultiplier: number;
  masterUpsetThreshold: number;
  kSeason: number;
  seedFactor: number;
  seasonMarginMultiplier: number;
  seasonUpsetMultiplier: number;
  seasonSafetyCap: number;
  marginThreshold: number;
  upsetThreshold: number;
  homeAdvantage: number;
  ratingDivisor: number;
  baselineRating: number;
  currentSeason: string;
  masterTitle: string;
  seasonTitle: string;
}

/**
 * A News/Post article (ported from the WordPress plugin's News feature).
 * Body uses the same markdown-lite + [shortcode] format as pages, so a post
 * can embed a live ranking table with [rankings].
 */
export interface Post {
  id: string; // slug, also the document id
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  date: string; // ISO date the post is published/dated
  status: 'draft' | 'published';
}
