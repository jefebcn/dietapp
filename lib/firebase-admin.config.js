/**
 * Firebase Admin SDK – SERVER ONLY
 *
 * Uses lazy initialization: the SDK is NOT initialised at import time.
 * Instead, each exported getter function initialises on first call.
 * This prevents build-time crashes when env vars are only available
 * at runtime (Vercel serverless function execution).
 *
 * Required environment variables (Vercel Dashboard → Settings → Env Vars):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (paste the raw key – Vercel handles newlines)
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// ── Lazy singleton ─────────────────────────────────────────────────────────

let _app = null;

function getAdminApp() {
  if (_app) return _app;

  // Validate env vars only when first called (runtime, not build time)
  const projectId  = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebase-admin] Missing env vars: FIREBASE_ADMIN_PROJECT_ID, ' +
      'FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY. ' +
      'Set them in Vercel Dashboard → Settings → Environment Variables.'
    );
  }

  // Guard against duplicate initialisation in Next.js hot-reload
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  _app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Vercel stores \n as literal two-char sequence in env vars
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${projectId}.appspot.com`,
  });

  return _app;
}

// ── Exported getters (lazy – safe to import at build time) ─────────────────
// Each function returns the Firebase Admin service instance,
// initialising the SDK on the very first call (runtime, not build time).

/** Returns the Firestore Admin instance */
export function getAdminDb() {
  return getFirestore(getAdminApp());
}

/** Returns the Firebase Auth Admin instance */
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

/** Returns the Firebase Storage Admin instance */
export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export default getAdminApp;
