/**
 * GET /api/stats?date=YYYY-MM-DD
 *
 * Returns aggregated daily nutrition stats for the authenticated user.
 * Used by DashboardClient for live polling via SWR.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getDailyStats } from '@/lib/repositories/mealRepository';

export async function GET(request: Request) {
  // Auth via session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = new URL(request.url).searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Valid "date" query param (YYYY-MM-DD) required.' },
      { status: 400 },
    );
  }

  const stats = await getDailyStats(uid, date);

  return NextResponse.json(
    stats ?? {
      date,
      totalKcal: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      mealCount: 0,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
