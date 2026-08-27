import Link from 'next/link';
import { listMatches, listSeasons } from '@/lib/data/matches';
import { listTeams } from '@/lib/data/teams';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function ResultsPage(props: PageProps<'/results'>) {
  const searchParams = await props.searchParams;
  const [seasons, teams, matches] = await Promise.all([listSeasons(), listTeams(), listMatches()]);
  const seasonParam = typeof searchParams.season === 'string' ? searchParams.season : undefined;
  const season = seasonParam && seasons.includes(seasonParam) ? seasonParam : seasons[seasons.length - 1];
  const page = Math.max(1, Number(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1);

  const teamById = new Map(teams.map((t) => [t.id, t]));

  const all = matches
    .filter((m) => m.season === season)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const pageMatches = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="rir-container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
          Results
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {all.length} fixtures in {season}.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {seasons.map((s) => (
          <Link
            key={s}
            href={`/results?season=${s}`}
            className="rir-badge"
            style={s === season ? { background: 'var(--color-navy-900)', color: '#fff' } : { background: '#eef1f5', color: 'var(--color-text-muted)' }}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="rir-table-wrap">
        <table className="rir-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Home</th>
              <th>Score</th>
              <th>Away</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageMatches.map((m) => {
              const home = teamById.get(m.homeTeamId);
              const away = teamById.get(m.awayTeamId);
              return (
                <tr key={m.id}>
                  <td>{new Date(m.date).toLocaleDateString('en-ZA')}</td>
                  <td>
                    {home ? <Link href={`/teams/${home.id}`} className="hover:underline">{home.name}</Link> : '—'}
                  </td>
                  <td className="font-semibold">
                    {m.homePoints !== null && m.awayPoints !== null ? `${m.homePoints} – ${m.awayPoints}` : '—'}
                  </td>
                  <td>
                    {away ? <Link href={`/teams/${away.id}`} className="hover:underline">{away.name}</Link> : '—'}
                  </td>
                  <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {m.status}
                    {m.isFestival ? ' · festival' : ''}
                    {!m.rankingEligible ? ' · not ranked' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/results?season=${season}&page=${page - 1}`} className="rir-btn rir-btn-secondary">
              ← Newer
            </Link>
          )}
          <span style={{ color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/results?season=${season}&page=${page + 1}`} className="rir-btn rir-btn-secondary">
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
