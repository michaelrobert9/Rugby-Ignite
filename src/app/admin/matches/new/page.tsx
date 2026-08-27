import MatchForm from '@/components/MatchForm';
import { listTeams } from '@/lib/data/teams';
import { listVenues } from '@/lib/data/venues';

export const dynamic = 'force-dynamic';

export default async function NewMatchPage() {
  const [teams, venues] = await Promise.all([listTeams(), listVenues()]);
  return (
    <div className="space-y-4">
      <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
        New match
      </h2>
      <MatchForm teams={teams} venues={venues} />
    </div>
  );
}
