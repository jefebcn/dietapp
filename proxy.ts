/**
 * proxy.ts  –  NutriTrack Session Proxy
 *
 * This file contains the full session-gate logic for the Next.js Edge Runtime.
 * It is re-exported by middleware.ts (the required Next.js entry point).
 *
 * Strategy
 * ────────
 * The Edge Runtime cannot use firebase-admin (Node.js crypto). Instead we do
 * a two-layer verification:
 *
 *   Layer 1 (here, Edge)  – Lightweight JWT expiry check via pure atob().
 *     Prevents clearly-expired sessions from hitting any server work at all.
 *     Does NOT verify the cryptographic signature.
 *
 *   Layer 2 (Node.js runtime, per-route)  – Full signature verification via
 *     getAdminAuth().verifySessionCookie(cookie, true) in Server Components
 *     and API route handlers.
 *
 * Session cookie: __session
 *   Minted   → POST /api/login           (7-day HttpOnly, firebase-admin)
 *   Refreshed → AuthProvider             (onIdTokenChanged → /api/login hourly)
 *   Cleared   → DELETE /api/auth/session (on sign-out)
 *
 * Protected routes : /dashboard  /diary  /weight  /settings  /profile
 * Auth-only routes : /login  /register  (redirect away if already logged in)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Route tables ─────────────────────────────────────────────────────────────

const PROTECTED = ['/dashboard', '/diary', '/weight', '/settings', '/profile'];
const AUTH_ONLY = ['/login', '/register'];

// ── Edge-safe JWT decoder ─────────────────────────────────────────────────────

/**
 * Decodes the JSON payload from a Firebase session cookie JWT.
 * Uses only built-in browser APIs (atob) – safe for the Edge Runtime.
 *
 * Returns null when decoding fails; the server-side layer will then
 * reject the cookie with a proper cryptographic error.
 */
function decodePayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    // Base64url → Base64 (replace URL-safe chars, pad to multiple of 4)
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Lightweight session check for the Edge Runtime:
 *   • False if no cookie is present.
 *   • False if exp claim exists and has passed.
 *   • True  if exp is in the future, or if the payload cannot be decoded
 *     (undecipherable tokens are passed to the server for full verification).
 */
function isSessionApparentlyValid(cookie: string | undefined): boolean {
  if (!cookie || cookie.trim() === '') return false;
  const payload = decodePayload(cookie);
  if (payload === null) return true; // let the server verify
  const exp = payload['exp'];
  if (typeof exp !== 'number') return true; // no exp claim → let server decide
  return exp * 1000 > Date.now();
}

// ── Middleware (exported for middleware.ts to re-export) ──────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const valid = isSessionApparentlyValid(sessionCookie);

  // ── Guard protected pages ─────────────────────────────────────────────────
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!valid) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(pathname)}`;
      const res = NextResponse.redirect(url);
      // Evict the stale cookie so the browser won't send it again immediately
      if (sessionCookie) {
        res.cookies.set('__session', '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax' });
      }
      return res;
    }
  }

  // ── Redirect away from auth pages when session is live ───────────────────
  if (AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    if (valid) {
      const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
      // Only allow same-origin paths (prevent open redirect)
      const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      return NextResponse.redirect(new URL(safe, request.url));
    }
  }

  return NextResponse.next();
}

// ── Route matcher config (re-exported alongside middleware) ───────────────────

export const config = {
  /**
   * Match everything EXCEPT:
   *   _next/static|image  – internal Next.js assets
   *   favicon.ico         – browser favicon
   *   manifest.json       – PWA manifest
   *   icons/ images/      – public asset directories
   *   *.png|jpg|svg|webp  – static image files (avoids running on /sprinty.png etc.)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/|images/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)',
  ],
};
