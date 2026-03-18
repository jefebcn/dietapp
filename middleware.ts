/**
 * middleware.ts  –  Next.js Edge Runtime entry point
 *
 * Re-exports the full session proxy logic from proxy.ts.
 * Keeping the implementation in proxy.ts makes it independently testable
 * and follows the "proxy convention" for session-cookie middleware.
 *
 * The firebase-admin __session cookie is verified in two stages:
 *   1. Edge (here via proxy.ts) – lightweight JWT expiry check (atob, no crypto).
 *   2. Node.js runtime           – full cryptographic check per API/page route
 *      via getAdminAuth().verifySessionCookie(cookie, true).
 */

export { middleware, config } from './proxy';
