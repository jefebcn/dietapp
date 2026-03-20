/**
 * waterRepository.ts – Daily water intake tracking
 *
 * Firestore structure:
 *   users/{uid}/water/{YYYY-MM-DD}  →  { totalMl: number, updatedAt: Timestamp }
 *
 * Goal: 2000 ml/day (8 × 250 ml glasses)
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const DAILY_GOAL_ML = 2000;

function waterDoc(uid: string, date: string) {
  return getFirestore().collection('users').doc(uid).collection('water').doc(date);
}

/** Returns today's total intake in ml. Returns 0 if no entry yet. */
export async function getWaterForDate(uid: string, date: string): Promise<number> {
  const snap = await waterDoc(uid, date).get();
  if (!snap.exists) return 0;
  return (snap.data() as { totalMl: number }).totalMl ?? 0;
}

/** Adds `ml` to today's intake (Firestore increment, atomic). Returns new total. */
export async function addWater(uid: string, date: string, ml: number): Promise<number> {
  const ref = waterDoc(uid, date);
  await ref.set(
    { totalMl: FieldValue.increment(ml), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  const snap = await ref.get();
  return (snap.data() as { totalMl: number }).totalMl ?? 0;
}

/** Resets daily water to 0. */
export async function resetWater(uid: string, date: string): Promise<void> {
  await waterDoc(uid, date).set(
    { totalMl: 0, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export { DAILY_GOAL_ML };
