import VenueForm from '@/components/VenueForm';

export const dynamic = 'force-dynamic';

export default function NewVenuePage() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
        New venue
      </h2>
      <VenueForm />
    </div>
  );
}
