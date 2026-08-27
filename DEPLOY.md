# Putting Rugby Ignite live on Firebase

**Important:** merging to GitHub does **not** deploy anything on its own.
Something has to connect the repo to Firebase and run the deploy. This is a
one-time setup in the Firebase Console. Adding a secret to GitHub does nothing
unless you also add a GitHub Actions workflow that uses it — this project uses
Firebase App Hosting instead, which connects directly to the repo.

## Why App Hosting (not plain Hosting)

This app runs **server-side** code (server components, server actions, the
Firebase Admin SDK). Plain Firebase Hosting only serves static files, so it
can't run it. **Firebase App Hosting** is the product that builds and runs a
Next.js server app — it's the right choice here.

> **Billing:** App Hosting (any server-side hosting) requires the **Blaze**
> pay-as-you-go plan. If your project is on the free Spark plan, upgrade it
> first (there's still a free monthly allowance). If you'd rather not enable
> billing at all, Vercel's free tier can run this same app — ask and I'll
> switch the guide.

## One-time setup

1. **Firebase Console → Build → App Hosting → Get started.**

2. **Connect GitHub.** Authorize Firebase, then pick:
   - Repository: `michaelrobert9/Rugby-Ignite`
   - Live branch: `main`
   - Root directory: `/`

   This creates a backend that automatically deploys on every push to `main`.

3. **Add the service-account key as a secret.** App Hosting reads secrets from
   Google Cloud Secret Manager, **not** from GitHub. From your machine:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase apphosting:secrets:set FIREBASE_SERVICE_ACCOUNT_KEY
   ```

   Paste the full service-account JSON when prompted. The repo's
   `apphosting.yaml` already references this secret by name.

   (You can now remove the key you added to GitHub — App Hosting doesn't use
   it.)

4. **Trigger the first rollout.** Creating the backend kicks off a build; if
   not, push any commit to `main`. When it finishes, App Hosting shows your
   live URL.

## Load the data (one time)

Hosting and data are separate. The live site reads from Firestore, which needs
the historical data loaded once. From your machine, with the key in
`.env.local`:

```bash
npm run seed:firestore
```

Then open `/admin` on the live site and click **Rebuild Master + all
Seasons** — the rankings will populate.

## After setup

Every push to `main` redeploys automatically. Deploy the Firestore security
rules once with `firebase deploy --only firestore:rules`.

**Heads-up:** `/admin` has no login yet — anyone with the URL can edit data.
Add an auth gate before sharing the site publicly.
