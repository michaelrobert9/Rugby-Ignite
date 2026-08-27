import { getConfig } from '@/lib/data/config';
import { listSeasons } from '@/lib/data/matches';
import { saveConfigAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage(props: PageProps<'/admin/settings'>) {
  const searchParams = await props.searchParams;
  const [config, seasons] = await Promise.all([getConfig(), listSeasons()]);

  return (
    <div className="space-y-6">
      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Settings saved. Rebuild rankings from the Dashboard for changes to take effect.
        </div>
      )}
      <form action={saveConfigAction} className="space-y-6">
        <Section title="Master Ranking" description="Continuous World Rugby-style exchange across all history. Never resets.">
          <Field label="Display title" name="masterTitle" defaultValue={config.masterTitle} />
          <Field label="K-factor" name="kMaster" type="number" step="0.1" defaultValue={config.kMaster} />
          <Field label="Safety cap (max change per match)" name="masterSafetyCap" type="number" step="0.1" defaultValue={config.masterSafetyCap} hint="Hard-capped at 12.00 by the World Rugby formula regardless of this value." />
        </Section>

        <Section title="Season Ranking" description="Resets each season, seeded from Master.">
          <Field label="Display title" name="seasonTitle" defaultValue={config.seasonTitle} />
          <Field label="K-factor" name="kSeason" type="number" step="0.1" defaultValue={config.kSeason} />
          <Field label="Seed factor" name="seedFactor" type="number" step="0.01" defaultValue={config.seedFactor} hint="SeasonStart = baseline + seedFactor × (Master − baseline)" />
          <Field label="Margin multiplier" name="seasonMarginMultiplier" type="number" step="0.1" defaultValue={config.seasonMarginMultiplier} hint="1.0 = off" />
          <Field label="Upset multiplier" name="seasonUpsetMultiplier" type="number" step="0.1" defaultValue={config.seasonUpsetMultiplier} hint="1.0 = off" />
          <Field label="Safety cap (max change per match)" name="seasonSafetyCap" type="number" step="0.1" defaultValue={config.seasonSafetyCap} />
        </Section>

        <Section title="Shared match formula" description="Applies to both tracks.">
          <Field label="Margin threshold (points)" name="marginThreshold" type="number" defaultValue={config.marginThreshold} />
          <Field label="Upset threshold (leaderboard places)" name="upsetThreshold" type="number" defaultValue={config.upsetThreshold} />
          <Field label="Home advantage (rating points)" name="homeAdvantage" type="number" step="0.1" defaultValue={config.homeAdvantage} />
          <Field label="Rating divisor" name="ratingDivisor" type="number" step="0.1" defaultValue={config.ratingDivisor} />
          <Field label="Baseline rating" name="baselineRating" type="number" step="0.1" defaultValue={config.baselineRating} />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Current season
            </label>
            <select name="currentSeason" defaultValue={config.currentSeason} className="rir-input">
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </Section>

        <button type="submit" className="rir-btn rir-btn-primary">
          Save settings
        </button>
      </form>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rir-card p-5">
      <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
        {title}
      </h2>
      <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {description}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  step,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <input className="rir-input" type={type} step={step} name={name} defaultValue={defaultValue} />
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
