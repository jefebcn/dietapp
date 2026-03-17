/**
 * Firebase Client SDK – BROWSER SAFE
 *
 * Uses lazy initialisation: the SDK is NOT initialised at import time.
 * Call getClientAuth() / getClientDb() inside event handlers or effects,
 * never at module level, so SSR prerendering during `next build` does not
 * attempt to initialise Firebase with missing env vars.
 *
 * NEXT_PUBLIC_* vars must be set in Vercel Dashboard → Settings → Env Vars
 * before deploying – they are baked into the client bundle at build time.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app  = null;
let _auth = null;
let _db   = null;

function getClientApp() {
  if (_app) return _app;
  _app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  return _app;
}

/** Returns the Firebase Auth instance (lazy, browser-only safe) */
export function getClientAuth() {
  if (!_auth) _auth = getAuth(getClientApp());
  return _auth;
}

/** Returns the Firestore instance (lazy, browser-only safe) */
export function getClientDb() {
  if (!_db) _db = getFirestore(getClientApp());
  return _db;
}

/** Pre-configured Google provider (stateless, safe to create eagerly) */
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
