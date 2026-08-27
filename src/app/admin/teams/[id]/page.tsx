import { notFound } from 'next/navigation';
import TeamForm from '@/components/TeamForm';
import { getTeam } from '@/lib/data/teams';
import { listVenues } from '@/lib/data/venues';

export const dynamic = 'force-dynamic';

export default async function EditTeamPage(props: PageProps<'/admin/teams/[id]'>) {
  const { id } = await props.params;
  const [team, venues] = await Promise.all([getTeam(id), listVenues()]);
  if (!team) notFound();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
        Edit {team.name}
      </h2>
      <TeamForm team={team} venues={venues} />
    </div>
  );
}
