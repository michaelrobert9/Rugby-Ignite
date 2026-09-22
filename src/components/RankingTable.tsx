// The ranking table — Brand Book v8: four columns only (POS · 1ST TEAM ·
// RATING · CHANGE). Win %, matches and Form Heat all live on Match Pulse and
// were cut. Tap a row to expand the reason for the movement, the match citation
// and the season shape — there are no school pages. The leader's rating carries
// the one Ember Deep figure; movement is ink. Read-only.

import { getSiteSettings } from '@/lib/data/siteSettings';
import { getCurrentSeason } from '@/lib/season';
import { getStandings, getSiteBuild } from '@/lib/store/read';
import { DEFAULT_AD_SLOTS } from '@/lib/adsense';
import { fmtUpdated } from './rankingCells';
import { movementSentence } from '@/lib/generate/sentences';
import RankingBoard from './RankingBoard';
import { type ExpandRow } from './RankingRows';
import { MATCHPULSE } from '@/lib/matchpulseLinks';
import type { RatingHistoryRow, StandingRow } from '@/lib/store/types';

export async function LastUpdatedLine() {
  const build = await getSiteBuild();
  const iso = build.meta?.builtAt ?? null;
  return (
    <p className="text-sm" style={{ color: 'var(--dim)' }}>
      Last updated: {iso ? fmtUpdated(iso) : 'awaiting the first verified result'}
    </p>
  );
}

function reasonFor(name: string, lm: NonNullable<StandingRow['lastMovement']>): string {
  // Reuse the movement sentence template with the fields the last movement carries.
  return movementSentence(name, {
    opponentName: lm.opponentName,
    opponentRatingBefore: lm.opponentRatingBefore,
    ratingBefore: lm.ratingBefore,
    pointsFor: lm.pointsFor,
    pointsAgainst: lm.pointsAgainst,
    ratingChange: lm.ratingChange,
    outcome: lm.outcome,
  } as RatingHistoryRow);
}

function longDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export default async function RankingTable({
  track = 'master',
  season,
  limit,
  ads = false,
  province,
  search = false,
}: {
  track?: 'season' | 'master';
  season?: string;
  limit?: number;
  ads?: boolean;
  province?: string;
  search?: boolean;
}) {
  const scope = track === 'master' ? 'master' : season || getCurrentSeason();
  const build = await getSiteBuild();
  const all = build.standingsByScope[scope] ?? [];
  const site = ads ? await getSiteSettings() : null;

  // Current-season shape per team (for the row expansion), by team id.
  const seasonScope = build.latestSeason;
  const seasonRows = seasonScope ? build.standingsByScope[seasonScope] ?? [] : [];
  const seasonByTeam = new Map(seasonRows.map((r) => [r.teamId, r] as const));

  if (all.length === 0) {
    return (
      <div className="rir-card p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No results are available yet.
      </div>
    );
  }

  // National rank is the index in the full ordering; a province filter hides
  // rows but NEVER renumbers them (Website Brief §05).
  const enriched: ExpandRow[] = all.map((r, i) => {
    const lm = r.lastMovement ?? null;
    const season = seasonByTeam.get(r.teamId);
    return {
      teamId: r.teamId,
      rank: i + 1,
      name: r.name,
      province: r.province,
      rating: r.rating,
      change: r.weekPoints,
      isLeader: i === 0,
      reason: lm ? reasonFor(r.name, lm) : null,
      citationLabel: lm ? `${lm.opponentName} ${lm.pointsFor}–${lm.pointsAgainst} · ${longDate(lm.date)}` : null,
      citationHref: lm?.matchHref ?? MATCHPULSE.rugby,
      seasonOpen: season ? season.startingRating : null,
      seasonNow: season ? season.rating : null,
    };
  });

  const filtered = province ? enriched.filter((r) => r.province === province) : enriched;
  const rows = typeof limit === 'number' && limit > 0 ? filtered.slice(0, limit) : filtered;

  const slot = ads ? site?.adsense?.slotMid ?? DEFAULT_AD_SLOTS.mid : '';

  return <RankingBoard rows={rows} adSlot={slot} search={search} />;
}
