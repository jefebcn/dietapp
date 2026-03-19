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
  /** Meal category: 'colazione' | 'pranzo' | 'cena' | 'spuntino' */
  mealType?: string;
}

// ── Nutrition search (server-side proxy to keep API key hidden) ───────────────

export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string | null;
  nutrients: { kcal: number; protein: number; carbs: number; fat: number };
}

/**
 * Search the nutrition database for foods matching a query.
 * Runs server-side to keep API credentials hidden from the client.
 */
export async function searchFoodAction(
  query: string,
): Promise<{ success: true; results: FoodSearchResult[] } | { success: false; error: string }> {
  try {
    // Auth check — ensure caller is logged in
    await getAuthenticatedUid();

    if (!query || query.trim().length < 2) {
      return { success: true as const, results: [] };
    }

    const appId  = process.env.EDAMAM_APP_ID;
    const appKey = process.env.EDAMAM_APP_KEY;
    const baseUrl = process.env.NUTRITION_API_BASE_URL ?? 'https://api.edamam.com/api/food-database/v2';

    let results: FoodSearchResult[] = [];

    if (appId && appKey) {
      // Edamam
      const url = new URL(`${baseUrl}/parser`);
      url.searchParams.set('app_id', appId);
      url.searchParams.set('app_key', appKey);
      url.searchParams.set('ingr', query.trim());
      url.searchParams.set('nutrition-type', 'logging');

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600, tags: ['nutrition'] },
      });

      if (res.ok) {
        const data = await res.json() as { hints?: Array<{ food: { foodId: string; label: string; brand?: string; nutrients?: Record<string, number> } }> };
        results = (data.hints ?? []).slice(0, 12).map((hint) => {
          const food = hint.food;
          const n = food.nutrients ?? {};
          return {
            id: food.foodId,
            name: food.label,
            brand: food.brand ?? null,
            nutrients: {
              kcal:    Math.round(n.ENERC_KCAL ?? 0),
              protein: Math.round((n.PROCNT ?? 0) * 10) / 10,
              carbs:   Math.round((n.CHOCDF ?? 0) * 10) / 10,
              fat:     Math.round((n.FAT ?? 0) * 10) / 10,
            },
          };
        });
      }
    } else {
      // Open Food Facts fallback
      const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
      url.searchParams.set('search_terms', query.trim());
      url.searchParams.set('search_simple', '1');
      url.searchParams.set('action', 'process');
      url.searchParams.set('json', '1');
      url.searchParams.set('page_size', '12');
      url.searchParams.set('fields', 'code,product_name,brands,nutriments');

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'NutriTrack/2.0 (nutritrack.it)' },
        next: { revalidate: 3600, tags: ['nutrition'] },
      });

      if (res.ok) {
        const data = await res.json() as { products?: Array<{ code: string; product_name?: string; brands?: string; nutriments?: Record<string, number> }> };
        results = (data.products ?? [])
          .filter((p) => !!p.product_name)
          .slice(0, 12)
          .map((p) => {
            const n = p.nutriments ?? {};
            return {
              id: p.code,
              name: p.product_name!,
              brand: p.brands ?? null,
              nutrients: {
                kcal:    Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ?? 0) / 4.184),
                protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
                carbs:   Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
                fat:     Math.round((n.fat_100g ?? 0) * 10) / 10,
              },
            };
          });
      }
    }

    return { success: true as const, results };
  } catch (err) {
    console.error('[searchFoodAction]', err);
    return { success: false as const, error: 'Ricerca non disponibile. Inserisci manualmente.' };
  }
}

/**
 * Copy all meals from a source date to a target date.
 */
export async function copyDayMealsAction(
  sourceDate: string,
  targetDate: string,
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const uid = await getAuthenticatedUid();
    const { copyDayMeals } = await import('@/lib/repositories/mealRepository');
    const stats = await copyDayMeals(uid, sourceDate, targetDate) as { mealCount: number };
    revalidateTag(mealsCacheTag(uid, targetDate));
    revalidateTag(statsCacheTag(uid, targetDate));
    return { success: true as const, count: stats.mealCount };
  } catch (err) {
    console.error('[copyDayMealsAction]', err);
    return { success: false as const, error: err instanceof Error ? err.message : 'Unknown error' };
  }
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
