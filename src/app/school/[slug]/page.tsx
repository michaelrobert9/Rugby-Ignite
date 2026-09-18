import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MatchPulseCTA from '@/components/MatchPulseCTA';
import { HeatGaugeVertical } from '@/components/FormGauge';
import { getSchoolBySlug, getSeasonRow, getTeamHistory, getSiteBuild } from '@/lib/store/read';
import { HEAT_BAND_LABEL } from '@/lib/store/methodConfig';
import { MATCHPULSE } from '@/lib/matchpulseLinks';
import { movementSentence } from '@/lib/generate/sentences';
import JsonLd from '@/components/JsonLd';
import type { RatingHistoryRow } from '@/lib/store/types';

export const dynamic = 'force-dynamic';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export async function generateMetadata(props: PageProps<'/school/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await getSchoolBySlug(slug);
  if (!found) return {};
  const { row, rank } = found;
  return {
    title: `${row.name} — School Rugby Rating & Ranking | Rugby Ignite`,
    description: `${row.name} are rated ${row.rating.toFixed(2)} on the Ignite Rating, ranked ${ordinal(rank)} of South African school first XVs. Every rating change names the match that moved it.`,
  };
}

export default async function SchoolPage(props: PageProps<'/school/[slug]'>) {
  const { slug } = await props.params;
  const found = await getSchoolBySlug(slug);
  if (!found) notFound();
  const { row, rank, total } = found;

  const build = await getSiteBuild();
  const season = build.latestSeason;
  const [seasonRow, seasonHistory] = await Promise.all([
    getSeasonRow(row.teamId),
    season ? getTeamHistory(season, row.teamId) : Promise.resolve([] as RatingHistoryRow[]),
  ]);

  const changes = [...seasonHistory].sort(
    (a, b) => b.matchDate.localeCompare(a.matchDate) || b.matchId.localeCompare(a.matchId),
  );
  const last = changes[0] ?? null;
  const heat = seasonRow?.formHeat ?? row.formHeat;
  const band = seasonRow?.formHeatBand ?? row.formHeatBand;
  const wins = seasonRow?.wins ?? 0;
  const losses = seasonRow?.losses ?? 0;
  const draws = seasonRow?.draws ?? 0;
  const winPct = seasonRow?.winPercent ?? row.winPercent;

  return (
    <div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsTeam',
          name: row.name,
          sport: 'Rugby union',
          ...(row.province ? { location: { '@type': 'Place', name: row.province } } : {}),
          description: `${row.name} are rated ${row.rating.toFixed(2)} on the Ignite Rating, ranked ${ordinal(rank)} of ${total} South African school first XVs.`,
        }}
      />
      {/* Header */}
      <div className="rir-container py-8" style={{ borderBottom: '1px solid var(--coal)' }}>
        <div className="flex flex-wrap items-start" style={{ gap: 32 }}>
          {heat != null && (
            <div className="flex-none">
              <HeatGaugeVertical heat={heat} band={band} />
            </div>
          )}
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--body-2)',
              }}
            >
              First XV{row.province ? ` · ${row.province}` : ''}
            </div>
            <h1 className="text-3xl" style={{ margin: '7px 0 5px' }}>{row.name}</h1>
            <div className="flex flex-wrap" style={{ gap: 28, marginTop: 22 }}>
              <BigFigure value={row.rating.toFixed(2)} label="Ignite Rating" />
              <BigFigure value={ordinal(rank)} label={`of ${total}`} />
              {heat != null && (
                <BigFigure
                  value={String(heat)}
                  label={`Form Heat${band ? ` · ${HEAT_BAND_LABEL[band]}` : ''}`}
                  ember
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rir-container py-8 grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', alignItems: 'start' }}>
        {/* Every rating change this season */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--body-2)', borderBottom: '1px solid var(--coal)',
              paddingBottom: 8,
            }}
          >
            Every rating change{season ? ` · ${season} season` : ''}
          </div>
          {changes.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--body-2)', marginTop: 12 }}>
              No rated fixtures this season yet.
            </p>
          ) : (
            changes.map((c) => (
              <div
                key={`${c.matchId}`}
                className="grid items-center"
                style={{ gridTemplateColumns: '1fr 58px 60px', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--rule)' }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--coal)', lineHeight: 1.3 }}>{c.opponentName}</div>
                  <div className="rir-subline">{c.matchDate} · rated {c.opponentRatingBefore.toFixed(2)}</div>
                </div>
                <div className="rir-data" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--coal)' }}>
                  {c.pointsFor}–{c.pointsAgainst}
                </div>
                <div className="rir-data" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--coal)' }}>
                  {c.ratingChange === 0 ? '— 0.00' : `${c.ratingChange > 0 ? '▲' : '▼'} ${Math.abs(c.ratingChange).toFixed(2)}`}
                </div>
              </div>
            ))
          )}
          <div className="rir-subline" style={{ paddingTop: 11 }}>
            {changes.length} rated {changes.length === 1 ? 'fixture' : 'fixtures'} · W {wins} · D {draws} · L {losses} · {winPct.toFixed(1)}%
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col" style={{ gap: 18 }}>
          {last && (
            <div className="rir-card" style={{ padding: 22, borderColor: 'var(--coal)' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
                Last movement
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--coal)', marginTop: 11 }}>
                {movementSentence(row.name, last)}
              </div>
              <div className="rir-subline" style={{ marginTop: 14, borderTop: '1px solid var(--rule)', paddingTop: 11 }}>
                {last.matchDate}
              </div>
            </div>
          )}

          <div className="rir-card" style={{ padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
              Where the matches live
            </div>
            <p className="text-sm" style={{ marginTop: 11, lineHeight: 1.7 }}>
              Rugby Ignite holds no fixtures, scores, stats, squads or photographs. Each result above is the
              citation for a rating change and nothing more.
            </p>
            <div className="rir-subline" style={{ marginTop: 12, borderTop: '1px solid var(--rule)', paddingTop: 11 }}>
              <a href={MATCHPULSE.rugby} target="_blank" rel="noopener" className="rir-link">{row.name} on Match Pulse →</a>
            </div>
          </div>
        </div>
      </div>

      <div className="rir-container" style={{ paddingBottom: 32 }}>
        <MatchPulseCTA />
      </div>
    </div>
  );
}

function BigFigure({ value, label, ember }: { value: string; label: string; ember?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontSize: 50, lineHeight: 0.9,
          letterSpacing: '-0.04em', color: ember ? 'var(--ember-deep)' : 'var(--coal)',
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--body-2)', marginTop: 7 }}>
        {label}
      </div>
    </div>
  );
}

