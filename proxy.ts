/**
 * proxy.ts  –  NutriTrack Session Proxy (Node.js Runtime)
 *
 * Replaces the old Edge-runtime two-layer approach.  Running on the Node.js
 * runtime means we can call firebase-admin directly and skip the lightweight
 * atob()-based pre-check that was required in Edge.
 *
 * Session cookie: __session
 *   Minted    → POST /api/login            (7-day HttpOnly, firebase-admin)
 *   Refreshed → AuthProvider               (onIdTokenChanged → /api/login hourly)
 *   Cleared   → DELETE /api/auth/session   (on sign-out)
 *
 * Protected routes : /dashboard  /diary  /weight  /settings  /profile  /leagues
 * Auth-only routes : /login  /register
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Force Node.js runtime so firebase-admin crypto is available
export const runtime = 'nodejs';

// ── Route tables ─────────────────────────────────────────────────────────────
const PROTECTED = ['/dashboard', '/diary', '/weight', '/settings', '/profile', '/leagues', '/insights', '/premium', '/scan', '/plan', '/contest'];
const AUTH_ONLY = ['/login', '/register'];

// ── Lightweight cookie presence check ────────────────────────────────────────
// Full cryptographic verification happens in Server Components / API routes via
// getAdminAuth().verifySessionCookie().  Middleware only checks presence +
// basic JWT structure to avoid cold-start latency on every request.
function hasApparentSession(cookie: string | undefined): boolean {
  if (!cookie || cookie.trim() === '') return false;
  // A Firebase session cookie is a 3-part dot-separated JWT
  const parts = cookie.split('.');
  if (parts.length !== 3) return false;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(
      Buffer.from(padded, 'base64').toString('utf8')
    ) as Record<string, unknown>;
    const exp = payload['exp'];
    if (typeof exp === 'number' && exp * 1000 <= Date.now()) return false;
  } catch {
    // If we can't decode the JWT, pass it through – the server layer rejects it
  }
  return true;
}

// ── Middleware export ─────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const valid = hasApparentSession(sessionCookie);

  // ── Guard protected pages ─────────────────────────────────────────────────
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!valid) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(pathname)}`;
      const res = NextResponse.redirect(url);
      if (sessionCookie) {
        res.cookies.set('__session', '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        });
      }
      return res;
    }
  }

  // ── Redirect away from auth pages when session is live ───────────────────
  if (AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    if (valid) {
      const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
      const safe =
        next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      return NextResponse.redirect(new URL(safe, request.url));
    }
  }

  return NextResponse.next();
}

// ── Route matcher config ──────────────────────────────────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/|images/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)',
  ],
};
