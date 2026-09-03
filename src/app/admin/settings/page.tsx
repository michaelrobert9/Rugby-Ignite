import { getConfig } from '@/lib/data/config';
import { listSeasons } from '@/lib/data/matches';
import { saveConfigAction } from '@/lib/actions';
import type { RankingConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage(props: PageProps<'/admin/settings'>) {
  const searchParams = await props.searchParams;
  const [config, seasons] = await Promise.all([getConfig(), listSeasons()]);

  return (
    <div className="space-y-6">
      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Settings saved. Rankings are computed live on every page load, so the new formula applies immediately.
        </div>
      )}

      <FormulaExplainer config={config} />

      <form action={saveConfigAction} className="space-y-6">
        <Section
          title="Master Ranking"
          description="Continuous World Rugby points exchange across all history — every team starts at the baseline and is never reset. Pure exchange: each match only moves points between the two teams."
        >
          <Field label="Display title" name="masterTitle" defaultValue={config.masterTitle} />
          <Field label="K-factor (points at stake per match)" name="kMaster" type="number" step="0.1" defaultValue={config.kMaster} />
          <Field label="Safety cap (max change per match)" name="masterSafetyCap" type="number" step="0.1" defaultValue={config.masterSafetyCap} hint="Also hard-capped at 12.00 by the World Rugby formula, whichever is smaller. A winning margin ≥ 16 multiplies the exchange by 1.5." />
        </Section>

        <Section
          title="Season Ranking"
          description="Snapshots Master at the start of each season, re-seeds every team, then re-rates with its own K-factor. Standard Elo with margin & upset bonuses — a performance ranking for one year."
        >
          <Field label="Display title" name="seasonTitle" defaultValue={config.seasonTitle} />
          <Field label="K-factor (points at stake per match)" name="kSeason" type="number" step="0.1" defaultValue={config.kSeason} />
          <Field label="Seed factor" name="seedFactor" type="number" step="0.01" defaultValue={config.seedFactor} hint="Season start = baseline + seedFactor × (Master − baseline). 0 = everyone starts level at the baseline; 1 = start exactly on Master." />
          <Field label="Rating divisor" name="ratingDivisor" type="number" step="0.1" defaultValue={config.ratingDivisor} hint="Elo expected-score divisor: expected = 1 / (1 + 10^((opp − you) / divisor))." />
          <Field label="Margin multiplier" name="seasonMarginMultiplier" type="number" step="0.1" defaultValue={config.seasonMarginMultiplier} hint="Applied when the winning margin is above the margin threshold. 1.0 = off." />
          <Field label="Upset multiplier" name="seasonUpsetMultiplier" type="number" step="0.1" defaultValue={config.seasonUpsetMultiplier} hint="Applied to the upsetting side when it beats a team ranked at least the upset threshold above it. 1.0 = off." />
          <Field label="Safety cap (max change per match)" name="seasonSafetyCap" type="number" step="0.1" defaultValue={config.seasonSafetyCap} />
        </Section>

        <Section title="Shared inputs" description="Used by the formulas above.">
          <Field label="Baseline rating (every team's starting score)" name="baselineRating" type="number" step="0.1" defaultValue={config.baselineRating} hint="Both tracks start here (50 = a 0–100 scale)." />
          <Field label="Home advantage (rating points)" name="homeAdvantage" type="number" step="0.1" defaultValue={config.homeAdvantage} hint="Added to the home side's rating before comparing. Off for live data until venues are linked." />
          <Field label="Margin threshold (winning margin)" name="marginThreshold" type="number" defaultValue={config.marginThreshold} hint="Season margin multiplier kicks in above this." />
          <Field label="Upset threshold (leaderboard places)" name="upsetThreshold" type="number" defaultValue={config.upsetThreshold} hint="Season upset multiplier needs a rank gap of at least this." />
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

function FormulaExplainer({ config }: { config: RankingConfig }) {
  const masterCap = Math.min(12, config.masterSafetyCap);
  return (
    <div className="rir-card p-5 space-y-5">
      <div>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>How the rating is calculated</h2>
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
          <li>Big win (margin ≥ 16): multiply by <span className="rir-data">1.5</span>.</li>
          <li>Cap the change at <span className="rir-data">±{masterCap.toFixed(2)}</span> (min of your cap {config.masterSafetyCap} and the 12.00 hard cap).</li>
          <li>The loser loses exactly what the winner gains → the point pool never changes.</li>
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
