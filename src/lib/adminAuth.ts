// Admin authentication for the Rugby Ignite admin section.
//
// Identity is the shared Match Pulse Firebase project (same project = same
// account). Authorisation mirrors Match Pulse's own isPlatformAdmin(): a user is
// an admin iff their ID token carries the `platformAdmin` custom claim, or their
// users/{uid} doc in the core (default) database has platformAdmin === true.
//
// After a successful sign-in the server issues its own short signed session
// cookie (HMAC-SHA256 with ADMIN_SESSION_SECRET) so ordinary requests don't need
// a Firebase round-trip. Server-side only.

import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { getAdminAuth, getCoreDb } from './data/firebaseAdmin';

export const SESSION_COOKIE = 'ri_admin';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export interface AdminSession {
  uid: string;
  email: string | null;
  exp: number; // unix seconds
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET is not set (needs ≥16 chars). Admin login is disabled until it is configured.');
  }
  return s;
}

function sign(payloadB64: string): string {
  return crypto.createHmac('sha256', secret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(uid: string, email: string | null): string {
  const payload: AdminSession = { uid, email, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE };
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${p}.${sign(p)}`;
}

export function verifySessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const p = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(p);
  } catch {
    return null; // secret not configured → treat as signed out
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(p, 'base64url').toString()) as AdminSession;
    if (!s.uid || typeof s.exp !== 'number' || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

/** The current admin session from the cookie, or null when signed out. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Throw unless the caller holds a valid admin session. Guards server actions. */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error('Not authorised — admin sign-in required.');
  return session;
}

export interface AdminCheck {
  ok: boolean;
  uid?: string;
  email?: string | null;
}

/**
 * Verify a Firebase ID token and decide whether that account is a Match Pulse
 * platform admin — the SAME rule Match Pulse enforces: the `platformAdmin`
 * custom claim first, then the users/{uid}.platformAdmin field as a fallback.
 */
export async function isPlatformAdmin(idToken: string): Promise<AdminCheck> {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  const email = (decoded.email as string | undefined) ?? null;
  if (decoded.platformAdmin === true) return { ok: true, uid: decoded.uid, email };
  try {
    const snap = await getCoreDb().collection('users').doc(decoded.uid).get();
    if (snap.exists && snap.data()?.platformAdmin === true) {
      return { ok: true, uid: decoded.uid, email };
    }
  } catch {
    // Core DB unreadable → fall back to the claim result only.
  }
  return { ok: false, uid: decoded.uid, email };
}
