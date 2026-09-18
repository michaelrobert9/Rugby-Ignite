// Ingest endpoint for a scheduler or a Match Pulse webhook.
//
// POST here to run one ingest + rebuild cycle: read the six Match Pulse fields,
// persist fixtures idempotently, and derive standings / rating history /
// snapshots / Form Heat into the state store. Protected by a shared secret
// (INGEST_SECRET) sent as `Authorization: Bearer <secret>` or `x-ingest-secret`.
//
// Idempotent: re-posting changes nothing until a fixture (or its amend time)
// actually changes at source, so a frequent schedule is safe.

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { runIngestAndRebuild } from '@/lib/store/ingest';
import { RANKINGS_TAG } from '@/lib/matchpulse/cachedSource';
import { STORE_TAG } from '@/lib/store/tags';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: Request): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get('authorization');
  const fromBearer = bearer?.startsWith('Bearer ') ? bearer.slice(7).trim() : null;
  const fromHeader = req.headers.get('x-ingest-secret');
  return fromBearer === secret || fromHeader === secret;
}

export async function POST(req: Request) {
  if (!process.env.INGEST_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'Ingestion is not configured (INGEST_SECRET is unset).' },
      { status: 503 },
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const summary = await runIngestAndRebuild();
    revalidateTag(RANKINGS_TAG, { expire: 0 });
    revalidateTag(STORE_TAG, { expire: 0 });
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
