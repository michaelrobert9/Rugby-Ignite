// The "This Week" hero (Site Concept screen 1). A coal band carrying the
// generated lead story — eyebrow, headline and standfirst come from the
// lead-story ladder, so nobody chooses the story: the first rule that fires
// writes it. Two calls to action sit beneath. The rule id is never shown.

import Link from 'next/link';
import { getLeadStory } from '@/lib/generate/leadStory';

export default async function ThisWeekHero() {
  const story = await getLeadStory();

  return (
    <div style={{ background: 'var(--coal)' }}>
      <div className="rir-container" style={{ paddingTop: 'clamp(26px,4.4vw,46px)', paddingBottom: 'clamp(26px,4.4vw,46px)' }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--on-coal-label)',
          }}
        >
          {story.eyebrow}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 5vw, 56px)', lineHeight: 1.02,
            letterSpacing: '-0.035em', color: 'var(--paper)', margin: '14px 0 0', maxWidth: '21ch',
          }}
        >
          {story.headline}
        </h1>
        <p style={{ margin: '18px 0 0', maxWidth: '56ch', fontSize: 17, lineHeight: 1.6, color: 'var(--on-coal)' }}>
          {story.standfirst}
        </p>
        <div className="flex flex-wrap" style={{ gap: 12, marginTop: 24 }}>
          <Link
            href="/ranking"
            style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em',
              textTransform: 'uppercase', background: 'var(--paper)', color: 'var(--coal)', padding: '13px 20px',
            }}
          >
            The full ranking
          </Link>
          <Link
            href="/how-it-works"
            style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em',
              textTransform: 'uppercase', background: 'transparent', color: 'var(--paper)', padding: '13px 20px',
              border: '1px solid #6b615a',
            }}
          >
            How the rating works
          </Link>
        </div>
      </div>
    </div>
  );
}
