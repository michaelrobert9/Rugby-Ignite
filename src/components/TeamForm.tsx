import { deleteTeamAction, saveTeamAction } from '@/lib/actions';
import { PROVINCES, type Team, type Venue } from '@/lib/types';

export default function TeamForm({ team, venues }: { team?: Team; venues: Venue[] }) {
  const sortedVenues = venues.slice().sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="max-w-xl space-y-4">
    <form action={saveTeamAction} className="rir-card p-5 space-y-4">
      <input type="hidden" name="id" defaultValue={team?.id ?? ''} />
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Team name
        </label>
        <input className="rir-input" name="name" required defaultValue={team?.name ?? ''} />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Province
        </label>
        <select className="rir-input" name="province" defaultValue={team?.province ?? ''}>
          <option value="">— none —</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          One of a fixed set of 5 curated regions — smaller provinces are folded into a
          neighbouring one by design, not derived automatically.
        </p>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Home venue
        </label>
        <select className="rir-input" name="homeVenueId" defaultValue={team?.homeVenueId ?? ''}>
          <option value="">— none —</option>
          {sortedVenues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Used for home advantage — matched by reference, not by name, so naming differences
          between the team and its venue (e.g. Google Maps naming) don&apos;t matter.
        </p>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Logo URL (optional)
        </label>
        <input className="rir-input" name="logoUrl" defaultValue={team?.logoUrl ?? ''} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="needsReview" defaultChecked={team?.needsReview ?? false} />
        Needs review (shows on the admin dashboard)
      </label>
      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className="rir-btn rir-btn-primary">
          Save team
        </button>
      </div>
    </form>
      {team && (
        <form action={deleteTeamAction} className="rir-card p-5">
          <input type="hidden" name="id" defaultValue={team.id} />
          <button type="submit" className="rir-btn rir-btn-danger">
            Delete team
          </button>
        </form>
      )}
    </div>
  );
}
