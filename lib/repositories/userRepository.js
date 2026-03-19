/**
 * User Repository  –  SERVER-SIDE DATA LAYER
 *
 * Handles all Firestore operations for user profiles and preferences.
 *
 * Firestore schema:
 *   users/{uid}
 *   └── { uid, email, name, role, goals, createdAt, updatedAt, ... }
 *
 * @module lib/repositories/userRepository
 */

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin.config';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// ── Collection helpers ─────────────────────────────────────────────────────
const usersCol = () => getAdminDb().collection('users');
const userDoc = (uid) => usersCol().doc(uid);

// ── Helpers ────────────────────────────────────────────────────────────────
function docToUser(snap) {
  if (!snap.exists) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    ...data,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? null,
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt ?? null,
  };
}

// ── Read Operations ────────────────────────────────────────────────────────

/**
 * Fetches a user profile by UID.
 *
 * @param {string} uid
 * @returns {Promise<UserProfile|null>}
 */
export async function getUserById(uid) {
  const snap = await userDoc(uid).get();
  return docToUser(snap);
}

/**
 * Fetches a user profile by email address.
 *
 * @param {string} email
 * @returns {Promise<UserProfile|null>}
 */
export async function getUserByEmail(email) {
  const snapshot = await usersCol().where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  return docToUser(snapshot.docs[0]);
}

// ── Write Operations ───────────────────────────────────────────────────────

/**
 * Creates a new user profile document.
 * Called after successful Firebase Auth registration.
 *
 * @param {string} uid
 * @param {NewUserInput} userData
 * @returns {Promise<UserProfile>}
 */
export async function createUser(uid, userData) {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@nutritrack.it';

  const payload = {
    uid,
    email: userData.email,
    name: userData.name ?? '',
    role: userData.email === adminEmail ? 'admin' : 'user',
    goals: {
      kcal: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await userDoc(uid).set(payload);

  // Set custom claims for role-based access in Firebase Auth
  await getAdminAuth().setCustomUserClaims(uid, { role: payload.role });

  const snap = await userDoc(uid).get();
  return docToUser(snap);
}

/**
 * Updates user profile fields (partial update).
 *
 * @param {string} uid
 * @param {Partial<UserProfile>} updates
 * @returns {Promise<UserProfile>}
 */
export async function updateUser(uid, updates) {
  const { uid: _uid, createdAt, role, ...safeUpdates } = updates;

  await userDoc(uid).update({
    ...safeUpdates,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snap = await userDoc(uid).get();
  return docToUser(snap);
}

/**
 * Updates a user's nutritional goals.
 *
 * @param {string} uid
 * @param {NutritionalGoals} goals
 * @returns {Promise<UserProfile>}
 */
export async function updateUserGoals(uid, goals) {
  await userDoc(uid).update({
    goals: {
      kcal: Number(goals.kcal) || 2000,
      protein: Number(goals.protein) || 150,
      carbs: Number(goals.carbs) || 200,
      fat: Number(goals.fat) || 65,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snap = await userDoc(uid).get();
  return docToUser(snap);
}

/**
 * Saves an FCM push notification token for the user.
 *
 * @param {string} uid
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function saveFcmToken(uid, token) {
  await userDoc(uid).update({
    fcmTokens: FieldValue.arrayUnion(token),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Ensures a user document exists in Firestore, creating it from Firebase Auth
 * data if missing. Safe to call on every authenticated request — it's a no-op
 * when the document already exists.
 *
 * This handles users who registered on a previous version of the app that may
 * have stored data differently, or Google/Apple SSO users whose Firestore
 * document was never explicitly created.
 *
 * @param {string} uid
 * @returns {Promise<UserProfile>}
 */
export async function upsertUserFromAuth(uid) {
  const snap = await userDoc(uid).get();

  // Document already exists — return it, but ensure goals field is present
  if (snap.exists) {
    const data = snap.data();
    if (!data.goals) {
      // Old document missing goals → patch it with defaults
      await userDoc(uid).update({
        goals: { kcal: 2000, protein: 150, carbs: 200, fat: 65 },
        updatedAt: FieldValue.serverTimestamp(),
      });
      const patched = await userDoc(uid).get();
      return docToUser(patched);
    }
    return docToUser(snap);
  }

  // Document missing → fetch from Firebase Auth and create it
  const authUser = await getAdminAuth().getUser(uid);
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@nutritrack.it';
  const email = authUser.email ?? '';
  const name = authUser.displayName ?? email.split('@')[0] ?? '';

  const payload = {
    uid,
    email,
    name,
    role: email === adminEmail ? 'admin' : 'user',
    goals: { kcal: 2000, protein: 150, carbs: 200, fat: 65 },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    migratedFromAuth: true,
  };

  await userDoc(uid).set(payload);
  await getAdminAuth().setCustomUserClaims(uid, { role: payload.role });

  const created = await userDoc(uid).get();
  return docToUser(created);
}

/**
 * Verifies a Firebase ID token and returns the decoded claims.
 * Use this in API route middleware to authenticate requests.
 *
 * @param {string} idToken
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export async function verifyIdToken(idToken) {
  return getAdminAuth().verifyIdToken(idToken);
}

// ── JSDoc type definitions ─────────────────────────────────────────────────

/**
 * @typedef {Object} UserProfile
 * @property {string}          uid
 * @property {string}          email
 * @property {string}          name
 * @property {'user'|'admin'}  role
 * @property {NutritionalGoals} goals
 * @property {number}          [heightCm]  – user height in centimetres (optional)
 * @property {string|null}     createdAt  – ISO date string
 * @property {string|null}     updatedAt  – ISO date string
 */

/**
 * @typedef {Object} NutritionalGoals
 * @property {number} kcal
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 */

/**
 * @typedef {Object} NewUserInput
 * @property {string} email
 * @property {string} [name]
 */
