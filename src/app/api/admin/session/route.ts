import { NextResponse } from 'next/server';
import { createSessionToken, isPlatformAdmin, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/adminAuth';

// The admin login exchanges a Firebase ID token for a signed session cookie.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(req: Request) {
  let idToken = '';
  try {
    const body = (await req.json()) as { idToken?: string };
    idToken = typeof body.idToken === 'string' ? body.idToken : '';
  } catch {
    // no/invalid body
  }
  if (!idToken) {
    return NextResponse.json({ error: 'Missing sign-in token.' }, { status: 400 });
  }

  let check;
  try {
    check = await isPlatformAdmin(idToken);
  } catch {
    return NextResponse.json({ error: 'Could not verify your sign-in. Please try again.' }, { status: 401 });
  }
  if (!check.ok) {
    return NextResponse.json(
      { error: 'This account is not a Match Pulse platform admin, so it cannot access the Rugby Ignite admin.' },
      { status: 403 },
    );
  }

  let token: string;
  try {
    token = createSessionToken(check.uid!, check.email ?? null);
  } catch {
    return NextResponse.json({ error: 'Admin sessions are not configured on the server yet.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, { ...cookieOpts, maxAge: SESSION_MAX_AGE });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOpts, maxAge: 0 });
  return res;
}
