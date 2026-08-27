import { notFound } from 'next/navigation';
import MatchForm from '@/components/MatchForm';
import { getMatch } from '@/lib/data/matches';
import { listTeams } from '@/lib/data/teams';
import { listVenues } from '@/lib/data/venues';

export const dynamic = 'force-dynamic';

export default async function EditMatchPage(props: PageProps<'/admin/matches/[id]'>) {
  const { id } = await props.params;
  const [match, teams, venues] = await Promise.all([getMatch(id), listTeams(), listVenues()]);
  if (!match) notFound();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
        Edit match
      </h2>
      <MatchForm match={match} teams={teams} venues={venues} />
    </div>
  );
}
