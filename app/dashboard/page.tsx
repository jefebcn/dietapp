/**
 * /app/dashboard/page.tsx  –  NutriTrack Dashboard (light healthy theme)
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserById, upsertUserFromAuth } from '@/lib/repositories/userRepository';
import { getDailyStats, getDailyStatsRange, getMealsByDate } from '@/lib/repositories/mealRepository';
import { getStreakState } from '@/lib/repositories/streakRepository';
import { getWaterTodayAction } from '@/lib/actions/mealActions';

import DashboardClient from './DashboardClient';
import { BottomTabBar } from '@/components/BottomTabBar';

export const metadata: Metadata = { title: 'Home' };

function dateStr(d: Date): string { return d.toISOString().split('T')[0]; }
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

function getDailyTip(kcal: number, goalKcal: number, protein: number, goalProtein: number, streak: number) {
  if (streak >= 7) return `🔥 ${streak} giorni di fila! Sei inarrestabile!`;
  if (kcal === 0) return 'Inizia la giornata! Registra il tuo primo pasto di oggi.';
  const kp = goalKcal > 0 ? kcal / goalKcal : 0;
  const pp = goalProtein > 0 ? protein / goalProtein : 0;
  if (kp < 0.3 && new Date().getHours() >= 14) return 'Stai mangiando poco oggi — assicurati di fare pasti regolari.';
  if (kp > 1.1) return 'Hai superato il limite calorico. Scegli cibi leggeri per la sera.';
  if (pp < 0.5 && new Date().getHours() >= 13) return 'Proteine basse oggi. Aggiungi una fonte proteica al prossimo pasto!';
  if (kp >= 0.85 && kp <= 1.0) return 'Ottimo! Sei vicino al tuo obiettivo calorico. 💪';
  return 'Stai andando alla grande! Continua a tracciare i tuoi pasti.';
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch { redirect('/login'); }

  const today = dateStr(new Date());

  // upsertUserFromAuth: returns existing doc or auto-creates one from Firebase Auth
  // so old users from previous app versions are never stuck in a redirect loop
  const [user, todayStats, weekStats, todayMeals, streakState, waterToday] = await Promise.all([
    upsertUserFromAuth(uid).catch(() => getUserById(uid)),
    getDailyStats(uid, today).catch(() => null),
    getDailyStatsRange(uid, daysAgo(6), today).catch(() => []),
    getMealsByDate(uid, today).catch(() => []),
    getStreakState(uid).catch(() => null),
    getWaterTodayAction().catch(() => null),
  ]);

  if (!user) redirect('/login');

  const stats  = todayStats ?? { date: today, totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 };
  const goals  = user.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 };
  const streak = streakState?.currentStreak ?? 0;
  const tip    = getDailyTip(stats.totalKcal, goals.kcal, stats.totalProtein, goals.protein, streak);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}>
      <DashboardClient
        uid={uid} today={today} stats={stats} goals={goals}
        todayMeals={todayMeals} weekStats={weekStats}
        userName={user.name ?? ''} streak={streak} tip={tip}
        initialWater={waterToday ?? undefined}
      />
      <BottomTabBar />
    </div>
  );
}
