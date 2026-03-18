/**
 * middleware.ts  –  Next.js Edge Runtime entry point
 *
 * Re-exports the session proxy logic from proxy.ts as `middleware`
 * (the name Next.js requires for Edge middleware).
 *
 * The `proxy` function in proxy.ts is the canonical implementation;
 * this file exists solely to satisfy Next.js's naming convention.
 *
 * The firebase-admin __session cookie is verified in two stages:
 *   1. Edge (here via proxy.ts) – lightweight JWT expiry check (atob, no crypto).
 *   2. Node.js runtime           – full cryptographic check per API/page route
 *      via getAdminAuth().verifySessionCookie(cookie, true).
 */

export { proxy as middleware, config } from './proxy';
