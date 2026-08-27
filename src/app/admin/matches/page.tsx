import Link from 'next/link';
import { listMatches, listSeasons } from '@/lib/data/matches';
import { listTeams } from '@/lib/data/teams';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 40;

export default async function AdminMatchesPage(props: PageProps<'/admin/matches'>) {
  const searchParams = await props.searchParams;
  const [seasons, teams, allMatches] = await Promise.all([listSeasons(), listTeams(), listMatches()]);
  const seasonParam = typeof searchParams.season === 'string' ? searchParams.season : undefined;
  const season = seasonParam && seasons.includes(seasonParam) ? seasonParam : seasons[seasons.length - 1];
  const page = Math.max(1, Number(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1);
  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';

  const teamById = new Map(teams.map((t) => [t.id, t]));

  let matches = allMatches
    .filter((m) => m.season === season)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (q) {
    matches = matches.filter((m) => {
      const home = teamById.get(m.homeTeamId)?.name.toLowerCase() ?? '';
      const away = teamById.get(m.awayTeamId)?.name.toLowerCase() ?? '';
      return home.includes(q) || away.includes(q);
    });
  }

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageMatches = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          Matches ({matches.length} in {season})
        </h2>
        <Link href="/admin/matches/new" className="rir-btn rir-btn-primary">
          + New match
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {seasons.map((s) => (
          <Link
            key={s}
            href={`/admin/matches?season=${s}`}
            className="rir-badge"
            style={s === season ? { background: 'var(--color-navy-900)', color: '#fff' } : { background: '#eef1f5', color: 'var(--color-text-muted)' }}
          >
            {s}
          </Link>
        ))}
        <form className="ml-auto" action="/admin/matches" method="get">
          <input type="hidden" name="season" value={season} />
          <input className="rir-input" style={{ width: 220 }} type="search" name="q" placeholder="Search by team…" defaultValue={q} />
        </form>
      </div>

      <div className="rir-table-wrap">
        <table className="rir-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Home</th>
              <th>Score</th>
              <th>Away</th>
              <th>Flags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageMatches.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.date).toLocaleDateString('en-ZA')}</td>
                <td>{teamById.get(m.homeTeamId)?.name ?? m.homeTeamId}</td>
                <td className="font-semibold">
                  {m.homePoints !== null && m.awayPoints !== null ? `${m.homePoints} – ${m.awayPoints}` : m.status}
                </td>
                <td>{teamById.get(m.awayTeamId)?.name ?? m.awayTeamId}</td>
                <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {m.isFestival ? 'festival ' : ''}
                  {!m.rankingEligible ? 'not-ranked' : ''}
                </td>
                <td>
                  <Link href={`/admin/matches/${m.id}`} className="text-xs hover:underline" style={{ color: 'var(--color-navy-900)' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/admin/matches?season=${season}&q=${q}&page=${page - 1}`} className="rir-btn rir-btn-secondary">
              ← Newer
            </Link>
          )}
          <span style={{ color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/matches?season=${season}&q=${q}&page=${page + 1}`} className="rir-btn rir-btn-secondary">
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
