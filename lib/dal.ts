/**
 * lib/dal.ts  –  Data Access Layer (DAL)
 *
 * Centralises all authorization checks so that API routes and Server
 * Components never need to inline cookie/token verification logic.
 *
 * Pattern
 * ───────
 * 1. Extract credential from the request (session cookie or Bearer token).
 * 2. Verify cryptographically with Firebase Admin.
 * 3. Return a typed `AuthContext` or throw / return null on failure.
 *
 * Usage in a Server Component:
 *   import { getSessionUser } from '@/lib/dal';
 *   const user = await getSessionUser();
 *   if (!user) redirect('/login');
 *
 * Usage in an API Route (Bearer token):
 *   import { verifyBearerToken } from '@/lib/dal';
 *   const uid = await verifyBearerToken(request);
 *   if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/lib/firebase-admin.config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthContext {
  uid: string;
  email?: string;
}

// ── Session cookie (Server Components) ───────────────────────────────────────

/**
 * Reads and verifies the __session cookie.
 * Returns an AuthContext on success, null on failure.
 * Does NOT redirect – callers decide what to do on unauthenticated state.
 */
export async function getSessionUser(): Promise<AuthContext | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;

    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

/**
 * Like getSessionUser() but redirects to /login if unauthenticated.
 * Convenience wrapper for pages that must be auth-gated.
 */
export async function requireSessionUser(): Promise<AuthContext> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

// ── Bearer token (API Routes) ─────────────────────────────────────────────────

/**
 * Extracts and verifies the `Authorization: Bearer <idToken>` header.
 * Returns the UID on success, null on failure.
 *
 * Usage:
 *   const uid = await verifyBearerToken(request);
 */
export async function verifyBearerToken(
  request: Request | { headers: { get(key: string): string | null } }
): Promise<string | null> {
  try {
    const authorization =
      'headers' in request && typeof request.headers.get === 'function'
        ? request.headers.get('Authorization')
        : null;

    const idToken = authorization?.replace('Bearer ', '').trim();
    if (!idToken) return null;

    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to get the current user's uid from the Authorization
 * header (for use inside Next.js API Route handlers where `headers()` is
 * available server-side).
 */
export async function verifyServerBearerToken(): Promise<string | null> {
  try {
    const headerStore = await headers();
    const authorization = headerStore.get('Authorization') ?? '';
    const idToken = authorization.replace('Bearer ', '').trim();
    if (!idToken) return null;

    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
