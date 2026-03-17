/**
 * /api/meals
 *
 * GET  /api/meals?date=YYYY-MM-DD   – fetch meals + daily stats for a date
 * POST /api/meals                    – add a new meal (Zod-validated)
 *
 * POST body is validated with Zod before writing to Firestore to ensure
 * clean, type-safe data at the system boundary.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIdToken } from '@/lib/repositories/userRepository';
import {
  getMealsByDate,
  getDailyStats,
  addMeal,
} from '@/lib/repositories/mealRepository';

// ── Zod schema for adding a meal ─────────────────────────────────────────────

const addMealSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  name: z
    .string()
    .min(1, 'name is required')
    .max(200, 'name must be at most 200 characters')
    .trim(),
  kcal: z
    .number({ invalid_type_error: 'kcal must be a number' })
    .nonnegative('kcal must be ≥ 0'),
  protein: z
    .number({ invalid_type_error: 'protein must be a number' })
    .nonnegative('protein must be ≥ 0')
    .default(0),
  carbs: z
    .number({ invalid_type_error: 'carbs must be a number' })
    .nonnegative('carbs must be ≥ 0')
    .default(0),
  fat: z
    .number({ invalid_type_error: 'fat must be a number' })
    .nonnegative('fat must be ≥ 0')
    .default(0),
  qty: z
    .number({ invalid_type_error: 'qty must be a number' })
    .positive('qty must be > 0')
    .default(100),
  unit: z
    .string()
    .max(20, 'unit must be at most 20 characters')
    .default('g'),
  source: z.string().max(50).optional(),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional().or(z.literal('')),
});

// ── Auth helper ──────────────────────────────────────────────────────────────

async function getUid(request) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    const decoded = await verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ── GET /api/meals?date=YYYY-MM-DD ───────────────────────────────────────────

export async function GET(request) {
  const uid = await getUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = new URL(request.url).searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Valid "date" query param (YYYY-MM-DD) required.' },
      { status: 400 }
    );
  }

  const [meals, stats] = await Promise.all([
    getMealsByDate(uid, date),
    getDailyStats(uid, date),
  ]);

  return NextResponse.json(
    {
      meals,
      stats: stats ?? {
        date,
        totalKcal: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// ── POST /api/meals ──────────────────────────────────────────────────────────

export async function POST(request) {
  const uid = await getUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  // Validate with Zod
  const parsed = addMealSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return NextResponse.json(
      { error: 'Validation failed.', details: errors },
      { status: 422 }
    );
  }

  const { date, ...mealData } = parsed.data;

  try {
    const result = await addMeal(uid, date, mealData);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[POST /api/meals]', err);
    return NextResponse.json({ error: 'Failed to add meal.' }, { status: 500 });
  }
}
