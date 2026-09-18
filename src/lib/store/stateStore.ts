// Firestore access for Rugby Ignite's own state store (rugby-ignite DB).
//
// Every read degrades to null/[] and every write to a no-op when no persistent
// database is configured (isDemoMode), so a zero-setup preview and the test
// harness keep working — callers fall back to live recomputation. On App
// Hosting (APP_FIRESTORE_DB=rugby-ignite) these talk to the real database.
//
// Collections (all in the rugby-ignite DB, kept separate from the Match Pulse
// project which is read-only):
//   fixtures       one doc per fixture,      id = fixtureId
//   ratingHistory  one doc per team×scope,   id = `${scope}__${teamId}`, { rows }
//   standings      one doc per scope,        id = scope,                 StoredStandings
//   snapshots      one doc per capture,      id = `${scope}__${date}`,   StoredSnapshot
//   corrections    one doc per event,        id = correction id
//   articles       one doc per article,      id = article slug
//   buildMeta      singleton,                id = 'current'

import { getDb } from '../data/firebaseAdmin';
import { isDemoMode } from '../data/store';
import type {
  BuildMeta,
  RatingHistoryRow,
  StoredFixture,
  StoredSnapshot,
  StoredStandings,
} from './types';

const BATCH_LIMIT = 450;

async function commitInBatches(
  col: FirebaseFirestore.CollectionReference,
  ops: Array<(b: FirebaseFirestore.WriteBatch) => void>,
): Promise<void> {
  const db = getDb();
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH_LIMIT)) op(batch);
    await batch.commit();
  }
  void col;
}

// ---- fixtures ------------------------------------------------------------

export async function readFixtures(): Promise<StoredFixture[]> {
  if (isDemoMode()) return [];
  try {
    const snap = await getDb().collection('fixtures').get();
    return snap.docs.map((d) => d.data() as StoredFixture);
  } catch {
    return [];
  }
}

/** Upsert a batch of fixtures (id = fixtureId). Others are left untouched. */
export async function writeFixtures(fixtures: StoredFixture[]): Promise<void> {
  if (isDemoMode() || fixtures.length === 0) return;
  const col = getDb().collection('fixtures');
  await commitInBatches(
    col,
    fixtures.map((f) => (b: FirebaseFirestore.WriteBatch) => b.set(col.doc(f.fixtureId), f)),
  );
}

// ---- standings -----------------------------------------------------------

export async function readStandings(scope: string): Promise<StoredStandings | null> {
  if (isDemoMode()) return null;
  try {
    const snap = await getDb().collection('standings').doc(scope).get();
    return snap.exists ? (snap.data() as StoredStandings) : null;
  } catch {
    return null;
  }
}

export async function writeStandings(standings: StoredStandings): Promise<void> {
  if (isDemoMode()) return;
  await getDb().collection('standings').doc(standings.scope).set(standings);
}

// ---- rating history (one doc per team×scope) -----------------------------

function historyDocId(scope: string, teamId: string): string {
  return `${scope}__${teamId}`;
}

export async function readTeamHistory(scope: string, teamId: string): Promise<RatingHistoryRow[]> {
  if (isDemoMode()) return [];
  try {
    const snap = await getDb().collection('ratingHistory').doc(historyDocId(scope, teamId)).get();
    return snap.exists ? ((snap.data() as { rows: RatingHistoryRow[] }).rows ?? []) : [];
  } catch {
    return [];
  }
}

/**
 * Replace the whole rating-history collection from a full rebuild. `byTeamScope`
 * maps `${scope}__${teamId}` → rows. Any existing history doc not present is
 * deleted, so the store is an exact function of the fixture log.
 */
export async function replaceRatingHistory(
  byTeamScope: Map<string, RatingHistoryRow[]>,
): Promise<void> {
  if (isDemoMode()) return;
  const col = getDb().collection('ratingHistory');
  const existing = await col.get();
  const nextIds = new Set(byTeamScope.keys());
  const ops: Array<(b: FirebaseFirestore.WriteBatch) => void> = [];
  for (const [id, rows] of byTeamScope) {
    const [scope, ...rest] = id.split('__');
    const teamId = rest.join('__');
    ops.push((b) => b.set(col.doc(id), { scope, teamId, rows }));
  }
  for (const d of existing.docs) {
    if (!nextIds.has(d.id)) ops.push((b) => b.delete(col.doc(d.id)));
  }
  await commitInBatches(col, ops);
}

// ---- snapshots -----------------------------------------------------------

export async function writeSnapshot(snapshot: StoredSnapshot): Promise<void> {
  if (isDemoMode()) return;
  await getDb().collection('snapshots').doc(snapshot.id).set(snapshot);
}

export async function readSnapshot(id: string): Promise<StoredSnapshot | null> {
  if (isDemoMode()) return null;
  try {
    const snap = await getDb().collection('snapshots').doc(id).get();
    return snap.exists ? (snap.data() as StoredSnapshot) : null;
  } catch {
    return null;
  }
}

export async function listSnapshots(scope?: string): Promise<StoredSnapshot[]> {
  if (isDemoMode()) return [];
  try {
    let q: FirebaseFirestore.Query = getDb().collection('snapshots');
    if (scope) q = q.where('scope', '==', scope);
    const snap = await q.get();
    return snap.docs
      .map((d) => d.data() as StoredSnapshot)
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

// ---- build meta ----------------------------------------------------------

export async function readBuildMeta(): Promise<BuildMeta | null> {
  if (isDemoMode()) return null;
  try {
    const snap = await getDb().collection('buildMeta').doc('current').get();
    return snap.exists ? (snap.data() as BuildMeta) : null;
  } catch {
    return null;
  }
}

export async function writeBuildMeta(meta: BuildMeta): Promise<void> {
  if (isDemoMode()) return;
  await getDb().collection('buildMeta').doc('current').set(meta);
}

/** Whether a persistent state store is available at all (vs live-compute fallback). */
export function storeEnabled(): boolean {
  return !isDemoMode();
}
