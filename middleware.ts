/**
 * middleware.ts  –  NutriTrack Session Guard
 *
 * Runs on the Next.js Edge Runtime before every matched request.
 * Performs a lightweight __session cookie check (presence + expiry decode).
 * Cryptographic verification via firebase-admin happens in Server Components
 * and API route handlers (which run in the Node.js runtime).
 *
 * Routes protected: /dashboard, /diary, /weight, /settings, /profile
 * Auth routes:      /login  (redirect to /dashboard if session is valid)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Route categories ────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/diary',
  '/weight',
  '/settings',
  '/profile',
];

const AUTH_PREFIXES = ['/login', '/register'];

// ── JWT payload decoder (Edge-safe, no crypto) ──────────────────────────────

/** Decodes the `exp` (expiry) field from a Firebase session cookie JWT payload.
 *  Does NOT verify the signature – that is handled by firebase-admin in Server
 *  Components and API routes running in the Node.js runtime.
 */
function getSessionExpiry(cookie: string): number | null {
  try {
    const parts = cookie.split('.');
    if (parts.length < 2) return null;
    // Base64url → Base64 → JSON
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Returns true if the session cookie is present and not obviously expired. */
function isSessionApparentlyValid(cookie: string | undefined): boolean {
  if (!cookie) return false;
  const exp = getSessionExpiry(cookie);
  if (exp === null) return true; // Can't decode? Pass through – server will verify.
  return exp * 1000 > Date.now();
}

// ── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const valid = isSessionApparentlyValid(sessionCookie);

  // 1. Protect gated routes
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!valid) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
      const response = NextResponse.redirect(loginUrl);
      // Evict expired cookie
      if (sessionCookie) response.cookies.delete('__session');
      return response;
    }
  }

  // 2. Redirect authenticated users away from auth pages
  if (AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (valid) {
      const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
      const safeNext = next.startsWith('/') ? next : '/dashboard';
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  return NextResponse.next();
}

// ── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  /*
   * Match all paths except:
   *  - Next.js internals (_next/static, _next/image)
   *  - Favicon
   *  - Public assets
   *  - API routes (verified individually by each handler)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/|images/).*)',
  ],
};
