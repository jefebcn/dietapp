/**
 * /api/meals
 *
 * GET  /api/meals?date=YYYY-MM-DD   – fetch meals + daily stats for a date
 * POST /api/meals                    – add a new meal
 */

import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/repositories/userRepository';
import {
  getMealsByDate,
  getDailyStats,
  addMeal,
} from '@/lib/repositories/mealRepository';

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

export async function GET(request) {
  const uid = await getUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = new URL(request.url).searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Valid "date" query param (YYYY-MM-DD) required.' }, { status: 400 });
  }

  const [meals, stats] = await Promise.all([
    getMealsByDate(uid, date),
    getDailyStats(uid, date),
  ]);

  return NextResponse.json(
    { meals, stats: stats ?? { date, totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request) {
  const uid = await getUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { date, ...mealData } = body;
  if (!date || !mealData.name) {
    return NextResponse.json({ error: '"date" and "name" are required.' }, { status: 400 });
  }

  const result = await addMeal(uid, date, mealData);
  return NextResponse.json(result, { status: 201 });
}
