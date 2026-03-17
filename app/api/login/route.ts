/**
 * POST /api/login
 *
 * Exchanges a Firebase ID token for a server-managed HttpOnly session cookie.
 * This is the primary login endpoint used by the AuthProvider's
 * onIdTokenChanged listener to keep the server-side session in sync with
 * the client-side Firebase Auth state.
 *
 * Session duration: 7 days
 *
 * The cookie (__session) is:
 *   - HttpOnly  → not accessible via document.cookie (XSS protection)
 *   - Secure    → HTTPS-only in production
 *   - SameSite=lax → CSRF protection while allowing top-level navigations
 *
 * Server Components and API routes verify the cookie via:
 *   getAdminAuth().verifySessionCookie(sessionCookie, true)
 */

import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin.config';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { idToken } =
    body && typeof body === 'object' && 'idToken' in body
      ? (body as { idToken: unknown })
      : { idToken: undefined };

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json(
      { error: '"idToken" string is required.' },
      { status: 400 }
    );
  }

  try {
    // Verify the token first to prevent forged/replayed tokens
    await getAdminAuth().verifyIdToken(idToken, true);

    // Mint a session cookie (Firebase Admin SDK, max 14 days – we use 7)
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ ok: true });

    response.cookies.set('__session', sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[POST /api/login]', err);
    return NextResponse.json(
      { error: 'Invalid or expired ID token.' },
      { status: 401 }
    );
  }
}
