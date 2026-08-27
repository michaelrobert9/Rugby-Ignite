# Rugby-Ignite

A web app built with [Vite](https://vite.dev/) + [React](https://react.dev/),
connected to [Firebase](https://firebase.google.com/) (Firestore + Auth).

## Where the Firebase settings live

Your Firebase config is wired up in two places:

| File | What it holds |
| --- | --- |
| **`.env`** | The actual config values (apiKey, projectId, etc.). Copied from `.env.example`. Git-ignored. |
| **`src/firebase.js`** | Reads those values and initializes Firebase. Exports `db` (Firestore) and `auth`. Import from here everywhere else. |

To use Firestore or Auth anywhere in the app:

```js
import { db, auth } from "./firebase";
```

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file (values are already filled in)
cp .env.example .env

# 3. Run the dev server
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The home screen
runs a live Firestore read and shows whether the connection succeeded.

## About the API key — is it safe to commit?

Yes. Firebase **web** config (including `apiKey`) is public by design. It only
identifies your project; it does not grant access to your data. Anyone
visiting your deployed site can see these values in the browser — that's
expected and normal.

Your data is protected by **Firestore Security Rules**, not by hiding the
config. Before going live, set up rules in the Firebase console
(Firestore → Rules) so only the right users can read/write. See
[Get started with Security Rules](https://firebase.google.com/docs/firestore/security/get-started).

> `.env` is git-ignored anyway — that's the right habit for when you later add
> values that *are* secret (like a service-account key or a payment provider
> key). The non-secret Firebase config is preserved in `.env.example`.

## Project structure

```
.
├── .env.example        # Firebase config values (copy to .env)
├── index.html          # Vite entry point
├── src/
│   ├── firebase.js     # ← Firebase is initialized here
│   ├── main.jsx        # React entry point
│   └── App.jsx         # Demo screen with a Firestore connection test
└── vite.config.js
```
