/**
 * middleware.ts  –  NutriTrack Session Proxy
 *
 * Acts as the Edge-Runtime session gateway: every request passes through here
 * BEFORE reaching any page or API route.
 *
 * Strategy:
 *   1. Lightweight JWT expiry check (Edge-safe, pure atob – no firebase-admin).
 *      firebase-admin uses Node.js crypto; it cannot run in the Edge Runtime.
 *   2. Full cryptographic verification happens server-side (Node.js Runtime) in:
 *        • Server Components  → getAdminAuth().verifySessionCookie(cookie, true)
 *        • API route handlers → same
 *
 * Session cookie: __session
 *   Minted by  POST /api/login        (7-day HttpOnly cookie)
 *   Refreshed by AuthProvider         (onIdTokenChanged → POST /api/login hourly)
 *   Cleared by  DELETE /api/auth/session  (on sign-out)
 *
 * Protected routes:  /dashboard  /diary  /weight  /settings  /profile
 * Auth-only routes:  /login  /register  (redirect → /dashboard if already authed)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Route configuration ───────────────────────────────────────────────────────

const PROTECTED = ['/dashboard', '/diary', '/weight', '/settings', '/profile'];
const AUTH_ONLY = ['/login', '/register'];

// ── JWT payload decoder (Edge-safe) ──────────────────────────────────────────

/**
 * Decodes the payload of a Firebase session cookie JWT.
 * Does NOT verify the signature – signature verification requires firebase-admin
 * (Node.js crypto) and is handled in Server Components / API routes.
 *
 * Returns null if the cookie cannot be decoded (treated as "let pass through"
 * so server-side verification can fail it properly).
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Pad if necessary
    const padded = base64 + '=='.slice((base64.length + 3) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Lightweight session validity check:
 *   • Cookie must be present
 *   • If decodable: must not be expired (exp * 1000 > now)
 *   • If not decodable: pass through (server will do full verification)
 */
function isSessionApparentlyValid(cookie: string | undefined): boolean {
  if (!cookie || cookie.trim() === '') return false;
  const payload = decodeJwtPayload(cookie);
  if (payload === null) return true; // undecipherable → let server handle it
  const exp = payload['exp'];
  if (typeof exp !== 'number') return true; // no exp claim → let server handle it
  return exp * 1000 > Date.now();
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const sessionValid  = isSessionApparentlyValid(sessionCookie);

  // ── 1. Guard protected routes ─────────────────────────────────────────────
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!sessionValid) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      // Preserve the destination for post-login redirect
      url.search = `?next=${encodeURIComponent(pathname)}`;
      const response = NextResponse.redirect(url);
      // Evict the stale/invalid cookie
      if (sessionCookie) {
        response.cookies.set('__session', '', {
          maxAge: 0,
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
        });
      }
      return response;
    }
  }

  // ── 2. Redirect authenticated users away from auth pages ──────────────────
  if (AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    if (sessionValid) {
      // Honor ?next= param, but only for same-origin paths
      const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
      const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  // ── 3. Pass through ───────────────────────────────────────────────────────
  return NextResponse.next();
}

// ── Route matcher ─────────────────────────────────────────────────────────────

export const config = {
  /**
   * Match all routes EXCEPT:
   *   _next/static   – compiled JS/CSS bundles
   *   _next/image    – next/image optimiser endpoint
   *   favicon.ico    – browser favicon
   *   manifest.json  – PWA manifest
   *   icons/         – PWA icon assets
   *   images/        – public image assets
   *
   * API routes (/api/*) are intentionally matched so the middleware can
   * inspect them, but the guard logic only applies to page routes above.
   * Each API handler performs its own session verification via firebase-admin.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/|images/|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)',
  ],
};
