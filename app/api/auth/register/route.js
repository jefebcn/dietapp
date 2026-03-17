/**
 * POST /api/auth/register
 *
 * Creates a Firestore user profile after client-side Firebase Auth registration.
 * Also exchanges the ID token for a server session cookie so the user
 * is immediately authenticated on the server.
 */

import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin.config';
import { createUser } from '@/lib/repositories/userRepository';

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { uid, email, name, idToken } = body;

  if (!uid || !email || !idToken) {
    return NextResponse.json({ error: '"uid", "email" and "idToken" are required.' }, { status: 400 });
  }

  try {
    // Verify identity
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    if (decoded.uid !== uid) {
      return NextResponse.json({ error: 'UID mismatch.' }, { status: 403 });
    }

    // Create Firestore profile
    const user = await createUser(uid, { email, name: name ?? '' });

    // Create session cookie
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ user }, { status: 201 });

    response.cookies.set('__session', sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[/api/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
