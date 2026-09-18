# Rugby Ignite — 2027 Generated-Site Implementation Plan

Status: **draft for review.** This is a plan, not a change. Nothing here is built
yet. It maps the authoritative 2027 brief onto the codebase as it stands and
proposes a sequenced way to get there.

## 0. Source of truth

The brief is the uploaded design bundle, in this authority order:

1. `Rugby Ignite Brand Book v7.dc.html` — visual + editorial authority.
2. `README.md` (handoff) — architecture and the two hard constraints.
3. `GENERATION.md` — the generation rules (L1–L9, A1–A6, sentence templates, guardrails).
4. `Rugby Ignite Site Concept.dc.html` — the nine screens (eight ship; "How it runs" does not).

Two hard constraints from the brief frame everything:

- **Rugby Ignite holds no match data.** It ingests six fields per fixture from
  Match Pulse, derives ratings, and links out for everything else. Duplicating
  Match Pulse content (fixtures, scores as a scoreboard, stats, squads, photos)
  is out of scope and explicitly forbidden.
- **Static-HTML-first.** Every figure must be present in the initial HTML, because
  the distribution strategy is organic search + AI answer engines that do not run
  JavaScript. No figure may be an image; structured data must match visible text.

## 1. Where we are today

A faithful, in-production, monetised ranking site — but **stateless** where the
brief needs state.

- **Live, recompute-per-request.** `cachedSource.ts` reads Match Pulse live
  (`matches` where `status == final`, plus `organizations`), caches the raw
  snapshot in the Next data cache for 10 minutes (`tags: ['rankings']`), and
  `computeLiveLadder` replays the **entire** match history through the engine on
  every request. No ladder, rating history, or snapshot is ever persisted.
- **The engine is already right.** `rankingEngine.ts` (`runFullRecalculation`) is
  a faithful dual-track port: **Master** = World-Rugby points exchange (zero-sum,
  never resets), **Season** = Elo seeded each year from Master. It is deterministic
  (sorts by date then id) and already emits `matchRatings` and per-team
  `movement`/`weekPoints` (vs the last Thursday 23:59 SAST cutoff). It returns
  both; it stores neither.
- **Figures are server-rendered.** `RankingTable.tsx` is an async server component;
  ratings are in the SSR HTML. `RankingTabs`/`TeamCell`/`AdUnit` are the only
  client components and none compute numbers. So the crawler requirement is
  *already met for the pages that exist* — the gap is which pages exist and what
  state backs them, not hydration.
- **The `rugby-ignite` DB holds only editorial state:** `config`, `sportConfigs`,
  `site`, `pages`, `posts`. Crucially, `firestoreStore.ts` **already defines unused
  plumbing** for `teams`/`venues`/`matches`/`matchRatings`/`rankings` (docId
  schemes + `replaceCollection`). That is a ready-made seam for persisting a
  computed ladder.
- **Everything is `force-dynamic`.** No `generateStaticParams`, no ISR, no static
  export anywhere.
- **Admin** authenticates against the shared Match Pulse identity (`platformAdmin`
  claim / `users/{uid}.platformAdmin`), and can edit config/pages/posts/SEO/ads and
  bust the rankings cache (`refreshRankingsAction` — a cache flush, not a rebuild,
  because there is nothing persisted to rebuild).
- **Season** is derived from the Africa/Johannesburg clock (auto-rolls 1 Jan).

**Reusable as-is:** the engine, the config/method store, admin auth, the live
Match Pulse read, SSR rendering, the province model, the `firestoreStore`
collection plumbing. **Missing for the brief:** a persisted state store, ingestion
as a pipeline (idempotency/queue/corrections), Form Heat, immutable snapshots,
the generation layer, and the Layer-1/Layer-2 page set.

## 2. The central shift

Move from **"recompute the ladder live on every request"** to **"ingest fixtures
into an owned state store, derive on write, and render the store."**

This one change is what unlocks the whole brief: frozen articles, dated archive
snapshots, corrections with was/now/delta, and Form Heat (movement since the
season opened) all require a persisted history that a per-request recompute cannot
provide. The engine does not change — it stops being a per-request function and
becomes the thing that *writes* the store.

SSR stays (App Hosting, server components), so the static-HTML requirement keeps
being satisfied by server rendering the store; we add ISR/`revalidateTag` so pages
are rebuilt on ingest rather than recomputed per hit.

### Proposed state store (`rugby-ignite` Firestore DB)

| Collection | Purpose | Notes |
|---|---|---|
| `fixtures` | The six ingested fields per fixture | idempotent on `fixture_id` + `amended_at`; `status`, queued flag |
| `rating_history` | Append-only, one row per rating change | carries `fixture_id`; the citation source |
| `ratings` | Current rating + rank + form_heat per school | derived, recomputed after every write |
| `snapshots` | Frozen ranking tables (weekly / daily in festival) | immutable once written |
| `method_config` | K, margin threshold, heat bands, version | supersedes/wraps today's `config` |
| `corrections` | Correction events (was/now/delta, affected schools) | published to `/corrections/{id}` |
| `articles` | Frozen generated stories | written once, never edited |

The engine already produces `matchRatings` (→ `rating_history`) and `teamRatings`
(→ `ratings` + `snapshots`); the work is persisting them idempotently and reading
them back, not re-deriving them.

## 3. Decisions

### Resolved (owner, 2026-09-18)

1. **Monetisation — keep both.** AdSense stays as the primary revenue generator at
   this stage; the sponsor band is added as an **additional** stream. Both must
   exist — not one instead of the other. The README's "no advertising" line is
   overridden by the owner; the sponsor band sits between page title and table (per
   the brand book), AdSense units keep their current placements, and neither goes
   inside a row, a rating, the mark, or the nav.
2. **Merge the old and new into one site — additive, not a replacement.** Keep the
   **Master (All-Time)** and **Season** tracks and the **provincial win-% tables**
   we publish today, and add the brief's new surface on top: the single Ignite
   Rating framing (the Master rating is the Ignite Rating), Form Heat, `/school`,
   `/how-it-works`, `/corrections`, articles and archive snapshots. Nothing that is
   live today is dropped; the generated-site architecture wraps it.
3. **Don't engineer the rating magnitude; Form Heat is form, not the rating.** We do
   not recalibrate the method to force the leader above 90 — the rating is whatever
   the results make it, and copy must not lean on an assumed ">90" leader. **Form
   Heat is derived from recent results / recent form (opponent-weighted), not from
   the rating value and not from match scores.** A low-ranked school on a good run
   can read hot; the table leader can read cold.

### Still open

4. **Form Heat definition + bands.** Given decision 3, pin the exact recent-form
   window and weighting (e.g. last N rated fixtures, opponent-strength weighted) and
   the five band thresholds (prototype assumes Cold 0–19, Cool 20–39, Warm 40–59,
   Hot 60–79, White Hot 80–100). Sign off with the method owner.
5. **Match Pulse contract.** Confirm the source exposes, per fixture: a stable
   `fixture_id`, `status` (only `complete`/`final` rated), `amended_at` (drives
   corrections), and a **province per school** (province pages are generated only for
   provinces present in data). Confirm webhook vs poll for ingestion. Today's read
   uses `homeOrgId/awayOrgId/scores/date/season` and hard-codes `ageGroup='1st'` —
   `amended_at` and per-school province are not read yet.
6. **Custodian.** Named brand + method custodians to publish on `/how-it-works`.
7. **Rollout.** Build the 2027 site behind a preview/branch and cut over at season
   start, rather than mutating the live site in place (recommended).

## 4. Phased roadmap

Each phase lists goal, main files, what it reuses, risk, and an exit test. Phases
1 is independent and shippable now; 2→7 are the rebuild and run in order.

### Phase 1 — Design-system alignment (shippable now, low risk, revertable)
Bring the *current* live site to Brand Book v7 visuals without touching data. This
is the "design-only" lane we've already been using.
- **Typography:** self-host **Archivo Black** (wordmark/ratings/headlines) + the
  **Helvetica Neue** system stack (everything else, with a 600/tracked/uppercase
  "caps" role for labels/data/movement). Drop Instrument Serif and JetBrains Mono.
- **Tokens:** heat ramp already corrected; **remove all border radius** (`--radius*`
  → 0, square corners everywhere); movement rendered as `▲ 4.10` / `▼ 4.10` / `—
  0.00` in coal.
- **Header/footer:** 8×30 heat stroke + `RUGBY IGNITE` at 15px/`0.16em`, a 2px
  full-width heat rule under the bar; coal footer with the credit lines.
- **Files:** `globals.css`, `layout.tsx`, `RankingTable.tsx`, `rankingCells.tsx`,
  `SiteNav.tsx`; add `public/fonts/` + `@font-face`.
- **Exit:** side-by-side matches the brand book at desktop + phone width; no
  serif/mono remain; tsc/eslint/build green.

### Phase 2 — State store + ingestion pipeline
- New `src/lib/store/` writing the collections in §2; reuse `firestoreStore.ts`
  plumbing. Ingest the six fields; idempotent on `fixture_id`+`amended_at`; queue
  any fixture missing a field (internal queue view, never a public "missing data"
  notice).
- Trigger: a route handler for a Match Pulse webhook and/or a scheduled poll
  (App Hosting + Cloud Scheduler). Admin gains an "ingest now" action alongside the
  existing refresh.
- **Exit:** ingesting a fixture writes `fixtures` + `rating_history` + updates
  `ratings`; re-ingesting the same `fixture_id`+`amended_at` is a no-op; a
  five-field fixture queues instead of rating.

### Phase 3 — Derive-on-write: ratings, snapshots, Form Heat, method_config
- Wire `runFullRecalculation` as the writer (rebuild from the fixture log must
  reproduce the store exactly). Persist `ratings`, append `rating_history`, write a
  `snapshot` at round close.
- Add **Form Heat** (0–100) as a genuine engine addition, computed from **recent
  results / recent form** (opponent-weighted), per decision 3 — not from the rating
  value and not from match scores. Persist a `form_heat` + band per school; withhold
  it in off-season and festival mode.
- Fold `config.ts` into `method_config` with a version + changelog.
- **Exit:** a full rebuild from the log is byte-identical to incremental writes;
  `/how-it-works` worked example (latest fixture) matches the calculator.

### Phase 4 — Evergreen pages (Layer 1, ~192 URLs)
Server-rendered from the store, ISR-revalidated on ingest.
- `/` (This Week — hero + top 5 + largest gain + next-round stakes),
  `/ranking` (full 184, 6 columns POS/FIRST XV/WIN%/HEAT/RATING/RTG PTS, sponsor
  band + AdSense, province filter chips from provinces present), `/ranking/{province}`,
  `/school/{slug}` (×184 — vertical Form Heat gauge, three figures, every rating
  change with citations, sparkline, "matches live on Match Pulse"),
  `/how-it-works` (printed from `method_config`), `/corrections`.
- **Merge (decision 2):** retain the current Master + Season track tabs and the
  provincial win-% tables as views within this set — the Ignite Rating is the
  Master rating; Season and provincial are additional reads, not replaced.
- Mobile: table drops to **three columns** (pos, school, rating) with win% + delta
  under the name; nothing clips; 44px tap targets.
- **Exit:** all figures in initial HTML; structured data matches; phone layout per
  brief; modules with no data disappear rather than empty.

### Phase 5 — Generation engine (voice)
- Pure, unit-tested functions over the store: the **lead-story ladder L1–L9**
  (first rule wins; L9 always fires so `/` is never empty), **sentence templates**
  (movement, fixture stakes, Form Heat, off-season, correction), and the
  **guardrails** (never name a player; never publish an uncomputable superlative;
  never characterise a defeat; never render an empty module; Form Heat off in
  off-season/festival). Non-negotiable wording enforced ("rating" vs "ranking",
  "rating points", "method" not "algorithm").
- **Exit:** golden-file tests for each rule's sentence from fixed inputs; guardrail
  tests; the This Week hero renders the right rule for a given fixture set.

### Phase 6 — Articles (Layer 2) + cadence + archive
- `/stories/{season}/{slug}`, festival day reports, `/archive/{season}/{date}`
  (frozen snapshots). Articles written once, never edited; a later correction adds
  a banner + link only.
- **Cadence derived from data density**, not calendar: `OFF_SEASON` (no rated
  fixture 6+ weeks), `ORDINARY` (weekly Sunday snapshot, one round report),
  `FESTIVAL` (**≥8 rated fixtures in 48h** → daily snapshots, per-school PROVISIONAL/
  SETTLED, Form Heat + fixture-stakes withheld, one article/day). Article cooldowns
  (max one/day; no school leads two running unless the leader changes).
- **Exit:** an unannounced festival flips mode from the data; a day close publishes
  exactly one day report; off-season states the silence with a live week count.

### Phase 7 — Corrections flow
- `amended_at` change → recompute from that fixture forward → write a `correction`
  event → publish `/corrections/{id}` → banner every superseded snapshot/article
  (never edit them). Public complaint routing points to Match Pulse.
- **Exit:** amending a past fixture recomputes downstream, publishes the entry, and
  banners the affected snapshots without rewriting their bodies.

### Phase 8 — SEO, share cards, structured data, degraded states
- 1200×630 coal share card per school/story (heat stroke + name + rating + delta +
  domain; no photography; every figure also text on the page). Open Graph, JSON-LD
  matching visible text, evergreen vs article title rules. Match-Pulse-unreachable →
  serve last good build unchanged.
- **Exit:** the brand book's pre-publish checklist passes end to end.

### Phase 9 — Launch
- Afrikaans glyph coverage across macOS/Windows/Android (release blocker: `ʼn`
  U+02BC, `ê`, `ë`, `ô`). Scale calibration signed off. Custodians published.
  Footer disclaimers (Match Pulse credit, not official, not affiliated with World
  Rugby). Cut over.

## 5. Risks

- **Match Pulse field availability** (`amended_at`, stable `fixture_id`, per-school
  province). If absent, corrections and province pages are blocked — verify in
  Phase 0/2 before committing to those phases.
- **Scale calibration** — if the leader can't reach >90, the "out of 100" promise
  fails; may need a method change, which is a custodian decision.
- **Determinism/idempotency** — the store must be reproducible from the fixture log;
  guarded by a "rebuild == incremental" test in Phase 3.
- **Scope fork on decision #2** — collapsing to a single rating vs keeping
  Master/Season/provincial changes Phases 4–6 substantially.
- **Deploy safety** — `main` auto-deploys; the rebuild must live behind a preview
  until cutover so the live site is never half-migrated.

## 6. Recommended sequencing

Ship **Phase 1 (design) now** on the live site — it's high-value, low-risk,
independent of the architecture, and matches the "approve or revert" lane we've
been using. Take **Decisions §3** in parallel (especially monetisation and
one-vs-three-tables, since they gate Phases 4–6). Build **Phases 2–7 behind a
preview branch**, and cut over at the 2027 season start.

Rough effort (engineering, excluding decisions): Phase 1 ~1–2 days; Phases 2–3
(store + engine-as-writer + Form Heat) ~1–2 weeks; Phase 4 (Layer 1 pages) ~1–2
weeks; Phase 5 (generation) ~1 week; Phase 6 (articles + cadence) ~1–2 weeks;
Phases 7–9 ~1–2 weeks. This is a v2 rebuild, not a tweak.

## 7. Open items for the client (consolidated)

Resolved 2026-09-18: monetisation (both AdSense + sponsor band), merge (keep
Master/Season/provincial + add the new surface), and rating scale / Form Heat basis
(don't engineer the magnitude; Form Heat = recent form, not the rating value). Still
open:

1. Form Heat definition — recent-form window + weighting, and the five band
   thresholds.
2. Match Pulse contract — `fixture_id`, `status`, `amended_at`, per-school province,
   webhook vs poll.
3. Named brand + method custodians for `/how-it-works`.
4. Rollout — build behind a preview and cut over at season start? (recommended)
