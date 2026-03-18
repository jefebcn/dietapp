/**
 * Firebase Admin SDK – SERVER ONLY
 *
 * Lazy initialization: the SDK is NOT initialised at import time.
 * Each exported getter initialises on first call (runtime, not build time),
 * preventing build-time crashes when env vars are only available on Vercel.
 *
 * Supported credential formats (checked in order):
 *
 *   1. FIREBASE_SERVICE_ACCOUNT  (recommended for Vercel)
 *      Set this to the FULL JSON content of your service account key file.
 *      In Vercel Dashboard → Settings → Environment Variables, paste the
 *      entire JSON string as the value. Firebase Admin will parse it directly.
 *
 *   2. Individual vars (alternative):
 *        FIREBASE_ADMIN_PROJECT_ID
 *        FIREBASE_ADMIN_CLIENT_EMAIL
 *        FIREBASE_ADMIN_PRIVATE_KEY  (paste raw key – Vercel handles newlines)
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth }      from 'firebase-admin/auth';
import { getStorage }   from 'firebase-admin/storage';

// ── Lazy singleton ────────────────────────────────────────────────────────────

let _app = null;

function getAdminApp() {
  if (_app) return _app;

  // Avoid duplicate initialisation during Next.js hot-reload
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  let credential;
  let projectId;

  // ── Option 1: Full JSON service account key (preferred on Vercel) ─────────
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    let parsed;
    try {
      parsed = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error(
        '[firebase-admin] FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON. ' +
        'Paste the entire service account JSON as the env var value.'
      );
    }
    credential = cert(parsed);
    projectId  = parsed.project_id;

  // ── Option 2: Individual env vars ─────────────────────────────────────────
  } else {
    const pid   = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const key   = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!pid || !email || !key) {
      throw new Error(
        '[firebase-admin] Missing credentials. Provide either:\n' +
        '  • FIREBASE_SERVICE_ACCOUNT  (full JSON key)\n' +
        '  OR all three of:\n' +
        '  • FIREBASE_ADMIN_PROJECT_ID\n' +
        '  • FIREBASE_ADMIN_CLIENT_EMAIL\n' +
        '  • FIREBASE_ADMIN_PRIVATE_KEY\n' +
        'Set them in Vercel Dashboard → Settings → Environment Variables.'
      );
    }

    credential = cert({
      projectId:    pid,
      clientEmail:  email,
      // Vercel stores literal "\\n" for newlines in env vars
      privateKey:   key.replace(/\\n/g, '\n'),
    });
    projectId = pid;
  }

  _app = initializeApp({
    credential,
    storageBucket: `${projectId}.appspot.com`,
  });

  return _app;
}

// ── Exported getters (lazy – safe to import at module scope) ─────────────────

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
