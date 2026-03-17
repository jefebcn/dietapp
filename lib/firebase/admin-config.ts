/**
 * lib/firebase/admin-config.ts  –  Firebase Admin SDK (SERVER ONLY)
 *
 * TypeScript entry-point for the Firebase Admin SDK.
 * All heavy initialisation logic lives in the JS implementation
 * (`lib/firebase-admin.config.js`) which is already battle-tested and
 * handles hot-reload deduplication, lazy initialisation, and env-var
 * validation at runtime (not build time).
 *
 * This file re-exports the same getters under the canonical TS path
 * expected by the task spec: @/lib/firebase/admin-config.
 *
 * Required env vars (set in Vercel Dashboard → Settings → Environment Variables):
 *   FIREBASE_ADMIN_PROJECT_ID   – Firebase project ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL – Service account email
 *   FIREBASE_ADMIN_PRIVATE_KEY  – RSA private key (paste raw, Vercel handles \n)
 *
 * Usage (Server Components / API routes):
 *   import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-config';
 *
 *   const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
 *   const db      = getAdminDb();
 */

export {
  getAdminDb,
  getAdminAuth,
  getAdminStorage,
  default as getAdminApp,
} from '@/lib/firebase-admin.config';
