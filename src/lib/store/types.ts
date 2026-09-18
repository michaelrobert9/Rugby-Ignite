// Rugby Ignite's OWN persisted state store (the `rugby-ignite` Firestore DB).
//
// Until the 2027 rebuild, everything ranking-facing was recomputed live per
// request and nothing was persisted. The state store is what the brand brief
// needs to hold: ingested fixtures, an append-only rating history, current
// standings (with Form Heat), immutable snapshots, the method config, and the
// correction + article records. The rating engine (rankingEngine.ts) is the
// thing that WRITES most of this — it is not re-implemented here.
//
// These shapes are storage contracts: keep them additive (new optional fields)
// so an older stored document keeps deserialising.

import type { MatchRating } from '../types';

/**
 * A fixture as Rugby Ignite ingests it — the six fields the README allows, plus
 * the derived idempotency key. Rugby Ignite holds no other match data.
 */
export interface StoredFixture {
  fixtureId: string; // stable Match Pulse id — the outbound link + idempotency
  homeSchool: string; // canonical org id
  awaySchool: string; // canonical org id
  homeScore: number | null;
  awayScore: number | null;
  date: string; // ISO 'YYYY-MM-DD'
  season: string; // e.g. '2027'
  status: 'complete' | 'incomplete'; // only 'complete' is rated
  amendedAt: string | null; // source amend timestamp; drives corrections
  /** Idempotency key: `${fixtureId}@${amendedAt ?? '0'}`. */
  ingestKey: string;
  /** True when a required field was missing, so the fixture is queued not rated. */
  queued: boolean;
  ingestedAt: string; // when Rugby Ignite first saw this version
}

/** A row of the append-only rating history — one per team per rated fixture per scope. */
export type RatingHistoryRow = MatchRating & {
  /** Denormalised for cheap history queries; equals matchRating.matchDate. */
  season: string;
};

export type HeatBand = 'cold' | 'cool' | 'warm' | 'hot' | 'white-hot';

/** A current-standings row: the engine's TeamRating plus derived Form Heat. */
export interface StandingRow {
  teamId: string;
  name: string;
  province: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  rating: number;
  startingRating: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winPercent: number;
  movement: number | null; // positions vs the Thursday cutoff
  weekPoints: number | null; // rating points vs the Thursday cutoff
  /** Form Heat 0–100 (recent form, opponent-weighted) — null when withheld. */
  formHeat: number | null;
  formHeatBand: HeatBand | null;
}

/** The persisted standings for one scope (Master or a season year). */
export interface StoredStandings {
  scope: string; // 'master' | '2027' | …
  rows: StandingRow[];
  builtAt: string;
  methodVersion: string;
}

/** An immutable, dated ranking snapshot (weekly, or daily in festival mode). */
export interface StoredSnapshot {
  id: string; // `${scope}__${date}` (date = capture day, SAST)
  scope: string;
  date: string; // 'YYYY-MM-DD'
  round: number | null;
  rows: Array<Pick<StandingRow, 'teamId' | 'name' | 'rating' | 'movement'>>;
  builtAt: string;
  methodVersion: string;
  /** Set when a later correction supersedes this snapshot (banner, never edit). */
  supersededBy: string | null; // correction id
}

export type CadenceMode = 'off-season' | 'ordinary' | 'festival';

/** Build metadata — the single "where the site is right now" record. */
export interface BuildMeta {
  builtAt: string; // ISO of the last successful build
  round: number | null; // ordinary-mode round counter
  cadence: CadenceMode;
  methodVersion: string;
  lastFixtureDate: string | null; // most recent rated fixture date
  ratedFixtures: number;
  queuedFixtures: number;
}
