/**
 * Firebase Client SDK – BROWSER SAFE
 *
 * Initialises the Firebase JS SDK for client-side usage:
 *   - Authentication (email/password, Google OAuth)
 *   - Real-time listeners (onSnapshot, onAuthStateChanged)
 *
 * All credentials exposed here are NEXT_PUBLIC_ and are intentionally
 * visible to the browser. Firestore/Storage security rules enforce access
 * control – never rely solely on hiding the API key.
 *
 * Usage:
 *   import { auth, db } from '@/lib/firebase-client.config';
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

// ── Firebase project configuration ────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── Singleton initialisation ───────────────────────────────────────────────
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// ── Service exports ────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');

// ── Local emulator support (development only) ─────────────────────────────
if (
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export default app;
