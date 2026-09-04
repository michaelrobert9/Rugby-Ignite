import type { Page } from '../types';

// The home page and the methodology page are editable in Admin → Pages. The
// live ranking tables are inserted with shortcodes:
//   [rankings track="season" limit="20"]   – live School Rugby Rankings (Elo)
//   [rankings track="master" limit="26"]    – All-Time School Rugby Ratings
//   [last_updated]                          – "Last updated: …" line

const HOME: Page = {
  id: 'home',
  slug: '/',
  navLabel: 'Home',
  navOrder: 0,
  showInNav: true,
  title: 'South African School Rugby Rankings',
  metaTitle: 'School Rugby Rankings 2026 | South African 1st XV Rankings — Rugby Ignite',
  metaDescription:
    'View the latest South African school rugby rankings for the 2026 season — current 1st XV form, ranking points, movement and recent results, plus the All-Time School Rugby Ratings.',
  rankingScope: 'master',
  // The Season / All-Time headings, intros and tables are rendered by the tabbed
  // component (their copy lives in Settings). This body is the explainer shown
  // beneath the tabs, and is fully editable here.
  body: [
    '### About the Rugby Ignite School Ranking System',
    '',
    'Rugby Ignite uses a points-based ranking system adapted from the World Rugby ranking model for South African school rugby.',
    '',
    'The rankings are not based only on win percentage. Every result matters, but the strength of the opposition determines how much a team can gain or lose. Beating a higher-rated school can move a team up quickly, while losing to a lower-rated school can cause a bigger drop.',
    '',
    'The Season Rankings focus on current form this season, while the All-Time School Rugby Ratings show longer-term strength across seasons.',
    '',
    '[Learn more about how the Rugby Ignite school rugby rankings work](/school-rugby-rankings-methodology)',
  ].join('\n'),
};

const METHODOLOGY: Page = {
  id: 'school-rugby-rankings-methodology',
  slug: '/school-rugby-rankings-methodology',
  navLabel: 'How the Rankings Work',
  navOrder: 1,
  showInNav: true,
  title: 'How the Rugby Ignite School Rugby Rankings Work',
  metaTitle: 'How the School Rugby Rankings Work | Methodology — Rugby Ignite',
  metaDescription:
    'The methodology behind the Rugby Ignite school rugby rankings: a points-based system adapted from World Rugby, why opponent strength matters, and the two ranking tables.',
  rankingScope: 'master',
  body: [
    'Rugby Ignite ranks South African school 1st XV teams with a points-based system adapted from the World Rugby ranking model. Here is exactly how it works.',
    '',
    '## The rankings are not based only on win percentage',
    '',
    'Every result matters, but **who** you beat matters just as much as **whether** you win. Each match moves rating points between the two teams — the winner takes points from the loser — and how many points move depends on the gap between the two teams before kick-off.',
    '',
    '### Opponent strength matters',
    '',
    'Beating a higher-rated school earns more points than beating a lower-rated one. Lose to a school rated well below you and you give up more than you would against a top side.',
    '',
    '### Every result affects both teams',
    '',
    'It is a pure exchange: whatever the winner gains, the loser drops. No points are created or destroyed, so the table always balances.',
    '',
    '### Why margin can matter',
    '',
    'A comprehensive win can carry a small bonus over a narrow one, so dominant performances are rewarded — but the result itself is always what counts most.',
    '',
    '## Why there are two ranking tables',
    '',
    'Rugby Ignite publishes two views of the same results, both out of 100, with every team starting on 50:',
    '',
    '- **2026 Season Rankings** — current-season form. At the start of each season every team is re-seeded from its all-time rating, so the season table is a clean read of how schools are performing right now.',
    '- **All-Time School Rugby Ratings** — one continuous rating across every season on record. It never resets, so it rewards consistent, long-term strength rather than a single hot run.',
    '',
    '## When are the rankings updated?',
    '',
    'The tables are live: they recalculate as soon as a verified result is added, and the “Last updated” time on the home page shows when the most recent result came in. Weekly movement (points and positions gained or lost) is measured against a snapshot taken every Thursday at 23:59 (SA time).',
    '',
    '## How results are recorded',
    '',
    'Results, teams and match data are captured and verified on **Match Pulse**, the live scoring platform that powers South African school sport. Rugby Ignite reads those verified 1st XV results and turns them into the rankings you see here. To add or correct a result, it is done on Match Pulse — Rugby Ignite itself does not host match schedules, player profiles or venue data.',
    '',
    '## Are the rankings official?',
    '',
    'The rankings are an independent, data-driven record built from real results. They are not run by any union or governing body — they simply reflect what has happened on the field.',
    '',
    '## FAQ: School Rugby Rankings',
    '',
    '### How are the Rugby Ignite school rugby rankings calculated?',
    'With a points-exchange system adapted from World Rugby. After each match, rating points move from the loser to the winner; the size of the move depends on the gap in rating between the two teams and the margin of the result.',
    '',
    '### Are the rankings based on win percentage?',
    'Win percentage is shown alongside each team, but the ranking order is set by the rating, not by win percentage alone. Two teams with the same win rate can be ranked very differently depending on the strength of the schools they played. (The separate provincial tables *are* win-percentage only — see below.)',
    '',
    '### Why does beating a higher-ranked school matter more?',
    'Because the system rewards the quality of a result, not just the fact of a win. Taking down a top-rated side is worth more points than beating a school near the bottom of the table.',
    '',
    '### Why are there 2026 Season Rankings and All-Time School Rugby Ratings?',
    'The Season Rankings show current form for the year; the All-Time Ratings show long-term strength across every season on record. A school can top one and not the other.',
    '',
    '### How often are the rankings updated?',
    'Continuously — the tables recompute the moment a new verified result is added on Match Pulse.',
    '',
    '### Can I submit a missing result?',
    'Results are added and verified on Match Pulse. Once a result is captured there, it flows through to the Rugby Ignite rankings automatically.',
    '',
    '### What about provincial tables?',
    'Each province has its own table based purely on **win percentage**, counting only matches played between two schools from that same province. Those tables do not use the ratings system — they are a fair, like-for-like view of regional form.',
  ].join('\n'),
};

const NOTE = [
  'Please note that the standings on this page are calculated **exclusively from matches played between schools within this province**. This "local-only" win percentage gives a fair, like-for-like comparison of regional form. Inter-provincial matches are excluded here but are fully reflected in the [National School Rugby Rankings](/) on our homepage.',
].join('\n');

function provincePage(id: string, key: string, name: string, order: number, intro: string): Page {
  return {
    id,
    slug: `/${id}`,
    navLabel: name,
    navOrder: order,
    showInNav: true,
    title: `${name} School Rugby Rankings`,
    metaTitle: `${name} School Rugby Rankings ${new Date().getFullYear()} | Provincial Win % — Rugby Ignite`,
    metaDescription: `${name} school rugby rankings by win percentage — this season and all-time, counting only matches between two ${name} schools.`,
    rankingScope: name,
    body: [
      intro,
      '',
      `## ${name} School Rugby Rankings This Year`,
      '',
      `[province_rankings province="${key}" track="season"]`,
      '',
      `## Overall ${name} Standings (All-Time)`,
      '',
      `[province_rankings province="${key}" track="all"]`,
      '',
      NOTE,
    ].join('\n'),
  };
}

const PROVINCE_PAGES: Page[] = [
  provincePage(
    'gauteng-school-rugby-ranking', 'gauteng', 'Gauteng', 2,
    "Gauteng is the most competitive school rugby market in the country, where Pretoria's Noordvaal giants and Johannesburg's traditional schools collide week after week. Follow Affies (Afrikaanse Hoër Seunskool), Garsfontein, Monument, KES, Jeppe and Pretoria Boys' High as they fight through one of the toughest schedules in South African schoolboy rugby. Results recorded here drive our Gauteng rankings, showing how each Noordvaal Cup result and city derby reorders a relentlessly deep field.",
  ),
  provincePage(
    'western-cape-school-rugby-rankings', 'western-cape', 'Western Cape', 3,
    "Western Cape school rugby carries some of the oldest traditions in the country, from the historic Cape Town schools to the farming powerhouses of the Boland. Track Paul Roos Gymnasium, Paarl Gimnasium, Paarl Boys' High, Rondebosch, Bishops, SACS and Boland Landbou as they contest fierce local rivalries and provincial bragging rights. Each result recorded here shapes our Western Cape rankings, so you can see how every Cape derby and Boland battle reshuffles the order.",
  ),
  provincePage(
    'kzn-school-rugby-ranking', 'kzn', 'KZN', 4,
    "KwaZulu-Natal is one of South Africa's deepest school rugby provinces, where Durban's coastal heavyweights meet the traditional powers of the Midlands. Follow the form of schools like Glenwood, Durban High School, Maritzburg College, Kearsney and Hilton as they battle through derby season. Every KZN result here feeds directly into our provincial rankings, so whether it's a Durban inter-schools clash or a Midlands rivalry decided in the last play, you'll see exactly how it moves the leaderboard.",
  ),
  provincePage(
    'eastern-cape-school-rugby-ranking', 'eastern-cape', 'Eastern Cape', 5,
    "The Eastern Cape is the heartland of Border rugby and a region that punches far above its weight on the national stage. Follow Grey High School, Selborne College, Dale College, Queen's College and Kingswood as they bring their famously physical, uncompromising style to every match. Results on this page feed our Eastern Cape rankings, capturing the giant-killing upsets and proud rivalries that define schoolboy rugby in this part of the country.",
  ),
  provincePage(
    'free-state-school-rugby-ranking', 'free-state', 'Free State', 6,
    "Free State school rugby is built around Bloemfontein's storied institutions and a culture that treats the schoolboy game with near-professional intensity. Track Grey College, Hoërskool Sentraal and the province's other contenders as they set the standard that the rest of the country measures itself against. Every Free State result here updates our provincial rankings, so you can follow exactly how the season's biggest clashes shift the order at the top.",
  ),
];

/** Seed content for the editable pages. */
export const DEFAULT_PAGES: Page[] = [HOME, METHODOLOGY, ...PROVINCE_PAGES];
