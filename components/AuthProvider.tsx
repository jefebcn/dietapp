'use client';

/**
 * AuthProvider  –  Firebase Auth ↔ Server Session Cookie Sync
 *
 * Mounts once at the root layout. Listens to Firebase's onIdTokenChanged event
 * which fires on:
 *   - Initial page load (if a user is cached in IndexedDB)
 *   - Token refresh (Firebase rotates ID tokens every hour)
 *   - Sign-in
 *   - Sign-out
 *
 * On each token refresh it calls POST /api/login to mint a fresh
 * HttpOnly __session cookie so Server Components always see a valid session.
 *
 * On sign-out it calls DELETE /api/auth/session to clear the cookie,
 * preventing stale server sessions after client-side logout.
 */

import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase-client.config';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const auth = getClientAuth();

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } catch (err) {
          console.warn('[AuthProvider] Failed to sync session cookie:', err);
        }
      } else {
        // User signed out – clear the server-side session cookie
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (err) {
          console.warn('[AuthProvider] Failed to clear session cookie:', err);
        }
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
