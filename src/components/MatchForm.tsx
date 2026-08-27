import { deleteMatchAction, saveMatchAction } from '@/lib/actions';
import type { Match, Team, Venue } from '@/lib/types';

function toDateTimeLocal(iso: string): string {
  // yyyy-MM-ddThh:mm, what <input type="datetime-local"> expects.
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

export default function MatchForm({ match, teams, venues }: { match?: Match; teams: Team[]; venues: Venue[] }) {
  const sortedTeams = teams.slice().sort((a, b) => a.name.localeCompare(b.name));
  const sortedVenues = venues.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-2xl space-y-4">
      <form action={saveMatchAction} className="rir-card p-5 space-y-4">
        <input type="hidden" name="id" defaultValue={match?.id ?? ''} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect label="Home team" name="homeTeamId" teams={sortedTeams} defaultValue={match?.homeTeamId} />
          <TeamSelect label="Away team" name="awayTeamId" teams={sortedTeams} defaultValue={match?.awayTeamId} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Home points
            </label>
            <input className="rir-input" type="number" name="homePoints" defaultValue={match?.homePoints ?? ''} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Away points
            </label>
            <input className="rir-input" type="number" name="awayPoints" defaultValue={match?.awayPoints ?? ''} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Kickoff
            </label>
            <input className="rir-input" type="datetime-local" name="date" defaultValue={match ? toDateTimeLocal(match.date) : ''} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Season
            </label>
            <input className="rir-input" name="season" defaultValue={match?.season ?? ''} required placeholder="2026" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Venue
          </label>
          <select className="rir-input" name="venueId" defaultValue={match?.venueId ?? ''}>
            <option value="">— none —</option>
            {sortedVenues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Status
          </label>
          <select className="rir-input" name="status" defaultValue={match?.status ?? 'played'}>
            <option value="scheduled">Scheduled</option>
            <option value="played">Played</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFestival" defaultChecked={match?.isFestival ?? false} />
            Festival fixture (disables home advantage even at the home team&apos;s own venue)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="rankingEligible" defaultChecked={match?.rankingEligible ?? true} />
            Counts toward the ranking
          </label>
        </div>

        <button type="submit" className="rir-btn rir-btn-primary">
          Save match
        </button>
      </form>
      {match && (
        <form action={deleteMatchAction} className="rir-card p-5">
          <input type="hidden" name="id" defaultValue={match.id} />
          <button type="submit" className="rir-btn rir-btn-danger">
            Delete match
          </button>
        </form>
      )}
    </div>
  );
}

function TeamSelect({ label, name, teams, defaultValue }: { label: string; name: string; teams: Team[]; defaultValue?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <select className="rir-input" name={name} defaultValue={defaultValue ?? ''} required>
        <option value="" disabled>
          Select a team…
        </option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
