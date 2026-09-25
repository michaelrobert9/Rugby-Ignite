// Auto-post endpoint for a scheduler (e.g. Google Cloud Scheduler, weekly).
//
// POST here to run one auto-post cycle: publish the weekly ranking post (subject
// to the admin's enable + "only when changed" settings) and, when eligible, the
// end-of-season post. Protected by the same shared secret as /api/ingest
// (INGEST_SECRET) sent as `Authorization: Bearer <secret>` or `x-ingest-secret`.
//
// Safe to call more often than weekly: with "only when changed" on, an unchanged
// table is skipped, and the end-of-season post is guarded to once per season.

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { generateWeeklyPost, maybeEndOfSeasonPost } from '@/lib/generate/weeklyPost';
import { RANKINGS_TAG } from '@/lib/matchpulse/cachedSource';
import { STORE_TAG } from '@/lib/store/tags';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: Request): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get('authorization');
  const fromBearer = bearer?.startsWith('Bearer ') ? bearer.slice(7).trim() : null;
  return fromBearer === secret || req.headers.get('x-ingest-secret') === secret;
}

export async function POST(req: Request) {
  if (!process.env.INGEST_SECRET) {
    return NextResponse.json({ ok: false, error: 'Not configured (INGEST_SECRET is unset).' }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const weekly = await generateWeeklyPost();
    const final = await maybeEndOfSeasonPost();
    revalidateTag(RANKINGS_TAG, { expire: 0 });
    revalidateTag(STORE_TAG, { expire: 0 });
    return NextResponse.json({ ok: true, weekly, final });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
