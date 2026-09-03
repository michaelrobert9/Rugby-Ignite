// Firestore-backed implementation of the data store.
//
// store.ts picks this backend when Firebase credentials are configured; when
// they aren't (e.g. `npm run dev` with no key), it falls back to the in-memory
// demo backend in localStore.ts instead. Both expose the same functions so the
// rest of the app (pages, admin forms, ranking engine) is unaffected.
//
// Collection layout (names match the plan in the README):
//   teams, venues, matches   -> one document per item, doc id = item.id
//   matchRatings             -> one document per item, doc id = matchId__teamId__scope
//   rankings                 -> one document per scope, doc id = scope, data = { rows: [...] }
//   config, meta             -> a single document 'current' in a collection of that name
//
// Everything is document-per-item rather than one big blob because a single
// Firestore document is capped at ~1 MiB — 3,000+ matches and their ratings
// would blow past that. The trade-off is that whole-collection reads/writes
// touch many documents, so teams/matches/venues also expose per-item helpers
// (getItem/setItem/deleteItem) that admin edits use instead of rewriting the
// whole collection.

import type { WhereFilterOp } from 'firebase-admin/firestore';
import { getDb } from './firebaseAdmin';

const SINGLETON_COLLECTIONS = new Set(['config', 'meta', 'sportConfigs']);
const SINGLETON_DOC_ID = 'current';

// Firestore batches allow up to 500 writes; stay comfortably under.
const BATCH_LIMIT = 450;

/** Derive a stable document id for an item in an array collection. */
function docIdFor(name: string, item: Record<string, unknown>): string {
  if (name === 'matchRatings') {
    return `${item.matchId}__${item.teamId}__${item.scope}`;
  }
  return String(item.id);
}

async function commitInBatches(
  ops: Array<(batch: FirebaseFirestore.WriteBatch) => void>,
): Promise<void> {
  const db = getDb();
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH_LIMIT)) op(batch);
    await batch.commit();
  }
}

/**
 * Replace an entire collection: upsert every provided document and delete any
 * existing document that is no longer present. Used for full rebuilds and the
 * initial seed — not for single-item admin edits.
 */
async function replaceCollection(
  name: string,
  docs: Array<{ id: string; data: Record<string, unknown> }>,
): Promise<void> {
  const db = getDb();
  const col = db.collection(name);

  const existing = await col.get();
  const nextIds = new Set(docs.map((d) => d.id));

  const ops: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  for (const d of docs) ops.push((batch) => batch.set(col.doc(d.id), d.data));
  for (const snap of existing.docs) {
    if (!nextIds.has(snap.id)) ops.push((batch) => batch.delete(col.doc(snap.id)));
  }
  await commitInBatches(ops);
}

/** Read a whole logical collection back into the shape the app expects. */
export async function readCollection<T>(name: string): Promise<T> {
  const db = getDb();

  if (SINGLETON_COLLECTIONS.has(name)) {
    const snap = await db.collection(name).doc(SINGLETON_DOC_ID).get();
    if (!snap.exists) throw new Error(`No '${name}' document in Firestore.`);
    return snap.data() as T;
  }

  if (name === 'rankings') {
    const snap = await db.collection('rankings').get();
    const out: Record<string, unknown> = {};
    for (const d of snap.docs) out[d.id] = (d.data() as { rows?: unknown[] }).rows ?? [];
    return out as T;
  }

  // Array collections.
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => d.data()) as T;
}

/** Replace a whole logical collection. */
export async function writeCollection<T>(name: string, data: T): Promise<void> {
  const db = getDb();

  if (SINGLETON_COLLECTIONS.has(name)) {
    await db.collection(name).doc(SINGLETON_DOC_ID).set(data as Record<string, unknown>);
    return;
  }

  if (name === 'rankings') {
    const entries = Object.entries(data as Record<string, unknown[]>);
    await replaceCollection(
      'rankings',
      entries.map(([scope, rows]) => ({ id: scope, data: { rows } })),
    );
    return;
  }

  const items = data as unknown as Array<Record<string, unknown>>;
  await replaceCollection(
    name,
    items.map((item) => ({ id: docIdFor(name, item), data: item })),
  );
}

// ---- Per-item helpers (used by admin CRUD so a single edit doesn't rewrite
// the whole collection) --------------------------------------------------

export async function getItem<T>(name: string, id: string): Promise<T | undefined> {
  const snap = await getDb().collection(name).doc(id).get();
  return snap.exists ? (snap.data() as T) : undefined;
}

export async function setItem<T>(name: string, id: string, data: T): Promise<void> {
  await getDb()
    .collection(name)
    .doc(id)
    .set(data as FirebaseFirestore.DocumentData);
}

export async function deleteItem(name: string, id: string): Promise<void> {
  await getDb().collection(name).doc(id).delete();
}

/** Targeted query, so callers can avoid pulling a whole collection. */
export async function queryItems<T>(
  name: string,
  field: string,
  op: WhereFilterOp,
  value: unknown,
): Promise<T[]> {
  const snap = await getDb().collection(name).where(field, op, value).get();
  return snap.docs.map((d) => d.data()) as T[];
}
