# Putting Rugby Ignite live

The app is a Next.js server app that reads/writes Firestore with a
service-account key. To go live you need a host that runs Next.js on the
server (not a static-only host) and the key set as an environment variable.

The recommended host is **Vercel** — it's free for this, auto-detects
Next.js, and redeploys automatically every time you push to GitHub.

## Option A — Vercel (recommended)

**One-time setup (about 3 minutes):**

1. **Get the app onto `main`.** Merge the open pull request so the app lives
   on the `main` branch (Vercel deploys `main` as production by default).

2. Go to **https://vercel.com** and sign in with your **GitHub** account.

3. Click **Add New… → Project**, then **Import** `michaelrobert9/Rugby-Ignite`.

4. Vercel auto-detects **Next.js** — leave the build settings as they are
   (Root Directory `./`, Build Command `next build`, Output handled
   automatically).

5. Open **Environment Variables** and add one:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value:** paste the **entire contents** of your service-account JSON
     file, exactly as downloaded (no quotes around it — Vercel stores it
     as-is).
   - Leave it applied to all environments (Production/Preview/Development).

6. Click **Deploy**. After a minute you'll get a live URL like
   `https://rugby-ignite.vercel.app`.

**Load the data (one time).** Hosting and data are separate — the live site
reads from your Firestore, which needs the historical data loaded once. From
your own machine, with the key in `.env.local`:

```bash
npm run seed:firestore
```

Then open `/admin` on the live site and click **Rebuild Master + all
Seasons**. The rankings will populate.

**After that:** every `git push` to `main` redeploys automatically. No
further steps.

## Option B — Firebase App Hosting (same vendor as Firestore)

If you'd rather keep everything in Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase init apphosting     # connect this GitHub repo
```

During setup, store the service-account key as a secret
(`firebase apphosting:secrets:set FIREBASE_SERVICE_ACCOUNT_KEY`) and grant the
backend access to it. App Hosting then builds and deploys on every push, same
as Vercel. Seeding + Rebuild work exactly as above.

## Notes

- **The service-account key is the only secret.** The Firebase *web* config
  (apiKey etc.) is not used by this app and does not need to be set anywhere.
- **Security rules:** deploy `firestore.rules` once with
  `firebase deploy --only firestore:rules` so all direct client access to
  Firestore is denied (the app talks to it only from the server).
- **`/admin` has no login yet** — anyone with the URL can edit data. Add an
  auth gate before sharing the site publicly.
