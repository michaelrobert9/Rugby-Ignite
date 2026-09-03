// Verification that the ranking rating is a true points-EXCHANGE system:
// each match only moves points between the two teams, so the total pool stays
// exactly BASELINE × (teams that have played) — points are never created or
// destroyed. Mirrors the swing formula in src/lib/matchpulse/ratingEngine.ts.
//
// Run: npm run verify:elo

const BASELINE = 50;
const K = 2;
const GAP_CAP = 10;
const MARGIN_THRESHOLD = 15;
const MARGIN_MULTIPLIER = 1.5;
const HOME_ADVANTAGE = 0;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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
  // Teams enter gradually — new entrants start at BASELINE.
  const active = Math.min(TEAMS, 2 + Math.floor((n / MATCHES) * TEAMS));
  let h = Math.floor(rand() * active);
  let a = Math.floor(rand() * active);
  if (a === h) a = (a + 1) % active;
  const home = `t${h}`;
  const away = `t${a}`;

  const rH = get(home);
  const rA = get(away);
  const gap = clamp(rH + HOME_ADVANTAGE - rA, -GAP_CAP, GAP_CAP);
  const expectedHome = 0.5 + gap / (2 * GAP_CAP);

  const hs = Math.floor(rand() * 60);
  const as = Math.floor(rand() * 60);
  const resultHome = hs > as ? 1 : hs < as ? 0 : 0.5;
  const margin = Math.abs(hs - as);
  const weight = margin > MARGIN_THRESHOLD ? MARGIN_MULTIPLIER : 1;

  const swing = K * weight * (resultHome - expectedHome);
  const before = rH + rA;
  const newH = rH + swing;
  const newA = rA - swing;
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

console.log(`teams played:      ${played.size}`);
console.log(`matches replayed:  ${MATCHES}`);
console.log(`pool total:        ${total.toFixed(6)}`);
console.log(`pool expected:     ${expected} (= ${BASELINE} × ${played.size})`);
console.log(`pool drift:        ${drift.toExponential(3)}`);
console.log(`worst per-match:   ${worstPerMatchDrift.toExponential(3)} (should be ~0)`);
console.log(`rating range:      ${min.toFixed(1)} … ${max.toFixed(1)}`);

const ok = drift < 1e-6 * played.size && worstPerMatchDrift < 1e-9;
console.log(ok ? '\nPASS — points are only exchanged; none created or destroyed.' : '\nFAIL — the pool changed; the exchange is not zero-sum.');
process.exit(ok ? 0 : 1);
