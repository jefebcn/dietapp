/**
 * /api/meals/[mealId]
 *
 * PATCH  /api/meals/:mealId?date=YYYY-MM-DD  – update a meal
 * DELETE /api/meals/:mealId?date=YYYY-MM-DD  – delete a meal
 */

import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/repositories/userRepository';
import { updateMeal, deleteMeal } from '@/lib/repositories/mealRepository';

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

export async function PATCH(request, { params }) {
  const uid = await getUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = new URL(request.url).searchParams.get('date');
  if (!date) return NextResponse.json({ error: '"date" query param required.' }, { status: 400 });

  let updates;
  try { updates = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const result = await updateMeal(uid, date, params.mealId, updates);
  return NextResponse.json(result);
}

export async function DELETE(request, { params }) {
  const uid = await getUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = new URL(request.url).searchParams.get('date');
  if (!date) return NextResponse.json({ error: '"date" query param required.' }, { status: 400 });

  const dailyStats = await deleteMeal(uid, date, params.mealId);
  return NextResponse.json({ dailyStats });
}
