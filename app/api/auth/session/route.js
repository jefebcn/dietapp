/**
 * POST /api/auth/session
 *
 * Exchanges a Firebase ID token for a server-managed session cookie.
 * The session cookie is HttpOnly and Secure, preventing XSS access.
 *
 * Session duration: 14 days (matching Firebase's max session cookie expiry).
 * Firebase Admin verifies the cookie on every protected route via
 * getAdminAuth().verifySessionCookie().
 */

import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin.config';

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { idToken } = body;
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: '"idToken" is required.' }, { status: 400 });
  }

  try {
    // Verify the ID token first to prevent forged tokens
    await getAdminAuth().verifyIdToken(idToken);

    // Create a session cookie valid for 14 days
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
    console.error('[/api/auth/session]', err);
    return NextResponse.json({ error: 'Invalid or expired ID token.' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('__session');
  return response;
}
