import type { Post } from '../types';

/** Sample news content so the News page isn't empty in preview/demo mode. */
export const DEFAULT_POSTS: Post[] = [
  {
    id: 'paarl-gimnasium-hold-the-summit',
    slug: 'paarl-gimnasium-hold-the-summit',
    title: 'Paarl Gimnasium hold the summit',
    excerpt:
      'Another unbeaten week keeps Paarl Gimnasium clear at the top of the Master Ranking as the season enters its final stretch.',
    author: 'Rugby Ignite',
    date: '2026-08-24',
    status: 'published',
    body: [
      'Paarl Gimnasium remain the team to beat, holding the number-one spot on the Master Ranking for another week.',
      '',
      'The current standings across every fixture ever played:',
      '',
      '[rankings scope="master"]',
    ].join('\n'),
  },
  {
    id: 'how-the-ranking-works',
    slug: 'how-the-ranking-works',
    title: 'How the ranking works',
    excerpt:
      'A quick explainer on the two tracks — the continuous Master Ranking and the season-by-season Season Ranking.',
    author: 'Rugby Ignite',
    date: '2026-08-01',
    status: 'published',
    body: [
      'Rugby Ignite runs **two** ratings from the same results:',
      '',
      '- The **Master Ranking** is one continuous rating across every fixture ever played. It never resets.',
      '- The **Season Ranking** resets each season, seeded from the Master, so every year starts fresh.',
      '',
      'Both are built only from real, recorded results — win percentage and ranking points, nothing else.',
    ].join('\n'),
  },
];
