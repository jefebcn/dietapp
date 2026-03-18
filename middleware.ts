/**
 * middleware.ts  –  NutriTrack Session Guard (Node.js Runtime)
 *
 * Runs on the Node.js runtime (not Edge) so we can use firebase-admin's
 * full cryptographic session-cookie verification directly in middleware,
 * eliminating the two-layer approach.
 *
 * Pattern mirrors the Next.js 16 / next-firebase-auth-edge recommendation:
 *   • Middleware runs in Node.js runtime
 *   • Full verifySessionCookie() on every protected request
 *   • Auth-only routes redirect away if a valid session exists
 */

export { middleware, config } from './proxy';
