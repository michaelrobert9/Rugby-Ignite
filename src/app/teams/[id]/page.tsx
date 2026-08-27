import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVenue } from '@/lib/data/venues';
import { listMatchesForTeam } from '@/lib/data/matches';
import { getTeam, listTeams } from '@/lib/data/teams';
import { getTeamRating } from '@/lib/data/rankings';
import { getConfig } from '@/lib/data/config';
import type { TeamRating } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TeamPage(props: PageProps<'/teams/[id]'>) {
  const { id } = await props.params;
  const team = await getTeam(id);
  if (!team) notFound();

  const [teams, venue, config, master, recentAll] = await Promise.all([
    listTeams(),
    team.homeVenueId ? getVenue(team.homeVenueId) : Promise.resolve(undefined),
    getConfig(),
    getTeamRating(team.id, 'master'),
    listMatchesForTeam(team.id),
  ]);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const season = await getTeamRating(team.id, config.currentSeason);
  const recentMatches = recentAll.slice(0, 20);

  return (
    <div className="rir-container py-8 space-y-6">
      <div>
        <Link href="/" className="text-xs hover:underline" style={{ color: 'var(--color-text-muted)' }}>
          ← Rankings
        </Link>
        <div className="flex items-baseline gap-3 mt-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
            {team.name}
          </h1>
          {team.needsReview && (
            <span className="rir-badge" style={{ background: '#fff4e0', color: '#8a5a00' }}>
              Needs review
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {team.province ? (
            <Link href={`/provinces/${encodeURIComponent(team.province)}`} className="hover:underline">
              {team.province}
            </Link>
          ) : (
            'No province assigned'
          )}
          {venue && <> · Home ground: {venue.name}</>}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title={config.masterTitle} rating={master} />
        <StatCard title={`${config.seasonTitle} — ${config.currentSeason}`} rating={season} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-navy-900)' }}>
          Recent fixtures
        </h2>
        <div className="rir-table-wrap">
          <table className="rir-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fixture</th>
                <th>Result</th>
                <th>Season</th>
              </tr>
            </thead>
            <tbody>
              {recentMatches.map((m) => {
                const home = teamById.get(m.homeTeamId);
                const away = teamById.get(m.awayTeamId);
                const isHome = m.homeTeamId === team.id;
                const opponent = isHome ? away : home;
                const forPts = isHome ? m.homePoints : m.awayPoints;
                const againstPts = isHome ? m.awayPoints : m.homePoints;
                const result = forPts !== null && againstPts !== null ? (forPts > againstPts ? 'W' : forPts < againstPts ? 'L' : 'D') : '—';
                return (
                  <tr key={m.id}>
                    <td>{new Date(m.date).toLocaleDateString('en-ZA')}</td>
                    <td>
                      {isHome ? 'vs' : '@'}{' '}
                      {opponent ? (
                        <Link href={`/teams/${opponent.id}`} className="hover:underline">
                          {opponent.name}
                        </Link>
                      ) : (
                        'TBC'
                      )}
                      {m.isFestival && (
                        <span className="rir-badge ml-2" style={{ background: '#eef1f5', color: 'var(--color-text-muted)' }}>
                          Festival
                        </span>
                      )}
                    </td>
                    <td>
                      {forPts !== null && againstPts !== null ? (
                        <span className="font-semibold">
                          {result} {forPts}–{againstPts}
                        </span>
                      ) : (
                        m.status
                      )}
                    </td>
                    <td>{m.season}</td>
                  </tr>
                );
              })}
              {recentMatches.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                    No fixtures recorded for this team yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, rating }: { title: string; rating: TeamRating | undefined }) {
  return (
    <div className="rir-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </div>
      {rating ? (
        <>
          <div className="text-3xl font-bold mt-1" style={{ color: 'var(--color-navy-900)' }}>
            {rating.rating.toFixed(2)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {rating.matchesPlayed} played · {rating.wins}W {rating.draws}D {rating.losses}L
          </div>
        </>
      ) : (
        <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          No matches yet on this track.
        </div>
      )}
    </div>
  );
}
