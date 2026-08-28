// One-time import of the historical seed data into Firestore.
//
// Reads src/data/seed/*.json (the real Rugby Ignite export — 104 teams,
// 3,020 matches, 2022–2026) and writes it into the shared "Match Pulse"
// Firestore project, mirroring the collection layout in src/lib/data/store.ts:
//
//   teams, venues, matches -> one document per item, doc id = item.id
//   config                 -> a single document 'current' in collection 'config'
//
// rankings / matchRatings / meta are NOT seeded — they are computed by the
// "Rebuild" action in the admin dashboard after the source data is in place.
//
// Usage (Node 20+, no extra deps):
//   npm run seed:firestore
//   # which is: node --env-file=.env.local scripts/seed-firestore.mjs
//
// Requires FIREBASE_SERVICE_ACCOUNT_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
// in .env.local — the same credential the app uses. Re-running is safe: it
// upserts by id.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, '..', 'src', 'data', 'seed');
const BATCH_LIMIT = 450;

function initApp() {
  const rawKey = process.env.SERVICE_ACCOUNT_KEY ?? process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey) {
    const creds = JSON.parse(rawKey);
    return initializeApp({ credential: cert(creds), projectId: creds.project_id });
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault() });
  }
  throw new Error(
    'No credentials found. Set SERVICE_ACCOUNT_KEY (the service-account ' +
      'JSON) or GOOGLE_APPLICATION_CREDENTIALS in .env.local.',
  );
}

function readSeed(name) {
  return JSON.parse(readFileSync(path.join(SEED_DIR, `${name}.json`), 'utf-8'));
}

const db = getFirestore(initApp());

async function writeItems(collection, items) {
  for (let i = 0; i < items.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const item of items.slice(i, i + BATCH_LIMIT)) {
      batch.set(db.collection(collection).doc(String(item.id)), item);
    }
    await batch.commit();
  }
  console.log(`  ${collection}: ${items.length} documents`);
}

async function main() {
  console.log('Seeding Firestore from src/data/seed …');

  await writeItems('teams', readSeed('teams'));
  await writeItems('venues', readSeed('venues'));
  await writeItems('matches', readSeed('matches'));

  await db.collection('config').doc('current').set(readSeed('config'));
  console.log('  config: 1 document (config/current)');

  console.log('\nDone. Now open /admin and click "Rebuild Master + all Seasons".');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
