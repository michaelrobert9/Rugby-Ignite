import { deleteVenueAction, saveVenueAction } from '@/lib/actions';
import type { Venue } from '@/lib/types';

export default function VenueForm({ venue }: { venue?: Venue }) {
  return (
    <div className="max-w-xl space-y-4">
      <form action={saveVenueAction} className="rir-card p-5 space-y-4">
        <input type="hidden" name="id" defaultValue={venue?.id ?? ''} />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Venue name
          </label>
          <input className="rir-input" name="name" required defaultValue={venue?.name ?? ''} />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Recorded to match Google Maps exactly, for location data — not necessarily the same
            wording as the home team&apos;s name.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isNeutral" defaultChecked={venue?.isNeutral ?? false} />
          Always neutral (never grants home advantage)
        </label>
        <button type="submit" className="rir-btn rir-btn-primary">
          Save venue
        </button>
      </form>
      {venue && (
        <form action={deleteVenueAction} className="rir-card p-5">
          <input type="hidden" name="id" defaultValue={venue.id} />
          <button type="submit" className="rir-btn rir-btn-danger">
            Delete venue
          </button>
        </form>
      )}
    </div>
  );
}
