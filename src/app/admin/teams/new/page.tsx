import TeamForm from '@/components/TeamForm';
import { listVenues } from '@/lib/data/venues';

export const dynamic = 'force-dynamic';

export default async function NewTeamPage() {
  const venues = await listVenues();
  return (
    <div className="space-y-4">
      <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
        New team
      </h2>
      <TeamForm venues={venues} />
    </div>
  );
}
