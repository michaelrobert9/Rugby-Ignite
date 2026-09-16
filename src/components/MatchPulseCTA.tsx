// "Where the data comes from" callout. Rugby Ignite's rankings are built from
// verified results captured on Match Pulse, so this points people to the live
// scores, upcoming matches and results on Match Pulse Rugby. Follow links (no
// nofollow) so the reference passes authority to the Match Pulse network.

import { MATCHPULSE } from '@/lib/matchpulseLinks';

export default function MatchPulseCTA() {
  return (
    <section
      className="rir-card p-5"
      aria-label="Matches and results on Match Pulse"
      style={{ background: 'var(--night)', borderColor: 'var(--night)' }}
    >
      <h2 className="text-lg font-bold" style={{ color: 'var(--chalk)' }}>
        Fixtures, live scores &amp; results
      </h2>
      <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '52rem' }}>
        Rugby Ignite&apos;s rankings are built from verified 1st XV results captured on{' '}
        <a href={MATCHPULSE.main} target="_blank" rel="noopener" style={{ color: 'var(--chalk)', textDecoration: 'underline' }}>
          Match Pulse
        </a>
        , the live scoring platform for South African school sport. Upcoming matches, live scores and full
        results are there.
      </p>
      <div className="flex flex-wrap gap-3 mt-4">
        <a className="rir-btn rir-btn-primary" href={MATCHPULSE.rugby} target="_blank" rel="noopener">
          Upcoming matches &amp; results
        </a>
        <a
          className="rir-btn"
          href={MATCHPULSE.rugbyCompetitions}
          target="_blank"
          rel="noopener"
          style={{ background: 'transparent', color: 'var(--chalk)', borderColor: 'rgba(244,239,230,0.35)' }}
        >
          Browse competitions
        </a>
      </div>
    </section>
  );
}
