import type { Post } from '../types';

/** Seed news content. Bodies are evergreen and link to the live rankings on the
 *  home page, so they stay accurate as new verified results are added. */
export const DEFAULT_POSTS: Post[] = [
  {
    id: 'the-title-race-takes-shape',
    slug: 'the-title-race-takes-shape',
    title: 'The title race takes shape',
    excerpt:
      'As more verified results are logged, the Master Ranking is starting to separate the genuine contenders from the pack.',
    author: 'Rugby Ignite',
    date: '2026-09-02',
    status: 'published',
    body: [
      'Every verified result nudges the Master Ranking — one continuous rating across every fixture ever played.',
      '',
      'Because it is a points-exchange system, the only way up the table is to beat teams rated near or above you: points move from the loser to the winner, and a big win or a genuine upset moves a few more.',
      '',
      'See exactly where every school sits right now on the [live rankings](/).',
    ].join('\n'),
  },
  {
    id: 'how-the-ranking-works',
    slug: 'how-the-ranking-works',
    title: 'How the ranking works',
    excerpt:
      'A quick explainer on the two tracks — the continuous Master Ranking and the season-by-season Season Ranking.',
    author: 'Rugby Ignite',
    date: '2026-09-02',
    status: 'published',
    body: [
      'Rugby Ignite runs **two** ratings from the same verified results, both out of 100 with every team starting on 50:',
      '',
      '- The **Master Ranking** is one continuous points exchange across every fixture ever played. It never resets, and no points enter or leave the system — each match only moves points between the two teams.',
      '- The **Season Ranking** takes a snapshot of the Master at the start of each season, re-seeds every team, then re-rates the year with its own settings — a cleaner read of current-season form.',
      '',
      'Both show win percentage alongside the rating, and both are built only from real, recorded results.',
      '',
      'See them live on the [rankings page](/).',
    ].join('\n'),
  },
];
