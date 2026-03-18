/**
 * streakRepository.ts  –  Streak Tracking Algorithm
 *
 * Rules:
 *   • Increment streak if user logs at least one meal on consecutive calendar days.
 *   • Reset streak to 0 if gap > 1 calendar day AND no Streak Freeze token available.
 *   • If a Streak Freeze token exists, consume it instead of resetting.
 *   • All date comparisons use the user's IANA timezone (stored in Firestore).
 *
 * Firestore structure:
 *   users/{uid}/streak/current        – StreakState
 *   users/{uid}/streak/freeze_tokens  – FreezeTokens
 *   users/{uid}/streak/history/{date} – StreakDayLog (one doc per logged day)
 */

import { getAdminDb } from '@/lib/firebase-admin.config';
import { FieldValue } from 'firebase-admin/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;   // YYYY-MM-DD in user's timezone
  timezone: string;             // IANA (e.g. 'Europe/Rome')
  updatedAt: string;
}

export interface FreezeTokens {
  available: number;
  totalEarned: number;
  lastUsedAt: string | null;
}

export interface StreakDayLog {
  date: string;
  mealCount: number;
  froze: boolean;               // true if this day was covered by a freeze
  loggedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns today's date string (YYYY-MM-DD) in the given IANA timezone.
 */
function todayInTimezone(tz: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz }); // 'en-CA' → YYYY-MM-DD
}

/**
 * Returns the absolute difference in calendar days between two YYYY-MM-DD strings.
 */
function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00Z');
  const db = new Date(b + 'T12:00:00Z');
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}

function isoNow(): string {
  return new Date().toISOString();
}

// ── Streak read ───────────────────────────────────────────────────────────────

/** Fetch the current streak state for a user. */
export async function getStreakState(uid: string): Promise<StreakState> {
  const db = getAdminDb();
  const doc = await db.doc(`users/${uid}/streak/current`).get();
  if (doc.exists) return doc.data() as StreakState;
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastLogDate: null,
    timezone: 'Europe/Rome',
    updatedAt: isoNow(),
  };
}

/** Fetch the freeze token balance for a user. */
export async function getFreezeTokens(uid: string): Promise<FreezeTokens> {
  const db = getAdminDb();
  const doc = await db.doc(`users/${uid}/streak/freeze_tokens`).get();
  if (doc.exists) return doc.data() as FreezeTokens;
  return { available: 0, totalEarned: 0, lastUsedAt: null };
}

// ── Core algorithm ────────────────────────────────────────────────────────────

/**
 * Called after a user logs any meal on a given date.
 * Idempotent: calling multiple times for the same day is safe (no double-increment).
 *
 * Algorithm:
 *   1. Get current state and today's date in the user's timezone.
 *   2. If today == lastLogDate → already logged today, no change needed.
 *   3. If gap == 1 → consecutive day → increment.
 *   4. If gap > 1:
 *        a. gap - 1 missing days ≤ freezeTokens available → consume tokens, increment.
 *        b. else → reset streak to 1.
 *   5. If lastLogDate is null → first ever log → streak = 1.
 */
export async function recordMealLog(uid: string, timezone?: string): Promise<StreakState> {
  const db = getAdminDb();
  const stateRef = db.doc(`users/${uid}/streak/current`);
  const freezeRef = db.doc(`users/${uid}/streak/freeze_tokens`);

  const [stateDoc, freezeDoc] = await Promise.all([stateRef.get(), freezeRef.get()]);

  const state: StreakState = stateDoc.exists
    ? (stateDoc.data() as StreakState)
    : {
        currentStreak: 0,
        longestStreak: 0,
        lastLogDate: null,
        timezone: timezone ?? 'Europe/Rome',
        updatedAt: isoNow(),
      };

  const freeze: FreezeTokens = freezeDoc.exists
    ? (freezeDoc.data() as FreezeTokens)
    : { available: 0, totalEarned: 0, lastUsedAt: null };

  // Use stored timezone, falling back to provided or default
  const tz = state.timezone ?? timezone ?? 'Europe/Rome';
  const today = todayInTimezone(tz);

  // ── Idempotency check ─────────────────────────────────────────────────────
  if (state.lastLogDate === today) {
    return state; // Already counted today, no-op
  }

  // ── Day history entry ─────────────────────────────────────────────────────
  const dayLogRef = db.doc(`users/${uid}/streak/history/${today}`);
  const dayLogExists = (await dayLogRef.get()).exists;

  let newStreak = state.currentStreak;
  let freezesUsed = 0;
  let froze = false;

  if (state.lastLogDate === null) {
    // First ever log
    newStreak = 1;
  } else {
    const gap = dayDiff(today, state.lastLogDate);

    if (gap === 1) {
      // Perfect consecutive day
      newStreak = state.currentStreak + 1;
    } else if (gap > 1) {
      const missingDays = gap - 1;

      if (freeze.available >= missingDays) {
        // Consume freeze tokens to bridge the gap
        freezesUsed = missingDays;
        newStreak = state.currentStreak + 1;
        froze = true;
      } else {
        // Not enough freezes → reset
        newStreak = 1;
      }
    }
  }

  const newLongest = Math.max(state.longestStreak, newStreak);
  const now = isoNow();

  const updatedState: StreakState = {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastLogDate: today,
    timezone: tz,
    updatedAt: now,
  };

  // ── Batch write ───────────────────────────────────────────────────────────
  const batch = db.batch();

  batch.set(stateRef, updatedState);

  if (freezesUsed > 0) {
    batch.set(
      freezeRef,
      {
        available: FieldValue.increment(-freezesUsed),
        lastUsedAt: now,
      },
      { merge: true },
    );
  }

  if (!dayLogExists) {
    const dayLog: StreakDayLog = {
      date: today,
      mealCount: 1,
      froze,
      loggedAt: now,
    };
    batch.set(dayLogRef, dayLog);
  } else {
    batch.update(dayLogRef, { mealCount: FieldValue.increment(1) });
  }

  await batch.commit();
  return updatedState;
}

// ── Freeze token management ───────────────────────────────────────────────────

/**
 * Award freeze tokens to a user (e.g. from league rewards or weekly goals).
 */
export async function awardFreezeTokens(uid: string, count: number): Promise<FreezeTokens> {
  const db = getAdminDb();
  const ref = db.doc(`users/${uid}/streak/freeze_tokens`);
  await ref.set(
    {
      available: FieldValue.increment(count),
      totalEarned: FieldValue.increment(count),
    },
    { merge: true },
  );
  const updated = await ref.get();
  return updated.data() as FreezeTokens;
}

/**
 * Update stored IANA timezone for a user (call when user changes their timezone preference).
 */
export async function updateStreakTimezone(uid: string, timezone: string): Promise<void> {
  const db = getAdminDb();
  await db.doc(`users/${uid}/streak/current`).set(
    { timezone, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}
