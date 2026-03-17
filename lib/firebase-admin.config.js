/**
 * Firebase Admin SDK – SERVER ONLY
 *
 * This module initialises the firebase-admin SDK using credentials stored
 * exclusively in server-side environment variables (no NEXT_PUBLIC_ prefix).
 * It is safe to import in:
 *   - Next.js API Route Handlers  (/app/api/**/route.js)
 *   - Server Components           (default in /app directory)
 *   - Server Actions              ('use server')
 *
 * Never import this file in a Client Component ('use client') or in any
 * module that may be bundled for the browser.
 *
 * Required environment variables (set in Vercel Dashboard / .env.local):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (escape newlines as \n in .env files)
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// ── Validate required environment variables ────────────────────────────────
const requiredEnvVars = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `[firebase-admin] Missing required environment variable: ${envVar}\n` +
        'Ensure all FIREBASE_ADMIN_* vars are set in your Vercel project settings.'
    );
  }
}

// ── Build service account credentials ─────────────────────────────────────
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // Vercel env vars store \n as a literal two-char sequence – restore real newlines
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// ── Initialise (guard against duplicate hot-reload initialisations) ─────────
function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`,
  });
}

const adminApp = getAdminApp();

// ── Exported service instances ─────────────────────────────────────────────
/**
 * Firestore instance for server-side database operations.
 * Use via the repository layer (/lib/repositories/*).
 */
export const adminDb = getFirestore(adminApp);

/**
 * Firebase Auth instance for server-side token verification,
 * custom claims, and user management.
 */
export const adminAuth = getAuth(adminApp);

/**
 * Firebase Storage instance for server-side signed URL generation
 * and direct file operations.
 */
export const adminStorage = getStorage(adminApp);

export default adminApp;
