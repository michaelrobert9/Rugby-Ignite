import { getSportConfig } from '@/lib/data/config';
import { isDemoMode } from '@/lib/data/store';
import { listSports } from '@/lib/matchpulse/source';
import { saveConfigAction } from '@/lib/actions';
import type { RankingConfig } from '@/lib/types';
import type { SportKey } from '@/lib/matchpulse/types';
import MasterFormulaGate from './MasterFormulaGate';

export const dynamic = 'force-dynamic';

export default async function SettingsPage(props: PageProps<'/admin/settings'>) {
  const searchParams = await props.searchParams;
  const sports = await listSports();

  const sportKey = (typeof searchParams.sport === 'string' && sports.some((s) => s.key === searchParams.sport)
    ? searchParams.sport
    : 'rugby') as SportKey;
  const sport = sports.find((s) => s.key === sportKey)!;

  const config = await getSportConfig(sportKey);

  const demo = isDemoMode();

  return (
    <div className="space-y-6">
      {demo && (
        <div className="rir-card p-4 text-sm" style={{ background: '#fdf3e7', borderColor: '#f0d9b5', color: 'var(--color-navy-900)' }}>
          <strong>Preview mode — changes are not saved.</strong> No database is attached, so settings are held in
          memory only and reset when the server restarts. Each sport still has its own settings; until a database
          is attached they all just show the built-in defaults. To save per-sport settings permanently, set
          <code> APP_FIRESTORE_DB</code> to a dedicated database in <code>apphosting.yaml</code> (see DEPLOY.md).
        </div>
      )}
      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          {sport.name} settings saved. Rankings are computed live on every page load, so the new formula applies immediately.
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Ranking settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          The formula behind the School Rugby Rankings. Every setting below drives the live tables.
        </p>
      </div>

      <FormulaExplainer config={config} sportName={sport.name} />

      <form action={saveConfigAction} className="space-y-6">
        <input type="hidden" name="sport" value={sportKey} />

        <div className="rir-card p-5">
          <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Master Ranking</h2>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Continuous World Rugby points exchange across all history — every team starts at the baseline and is
            never reset. A pure exchange: each match only moves points between the two teams, so the pool never
            changes (true for every setting below).
          </p>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Field label="Display title" name="masterTitle" defaultValue={config.masterTitle} />
          </div>
          <MasterFormulaGate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="K-factor (points at stake per match)" name="kMaster" type="number" step="0.1" defaultValue={config.kMaster} />
              <Field label="Safety cap (max change per match)" name="masterSafetyCap" type="number" step="0.1" defaultValue={config.masterSafetyCap} hint="Also hard-capped at 12.00 by the World Rugby formula, whichever is smaller." />
              <Field label="Margin multiplier" name="masterMarginMultiplier" type="number" step="0.1" defaultValue={config.masterMarginMultiplier} hint="Applied when the winning margin is at/above the margin threshold. 1.0 = off." />
              <Field label="Margin threshold (winning margin)" name="masterMarginThreshold" type="number" defaultValue={config.masterMarginThreshold} hint={`In ${sport.scoreUnit}. A win by this much or more earns the margin multiplier.`} />
              <Field label="Upset multiplier" name="masterUpsetMultiplier" type="number" step="0.1" defaultValue={config.masterUpsetMultiplier} hint="Beating a much higher-ranked team. Applied to both sides equally, so the exchange stays balanced. 1.0 = off." />
              <Field label="Upset threshold (leaderboard places)" name="masterUpsetThreshold" type="number" defaultValue={config.masterUpsetThreshold} hint="Rank gap needed for the upset multiplier to apply." />
            </div>
          </MasterFormulaGate>
        </div>

        <Section
          title="Season Ranking"
          description="Snapshots Master at the start of each season, re-seeds every team, then re-rates with its own K-factor. Standard Elo with margin & upset bonuses — a performance ranking for one year."
        >
          <Field label="Display title" name="seasonTitle" defaultValue={config.seasonTitle} />
          <Field label="K-factor (points at stake per match)" name="kSeason" type="number" step="0.1" defaultValue={config.kSeason} />
          <Field label="Seed factor" name="seedFactor" type="number" step="0.01" defaultValue={config.seedFactor} hint="Season start = baseline + seedFactor × (Master − baseline). 0 = everyone starts level; 1 = start exactly on Master." />
          <Field label="Rating divisor" name="ratingDivisor" type="number" step="0.1" defaultValue={config.ratingDivisor} hint="Elo expected-score divisor: expected = 1 / (1 + 10^((opp − you) / divisor))." />
          <Field label="Margin multiplier" name="seasonMarginMultiplier" type="number" step="0.1" defaultValue={config.seasonMarginMultiplier} hint="Applied above the margin threshold. 1.0 = off." />
          <Field label="Upset multiplier" name="seasonUpsetMultiplier" type="number" step="0.1" defaultValue={config.seasonUpsetMultiplier} hint="Boosts the upsetting side only (asymmetric). 1.0 = off." />
          <Field label="Safety cap (max change per match)" name="seasonSafetyCap" type="number" step="0.1" defaultValue={config.seasonSafetyCap} />
        </Section>

        <Section title="Shared inputs" description="Used by the formulas above.">
          <Field label="Baseline rating (every team's starting score)" name="baselineRating" type="number" step="0.1" defaultValue={config.baselineRating} hint="Both tracks start here (50 = a 0–100 scale)." />
          <Field label="Home advantage (rating points)" name="homeAdvantage" type="number" step="0.1" defaultValue={config.homeAdvantage} hint="Added to the home side's rating before comparing. Off for live data until venues are linked." />
          <Field label="Season margin threshold (winning margin)" name="marginThreshold" type="number" defaultValue={config.marginThreshold} hint={`In ${sport.scoreUnit}. Season margin multiplier kicks in above this.`} />
          <Field label="Upset threshold (leaderboard places)" name="upsetThreshold" type="number" defaultValue={config.upsetThreshold} hint="Season upset multiplier needs a rank gap of at least this." />
          <Field label="Current season" name="currentSeason" defaultValue={config.currentSeason} hint="The season year the Season Rankings show (e.g. 2026)." />
        </Section>

        <button type="submit" className="rir-btn rir-btn-primary">
          Save {sport.name} settings
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

function FormulaExplainer({ config, sportName }: { config: RankingConfig; sportName: string }) {
  const masterCap = Math.min(12, config.masterSafetyCap);
  return (
    <div className="rir-card p-5 space-y-5">
      <div>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>How {sportName} ratings are calculated</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          These are the exact formulas that run — driven by the values below. Every finalised result is replayed
          in date order, first match to last. Every team starts at the baseline ({config.baselineRating}).
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy-900)' }}>Master — World Rugby points exchange</h3>
        <ol className="mt-2 space-y-1 text-sm list-decimal pl-5" style={{ color: 'var(--color-text-muted)' }}>
          <li><span className="rir-data">D = your rating − their rating</span> (plus home advantage {config.homeAdvantage} for the home side), clamped to ±10.</li>
          <li><span className="rir-data">win:</span> gain <span className="rir-data">K × (1 − D/10)</span> if you were favourite (D ≥ 0), or <span className="rir-data">K × (1 + |D|/10)</span> if you were the underdog. <span className="rir-data">loss:</span> the mirror, as a loss. <span className="rir-data">draw:</span> <span className="rir-data">−K × (D/10)</span>.</li>
          <li>Big win (margin ≥ {config.masterMarginThreshold}): multiply by <span className="rir-data">{config.masterMarginMultiplier}</span>.</li>
          <li>Upset (beating a team ranked ≥ {config.masterUpsetThreshold} places above): multiply by <span className="rir-data">{config.masterUpsetMultiplier}</span>{config.masterUpsetMultiplier > 1 ? '' : ' (off)'} — applied to both sides equally.</li>
          <li>Cap the change at <span className="rir-data">±{masterCap.toFixed(2)}</span> (min of your cap {config.masterSafetyCap} and the 12.00 hard cap).</li>
          <li>The loser loses exactly what the winner gains → the point pool never changes, whatever the settings.</li>
        </ol>
        <p className="mt-2 text-xs rir-data" style={{ color: 'var(--color-text-muted)' }}>K (kMaster) = {config.kMaster}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy-900)' }}>Season — seeded Elo</h3>
        <ol className="mt-2 space-y-1 text-sm list-decimal pl-5" style={{ color: 'var(--color-text-muted)' }}>
          <li>At the season start each team is re-seeded: <span className="rir-data">{config.baselineRating} + {config.seedFactor} × (Master − {config.baselineRating})</span>.</li>
          <li>Expected result: <span className="rir-data">1 / (1 + 10^((their rating − your rating) / {config.ratingDivisor}))</span> (home advantage {config.homeAdvantage} added to the home rating first).</li>
          <li>Change = <span className="rir-data">K × (actual − expected)</span>, where actual is 1 win / 0.5 draw / 0 loss.</li>
          <li>Margin above {config.marginThreshold} → multiply by <span className="rir-data">{config.seasonMarginMultiplier}</span>. Beating a team ranked ≥ {config.upsetThreshold} places above → the winner&apos;s gain multiplies by <span className="rir-data">{config.seasonUpsetMultiplier}</span> (upset bonus).</li>
          <li>Change capped at <span className="rir-data">±{config.seasonSafetyCap}</span> per side.</li>
        </ol>
        <p className="mt-2 text-xs rir-data" style={{ color: 'var(--color-text-muted)' }}>K (kSeason) = {config.kSeason}</p>
      </div>
    </div>
  );
}
