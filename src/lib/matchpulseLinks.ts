// Canonical Match Pulse links. Rugby Ignite reads its data from Match Pulse, so
// upcoming matches, live scores and results live there — on the rugby app. These
// are used for the "where the data comes from" references across the site.

export const MATCHPULSE = {
  /** Main Match Pulse marketing/portal site. */
  main: 'https://matchpulse.co.za',
  /** Match Pulse Rugby app — Live / Today / Upcoming / Recent results hub. */
  rugby: 'https://rugby.matchpulse.co.za',
  /** Competitions: fixtures, standings and results per competition. */
  rugbyCompetitions: 'https://rugby.matchpulse.co.za/competitions',
  /** School directory — each school's fixtures and results. */
  rugbySchools: 'https://rugby.matchpulse.co.za/schools',
} as const;
