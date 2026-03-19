/**
 * mealActions.ts  –  Server Actions for meal logging
 *
 * Uses `unstable_cache` (Next.js 15 stable) for user-specific cached reads,
 * scoped by userId so one user never sees another's data from the cache.
 *
 * After any mutation (add / delete meal, log weight) we call revalidateTag()
 * to immediately purge the relevant cache entries.
 */

'use server';

import { revalidateTag, unstable_cache as nextCache } from 'next/cache';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin.config';
import { addMeal, deleteMeal, getMealsByDate, getDailyStats } from '@/lib/repositories/mealRepository';
import { recordMealLog } from '@/lib/repositories/streakRepository';
import { addBronzeLog, promoteBronzeToSilver, refreshGoldForDate } from '@/lib/repositories/weightRepository';
import { mealsCacheTag, statsCacheTag, streakCacheTag, weightCacheTag } from './cacheTags';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuthenticatedUid(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('Not authenticated');
  const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  return decoded.uid;
}

// ── Cached data reads ─────────────────────────────────────────────────────────

/**
 * Get meals for a specific date with user-scoped caching.
 * Cache key includes uid and date so entries are user-isolated.
 */
export async function getCachedMealsForDate(uid: string, date: string) {
  return nextCache(
    () => getMealsByDate(uid, date),
    [mealsCacheTag(uid, date)],
    {
      tags: [mealsCacheTag(uid, date)],
      revalidate: 300, // 5 min background revalidation
    },
  )();
}

/**
 * Get daily nutrition stats with user-scoped caching.
 */
export async function getCachedDailyStats(uid: string, date: string) {
  return nextCache(
    () => getDailyStats(uid, date),
    [statsCacheTag(uid, date)],
    {
      tags: [statsCacheTag(uid, date)],
      revalidate: 300,
    },
  )();
}

// ── Mutations with cache invalidation ────────────────────────────────────────

export interface AddMealInput {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  qty: number;
  unit: string;
  source?: string;
  imageUrl?: string;
}

/**
 * Add a meal for today, update streak, and invalidate cache.
 */
export async function addMealAction(
  date: string,
  meal: AddMealInput,
  timezone = 'Europe/Rome',
): Promise<{ success: true; mealId: string } | { success: false; error: string }> {
  try {
    const uid = await getAuthenticatedUid();

    // Write meal (mealRepository returns { meal, dailyStats })
    const result = await addMeal(uid, date, meal) as { meal: { id: string }; dailyStats: unknown };
    const mealId = result.meal.id;

    // Update streak
    await recordMealLog(uid, timezone);

    // Invalidate caches for this date
    revalidateTag(mealsCacheTag(uid, date));
    revalidateTag(statsCacheTag(uid, date));
    revalidateTag(streakCacheTag(uid));

    return { success: true as const, mealId };
  } catch (err) {
    console.error('[addMealAction]', err);
    return { success: false as const, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Delete a meal and invalidate cache.
 */
export async function deleteMealAction(
  date: string,
  mealId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const uid = await getAuthenticatedUid();

    await deleteMeal(uid, date, mealId);

    revalidateTag(mealsCacheTag(uid, date));
    revalidateTag(statsCacheTag(uid, date));

    return { success: true as const };
  } catch (err) {
    console.error('[deleteMealAction]', err);
    return { success: false as const, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Weight logging with Medallion pipeline ────────────────────────────────────

export interface LogWeightInput {
  rawValue: number;
  rawUnit: 'kg' | 'lbs';
  notes?: string;
  timezone?: string;
  heightCm?: number;
  /** Target date YYYY-MM-DD. Defaults to today. Used for logging on past dates. */
  date?: string;
}

/**
 * Log a weight entry through the full Medallion pipeline:
 * Bronze → Silver → Gold refresh, then invalidate weight caches.
 */
export async function logWeightAction(
  input: LogWeightInput,
): Promise<{ success: true; weightKg: number } | { success: false; error: string }> {
  try {
    const uid = await getAuthenticatedUid();
    const tz = input.timezone ?? 'Europe/Rome';

    // Resolve target date: use provided date or today.
    // For past dates use noon UTC to stay unambiguously within that calendar day.
    const today = new Date().toISOString().split('T')[0];
    const targetDate = input.date && input.date <= today ? input.date : today;
    const createdAt = `${targetDate}T12:00:00.000Z`;

    // 🥉 Bronze: raw log
    // Omit optional fields when undefined – Firestore Admin SDK rejects
    // documents with explicit `undefined` values.
    const bronzeId = await addBronzeLog(uid, {
      rawValue: input.rawValue,
      rawUnit: input.rawUnit,
      source: 'manual',
      timezone: tz,
      createdAt, // honour past-date logging
      ...(input.notes !== undefined && { notes: input.notes }),
    });

    // 🥈 Silver: normalise + validate
    const silver = await promoteBronzeToSilver(
      uid,
      {
        id: bronzeId,
        uid,
        rawValue: input.rawValue,
        rawUnit: input.rawUnit,
        source: 'manual',
        timezone: tz,
        createdAt, // same date so Silver lands on the right day
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      input.heightCm,
    );

    if (!silver) {
      return { success: false as const, error: 'Weight value is out of valid range (20–400 kg)' };
    }

    // 🥇 Gold: refresh aggregates
    await refreshGoldForDate(uid, silver.date);

    // Invalidate weight cache
    revalidateTag(weightCacheTag(uid));

    return { success: true as const, weightKg: silver.weightKg };
  } catch (err) {
    console.error('[logWeightAction]', err);
    return { success: false as const, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
