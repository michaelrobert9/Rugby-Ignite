'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebaseClient';

export default function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => {});
    await signOut(getClientAuth()).catch(() => {});
    router.refresh();
  }

  return (
    <button type="button" onClick={onLogout} className="rir-btn rir-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
      Sign out
    </button>
  );
}
