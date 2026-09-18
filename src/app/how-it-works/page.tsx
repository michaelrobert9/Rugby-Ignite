import type { Metadata } from 'next';
import { getMethod } from '@/lib/store/methodConfig';
import { getStandings, getTeamHistory } from '@/lib/store/read';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'How a school gets its rating — Method | Rugby Ignite',
  description:
    'The points-exchange method behind the Ignite Rating, adapted for school rugby. Every number on this page is printed from the live configuration, so the published method can never drift from the calculator.',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rir-data" style={{ fontWeight: 600, fontSize: 12, lineHeight: 2.1, color: 'var(--body)' }}>
      {label} · <span style={{ color: 'var(--coal)' }}>{value}</span>
    </div>
  );
}

export default async function HowItWorksPage() {
  const { config, meta } = await getMethod();

  // Worked example: the leader's most recent rated fixture (a real one beats an
  // invented one, and it proves the calculator and the page agree).
  const master = await getStandings('master');
  const leader = master[0];
  const history = leader ? await getTeamHistory('master', leader.teamId) : [];
  const example = history.sort((a, b) => b.matchDate.localeCompare(a.matchDate))[0] ?? null;

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: 'Is the ranking based on win percentage?',
      a: 'No. Win percentage is shown alongside each team, but the order is set by the rating. Two schools with the same win rate can rank very differently depending on who they played.',
    },
    {
      q: 'Why does beating a higher-rated school matter more?',
      a: 'The method rewards the quality of a result, not just the fact of a win. Points move between the two teams, and how many move depends on the gap between them before kick-off.',
    },
    {
      q: 'What is the Ignite Rating out of?',
      a: 'Every school is rated on a 0–100 scale, starting from a baseline of ' + config.baselineRating + '. Whatever one side gains in a match, the other loses.',
    },
    {
      q: 'What is Form Heat?',
      a: 'A 0–100 reading of recent form over a school’s last ' + meta.heat.window + ' rated fixtures — opponent-weighted, so a good run against strong sides reads hottest. It is separate from the rating: a mid-table school can be the hottest side in the country.',
    },
    {
      q: 'Is it official?',
      a: 'No. It is an independent, data-driven record built from real results — not run by any union or governing body. Rugby Ignite is not affiliated with or endorsed by World Rugby.',
    },
  ];

  return (
    <div className="rir-container py-8">
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
        Method v{meta.version} · published {meta.publishedAt} · rendered from the live configuration
      </div>
      <h1 className="text-3xl" style={{ margin: '9px 0 8px', maxWidth: '22ch' }}>How a school gets its rating</h1>
      <p className="text-base" style={{ maxWidth: '60ch', lineHeight: 1.7 }}>
        The points-exchange method used for the international rankings, adapted for school rugby. Rugby Ignite is
        not affiliated with or endorsed by World Rugby.
      </p>

      <div className="rir-card" style={{ background: 'var(--coal)', padding: 22, margin: '22px 0' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--heat-4)' }}>
          Why this page cannot go out of date
        </div>
        <p style={{ margin: '11px 0 0', fontSize: 15.5, lineHeight: 1.7, color: 'var(--on-coal)', maxWidth: '76ch' }}>
          Every number here is printed from the same configuration the calculator reads. Change a setting and this
          page changes with it, in the same deploy. There is no prose describing the method that a human could
          forget to update.
        </p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', alignItems: 'start' }}>
        <div className="flex flex-col" style={{ gap: 20 }}>
          {faqs.map((f) => (
            <div key={f.q}>
              <h2 className="text-lg" style={{ marginBottom: 7 }}>{f.q}</h2>
              <p className="text-sm" style={{ lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col" style={{ gap: 18 }}>
          <div className="rir-card" style={{ padding: 22, borderColor: 'var(--coal)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
              The method, in numbers
            </div>
            <div style={{ marginTop: 12 }}>
              <Row label="BASELINE RATING" value={String(config.baselineRating)} />
              <Row label="K FACTOR (ALL-TIME)" value={`×${config.kMaster}`} />
              <Row label="K FACTOR (SEASON)" value={`×${config.kSeason}`} />
              <Row label="RATING DIVISOR" value={String(config.ratingDivisor)} />
              <Row label="MARGIN THRESHOLD" value={`${config.masterMarginThreshold} pts`} />
              <Row label="MARGIN MULTIPLIER" value={`×${config.masterMarginMultiplier}`} />
              <Row label="SAFETY CAP (ALL-TIME)" value={String(config.masterSafetyCap)} />
              <Row label="SEASON SEED FACTOR" value={String(config.seedFactor)} />
              <Row label="FORM HEAT WINDOW" value={`${meta.heat.window} fixtures`} />
            </div>
          </div>

          {example && leader && (
            <div className="rir-card" style={{ padding: 22, borderColor: 'var(--coal)' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
                Worked example · the most recent rated fixture
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.45, color: 'var(--coal)', margin: '11px 0 13px' }}>
                {leader.name} {example.pointsFor}–{example.pointsAgainst} {example.opponentName}, {example.matchDate}
              </div>
              <div>
                <Row label={`${leader.name.toUpperCase()} IN`} value={example.ratingBefore.toFixed(2)} />
                <Row label={`${example.opponentName.toUpperCase()} IN`} value={example.opponentRatingBefore.toFixed(2)} />
                <Row label="OUTCOME" value={example.outcome.toUpperCase()} />
                <Row label={`${leader.name.toUpperCase()} OUT`} value={`${example.ratingAfter.toFixed(2)} (${example.ratingChange >= 0 ? '▲' : '▼'}${Math.abs(example.ratingChange).toFixed(2)})`} />
              </div>
              <p className="text-sm" style={{ marginTop: 12, lineHeight: 1.65, borderTop: '1px solid var(--rule)', paddingTop: 11 }}>
                Re-picked every build, always the latest fixture — so the calculator and the page always agree.
              </p>
            </div>
          )}

          <div className="rir-card" style={{ padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
              Changelog · written by the deploy
            </div>
            <div style={{ marginTop: 11 }}>
              {meta.changelog.map((c) => (
                <div key={c.version + c.date} className="rir-data" style={{ fontWeight: 600, fontSize: 11, lineHeight: 2, color: 'var(--body)' }}>
                  v{c.version} · {c.date} · {c.note}
                </div>
              ))}
            </div>
          </div>

          <div className="rir-card" style={{ padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
              Custody
            </div>
            <p className="text-sm" style={{ marginTop: 11, lineHeight: 1.7 }}>
              The method and the sentence templates change only with the custodian&apos;s sign-off, and sponsorship
              cannot influence a rating.
            </p>
            <div className="rir-subline" style={{ marginTop: 12, borderTop: '1px solid var(--rule)', paddingTop: 11, lineHeight: 1.9 }}>
              Brand custodian · {meta.brandCustodian}<br />
              Method custodian · {meta.methodCustodian}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
