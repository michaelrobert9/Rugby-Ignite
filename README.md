# Rugby Ignite — prototype

A working prototype of the "Rugby Ignite as a pure ranking site" plan: public
rankings frontend + admin section, built on Next.js, seeded with your real
historical data (104 teams, 3,020 matches, 2022–2026) so the hardest part —
whether the ranking math actually reproduces sane results — is proven with
real fixtures, not fake ones.

## Running it locally

### Quick preview (no setup)

To just see the site, with the bundled historical data:

```bash
npm install
npm run dev
```

Open http://localhost:3000. With **no** Firebase credentials configured, the
app runs against an in-memory copy of the seed data (`src/lib/data/localStore.ts`)
and computes the rankings on the fly — every page is populated immediately, no
key and no "Rebuild" needed. Admin edits work but aren't saved (in-memory only).
This mode is only for local previewing.

### Running against real Firestore

The deployed app is backed by **Firestore** (the shared "Match Pulse" project)
via the Firebase Admin SDK. As soon as a credential is present, the app uses
Firestore instead of the demo data. To run that way locally:

```bash
npm install

# 1. Configure credentials
cp .env.example .env.local
#    then paste your service-account key JSON into SERVICE_ACCOUNT_KEY

# 2. Load the historical seed data into Firestore (one time)
npm run seed:firestore

# 3. Run
npm run dev
```

Edit teams, venues, and matches through the admin screens (`/admin`) and they
persist directly to Firestore. Against Firestore the rankings stay empty until
you click **Rebuild Master + all Seasons** on the admin dashboard, which
computes the `rankings`, `matchRatings` and `meta` collections from the source
data.

## What's real vs what's a placeholder

**Real, and load-bearing:**
- All 104 teams, 3,020 matches, 5 seasons (2022–2026) — pulled directly from
  your WordPress export, not sample data.
- The ranking engine (`src/lib/rankingEngine.ts`) is a faithful port of
  `class-rir-calculator.php` and `class-rir-recalculator.php` from the live
  plugin — the World Rugby exchange formula for Master, the asymmetric-upset
  Elo formula for Season, the chronological stateful replay, the movement
  calculation against the Thursday 23:59 snapshot. Rebuild it and the numbers
  should look like your live site's numbers (see "Validating this" below).
- Province assignment and home-venue matching, per what we agreed: province
  is a curated field on each team (fixed set of 5), and home advantage comes
  from `match.venueId === team.homeVenueId` — a direct reference, not
  name-matching against Google Maps venue names.

**Placeholder / not built yet:**
- No authentication on `/admin` — wide open in this prototype. Needs a real
  auth gate before this goes anywhere public.
- Weekly auto-post and end-of-season post (the Sunday cron job) aren't
  implemented. The rebuild-and-display mechanics are there; the scheduled
  posting isn't.
- The admin doesn't yet support bulk-importing matches (CSV, etc.) — only
  one-at-a-time, which is fine for correcting a handful of records but not
  for the historical import itself (that's a separate script, not this UI).

## How the Firestore connection works

Every read and write goes through `src/lib/data/store.ts` — nothing else in
the app talks to Firestore directly. `store.ts` uses the Firebase Admin SDK
(initialized in `src/lib/data/firebaseAdmin.ts`) from the server only.

Collection layout (all created by `npm run seed:firestore` + a Rebuild):

| Collection | Shape | Notes |
| --- | --- | --- |
| `teams`, `venues`, `matches` | one doc per item, id = item id | edited via `/admin` |
| `config` | single doc `config/current` | ranking settings |
| `rankings` | one doc per scope (`master`, each season) | computed by Rebuild |
| `matchRatings` | one doc per item | computed by Rebuild |
| `meta` | single doc `meta/current` | last-rebuild info |

Array collections are stored one-document-per-item (not a single JSON blob)
because a Firestore document is capped at ~1 MiB — 3,000+ matches would blow
past that.

**Credentials.** The Admin SDK authenticates with a service-account key, read
from `FIREBASE_SERVICE_ACCOUNT_KEY` (or `GOOGLE_APPLICATION_CREDENTIALS`) —
see `.env.example`. The public web config (`apiKey`, etc.) is *not* used by
the app; it would only be needed if browser-side Firebase (e.g. Auth) is
added later.

**Security rules.** Because all access is server-side, `firestore.rules`
denies all direct client access (the Admin SDK bypasses rules). Deploy them
with `firebase deploy --only firestore:rules`.

**Deploying.** Set `FIREBASE_SERVICE_ACCOUNT_KEY` as a secret on your host
(and in CI, if you build there). On Google Cloud / Firebase hosting you can
instead rely on the ambient service account and leave it unset.

## Validating this against the live WordPress site

The real test isn't "does it run" — it's "do the numbers match." After a
rebuild:
1. Pick a handful of teams and compare their Master + Season ratings here
   against what `rugbyignite.co.za` currently shows.
2. If they match, the port is correct and this can become the real thing.
3. If they don't, the discrepancy is almost certainly in a settings value —
   check `/admin/settings` against **SportsPress → Rankings** on the live
   site first before suspecting the engine itself.
