import { notFound } from 'next/navigation';
import VenueForm from '@/components/VenueForm';
import { getVenue } from '@/lib/data/venues';

export const dynamic = 'force-dynamic';

export default async function EditVenuePage(props: PageProps<'/admin/venues/[id]'>) {
  const { id } = await props.params;
  const venue = await getVenue(id);
  if (!venue) notFound();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
        Edit {venue.name}
      </h2>
      <VenueForm venue={venue} />
    </div>
  );
}
