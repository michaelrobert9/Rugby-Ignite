'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { getClientAuth, firebaseConfigured } from '@/lib/firebaseClient';

// Surface the real Firebase error code with a plain hint, so a failed sign-in
// says WHY instead of a generic "incorrect password".
function firebaseError(err: unknown, fallback: string): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : '';
  const hints: Record<string, string> = {
    'auth/invalid-credential': 'Wrong email or password (or this account has no password — try Google).',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No password account for that email — try “Continue with Google”.',
    'auth/operation-not-allowed': 'This sign-in method is turned off in Firebase (enable Email/Password or Google).',
    'auth/unauthorized-domain': 'This website’s domain is not in Firebase Auth → Settings → Authorized domains.',
    'auth/api-key-not-valid': 'The Firebase web API key is wrong or blocked for this domain.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'The Firebase web API key is wrong or blocked for this domain.',
    'auth/requests-from-referer-are-blocked': 'The API key is restricted and this domain isn’t allowed (Google Cloud → Credentials).',
    'auth/popup-blocked': 'The browser blocked the Google popup — allow popups and retry.',
    'auth/popup-closed-by-user': 'The Google popup was closed before finishing.',
  };
  const hint = hints[code];
  return hint ? `${hint}${code ? ` [${code}]` : ''}` : `${fallback}${code ? ` [${code}]` : ''}`;
}

// Exchange the signed-in Firebase user's ID token for our admin session cookie.
async function startSession(idToken: string): Promise<string | null> {
  const res = await fetch('/api/admin/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error || 'Sign-in failed.';
}

export default function AdminLogin() {
  const router = useRouter();
  const configured = firebaseConfigured();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function afterSignIn(idToken: string) {
    const err = await startSession(idToken);
    if (err) {
      // Don't leave a non-admin signed in to Firebase in this tab.
      await signOut(getClientAuth()).catch(() => {});
      setError(err);
      return;
    }
    router.refresh(); // the server layout now sees the cookie and renders the admin
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(getClientAuth(), email.trim(), password);
      await afterSignIn(await cred.user.getIdToken());
    } catch (err) {
      setError(firebaseError(err, 'Sign-in failed.'));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
      await afterSignIn(await cred.user.getIdToken());
    } catch (err) {
      setError(firebaseError(err, 'Google sign-in failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rir-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div className="rir-card p-6" style={{ width: '100%', maxWidth: 380 }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Admin sign in</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Sign in with your Match Pulse platform-admin account.
        </p>

        {!configured && (
          <div className="rir-card p-3 mt-4 text-sm" style={{ background: '#fdf3e7', borderColor: '#f0d9b5', color: 'var(--color-navy-900)' }}>
            Sign-in isn&apos;t configured yet: the Firebase web keys are missing. Set the
            <code> NEXT_PUBLIC_FIREBASE_*</code> values and redeploy.
          </div>
        )}

        {error && (
          <div className="rir-card p-3 mt-4 text-sm" style={{ background: '#fbecec', borderColor: '#ecccbf', color: 'var(--color-down)' }}>
            {error}
          </div>
        )}

        <form onSubmit={onEmailSubmit} className="space-y-3 mt-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>Email</label>
            <input className="rir-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!configured || busy} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>Password</label>
            <input className="rir-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!configured || busy} required />
          </div>
          <button type="submit" className="rir-btn rir-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!configured || busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4" aria-hidden>
          <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or</span>
          <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        <button type="button" className="rir-btn rir-btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onGoogle} disabled={!configured || busy}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
