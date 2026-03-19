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

import { useEffect, useRef } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase-client.config';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Track whether we previously had an authenticated user.
  // We only clear the server session cookie when transitioning from
  // authenticated → unauthenticated (i.e. explicit sign-out), NOT on every
  // cold page-load by an anonymous visitor (which would fire unnecessarily
  // on the public landing page and generate avoidable network errors).
  const hadUser = useRef<boolean | null>(null);

  useEffect(() => {
    const auth = getClientAuth();

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        hadUser.current = true;
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
        // Only clear the server-side session cookie when the user has just
        // signed out (transition from authenticated → unauthenticated).
        // Skip the DELETE call on initial load with no cached Firebase user
        // to avoid unnecessary requests on the public landing page.
        if (hadUser.current === true) {
          try {
            await fetch('/api/auth/session', { method: 'DELETE' });
          } catch (err) {
            console.warn('[AuthProvider] Failed to clear session cookie:', err);
          }
        }
        hadUser.current = false;
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
