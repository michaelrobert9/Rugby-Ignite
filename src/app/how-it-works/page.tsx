import type { Metadata } from 'next';
import { getMethod } from '@/lib/store/methodConfig';
import { getStandings, getTeamHistory } from '@/lib/store/read';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'How a school gets its rating — Method | Rugby Ignite',
  description:
    'The points-exchange method behind the Ignite Rating, explained in plain terms — baseline rating, K factor, rating divisor, margin and more — adapted for South African school rugby.',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rir-data" style={{ fontWeight: 600, fontSize: 12, lineHeight: 2.1, color: 'var(--body)' }}>
      {label} · <span style={{ color: 'var(--coal)' }}>{value}</span>
    </div>
  );
}

// Plain-English definitions of the method's terms — deliberately NO configured
// values (owner decision: explain the ideas, don't publish the numbers).
const TERMS: Array<{ term: string; body: string }> = [
  {
    term: 'Baseline rating',
    body: 'The score every school starts from before any results are counted — a common starting line so ratings are comparable from day one.',
  },
  {
    term: 'K factor',
    body: 'How much a single result can move a rating. A bigger K makes ratings react faster to recent matches; a smaller one keeps them steady. The all-time rating moves more slowly than a single season, which is livelier.',
  },
  {
    term: 'Rating divisor',
    body: 'Sets how much the gap between two teams matters before kick-off. It turns the difference in ratings into an expected result, so beating a stronger side is worth more than beating a weaker one.',
  },
  {
    term: 'Margin',
    body: 'A comfortable winning margin can earn a little extra, but only past a sensible threshold and with the bonus capped — so a record scoreline nudges the rating without distorting the table.',
  },
  {
    term: 'Upset bonus',
    body: 'Beating a much higher-rated school is rewarded above an expected win, because the result tells you more about both teams.',
  },
  {
    term: 'Safety cap',
    body: 'A limit on how far one match can move a rating, so no single result — however unusual — overwhelms a whole season of form.',
  },
  {
    term: 'Season seed',
    body: 'At the start of each season every school is seeded from its all-time strength, so a new year does not begin from a blank slate.',
  },
];

export default async function HowItWorksPage() {
  const { meta } = await getMethod();

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
      q: 'What does the rating actually measure?',
      a: 'A school’s strength relative to everyone else. Every school shares one starting baseline, and whatever one side gains in a match the other loses — so the ratings stay anchored to each other over time. It is not a mark out of 100.',
    },
    {
      q: 'Is it official?',
      a: 'No. It is an independent, data-driven record built from real results — not run by any union or governing body. Rugby Ignite is not affiliated with or endorsed by World Rugby.',
    },
  ];

  return (
    <div className="rir-container py-8">
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--body-2)' }}>
        Method v{meta.version} · published {meta.publishedAt}
      </div>
      <h1 className="text-3xl" style={{ margin: '9px 0 8px', maxWidth: '22ch' }}>How a school gets its rating</h1>
      <p className="text-base" style={{ maxWidth: '60ch', lineHeight: 1.7 }}>
        The points-exchange method used for the international rankings, adapted for school rugby. Rugby Ignite is
        not affiliated with or endorsed by World Rugby.
      </p>

      <div className="rir-card" style={{ background: 'var(--navy)', padding: 22, margin: '22px 0' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ember)' }}>
          One method, applied to every result
        </div>
        <p style={{ margin: '11px 0 0', fontSize: 15.5, lineHeight: 1.7, color: 'var(--on-coal)', maxWidth: '76ch' }}>
          Every school is measured the same way, from the same starting point. The worked example below is
          recomputed on every deploy straight from the live calculator, so what you read here always matches the
          ranking you see on the site.
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
              The method, in plain terms
            </div>
            <div className="flex flex-col" style={{ marginTop: 14, gap: 14 }}>
              {TERMS.map((t) => (
                <div key={t.term}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, color: 'var(--coal)' }}>{t.term}</div>
                  <p className="text-sm" style={{ marginTop: 3, lineHeight: 1.6 }}>{t.body}</p>
                </div>
              ))}
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
        </div>
      </div>
    </div>
  );
}
