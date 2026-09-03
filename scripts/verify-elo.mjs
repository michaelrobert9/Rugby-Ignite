// Verifies the MASTER track is a true points-EXCHANGE system: each match only
// moves points between the two teams, so the total pool stays exactly
// baseline × (teams that have played) — points are never created or destroyed.
//
// This mirrors calculateMasterExchange() in src/lib/rankingEngine.ts (the
// faithful port of the rugby-ignite-rankings WordPress plugin) EXACTLY, using
// the default settings from src/data/seed/config.json. If the two ever diverge,
// this check is the alarm.
//
// (The SEASON track is intentionally NOT conserved — its upset multiplier and
// per-side caps add/remove points to reward giant-killing — so it is not
// checked here.)
//
// Run: npm run verify:elo

import config from '../src/data/seed/config.json' with { type: 'json' };

const BASELINE = config.baselineRating; // 50
const K = config.kMaster; // 4
const HOME_ADVANTAGE = config.homeAdvantage; // 3
const MASTER_HARD_CAP = 12.0;
const EFFECTIVE_CAP = Math.min(MASTER_HARD_CAP, config.masterSafetyCap);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Exact port of calculateMasterExchange -> returns the home team's change.
function masterChangeHome(homeRating, awayRating, homePoints, awayPoints, isHome) {
  let D = homeRating - awayRating;
  if (isHome) D += HOME_ADVANTAGE;
  D = clamp(D, -10, 10);

  const margin = Math.abs(homePoints - awayPoints);
  let changeHome;
  if (homePoints === awayPoints) {
    changeHome = -(K * (D / 10.0)); // draw
  } else if (homePoints > awayPoints) {
    changeHome = D >= 0.0 ? K * (1.0 - D / 10.0) : K * (1.0 + Math.abs(D) / 10.0); // win
  } else {
    const P = D <= 0.0 ? K * (1.0 - Math.abs(D) / 10.0) : K * (1.0 + D / 10.0); // loss
    changeHome = -P;
  }

  if (homePoints !== awayPoints && margin >= 16) changeHome *= 1.5;
  if (Math.abs(changeHome) > EFFECTIVE_CAP) changeHome = changeHome > 0 ? EFFECTIVE_CAP : -EFFECTIVE_CAP;
  return changeHome;
}

// Deterministic PRNG so the check is reproducible.
let seed = 123456789;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const TEAMS = 40;
const MATCHES = 20000;
const ratings = new Map();
const played = new Set();
const get = (id) => (ratings.has(id) ? ratings.get(id) : BASELINE);

let worstPerMatchDrift = 0;

for (let n = 0; n < MATCHES; n++) {
  const active = Math.min(TEAMS, 2 + Math.floor((n / MATCHES) * TEAMS)); // teams enter gradually
  let h = Math.floor(rand() * active);
  let a = Math.floor(rand() * active);
  if (a === h) a = (a + 1) % active;
  const home = `t${h}`;
  const away = `t${a}`;

  const rH = get(home);
  const rA = get(away);
  const hs = Math.floor(rand() * 60);
  const as = Math.floor(rand() * 60);
  const isHome = rand() > 0.35; // most matches have a home side

  const changeHome = masterChangeHome(rH, rA, hs, as, isHome);
  const changeAway = -changeHome; // the exchange: loser loses exactly what winner gains

  const before = rH + rA;
  const newH = rH + changeHome;
  const newA = rA + changeAway;
  worstPerMatchDrift = Math.max(worstPerMatchDrift, Math.abs(newH + newA - before));

  ratings.set(home, newH);
  ratings.set(away, newA);
  played.add(home);
  played.add(away);
}

let total = 0;
let min = Infinity;
let max = -Infinity;
for (const id of played) {
  const r = get(id);
  total += r;
  min = Math.min(min, r);
  max = Math.max(max, r);
}
const expected = BASELINE * played.size;
const drift = Math.abs(total - expected);

console.log(`master K (kMaster): ${K}   cap: ±${EFFECTIVE_CAP}   baseline: ${BASELINE}`);
console.log(`teams played:      ${played.size}`);
console.log(`matches replayed:  ${MATCHES}`);
console.log(`pool total:        ${total.toFixed(6)}`);
console.log(`pool expected:     ${expected} (= ${BASELINE} × ${played.size})`);
console.log(`pool drift:        ${drift.toExponential(3)}`);
console.log(`worst per-match:   ${worstPerMatchDrift.toExponential(3)} (should be ~0)`);
console.log(`rating range:      ${min.toFixed(1)} … ${max.toFixed(1)}`);

const ok = drift < 1e-6 * played.size && worstPerMatchDrift < 1e-9;
console.log(ok ? '\nPASS — Master only exchanges points; none created or destroyed.' : '\nFAIL — the pool changed; the Master exchange is not zero-sum.');
process.exit(ok ? 0 : 1);
