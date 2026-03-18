/**
 * /app/dashboard/page.tsx  –  NutriTrack Dashboard
 * Dark glass identity: frosted header over animated orb background.
 */

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserById } from '@/lib/repositories/userRepository';
import { getDailyStats, getDailyStatsRange, getMealsByDate } from '@/lib/repositories/mealRepository';
import { getStreakState } from '@/lib/repositories/streakRepository';

import DashboardClient from './DashboardClient';
import { BottomTabBar } from '@/components/BottomTabBar';

export const metadata: Metadata = { title: 'Dashboard' };

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
  if (kp > 1.1) return 'Hai superato l\'obiettivo calorico. Scegli cibi leggeri per il resto della giornata.';
  if (pp < 0.5 && new Date().getHours() >= 13) return 'Proteine basse oggi. Aggiungi una fonte proteica al prossimo pasto!';
  if (kp >= 0.85 && kp <= 1.0) return 'Ottimo lavoro! Sei vicino al tuo obiettivo calorico. 💪';
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

  let fetchResult;
  try {
    fetchResult = await Promise.all([
      getUserById(uid),
      getDailyStats(uid, today),
      getDailyStatsRange(uid, daysAgo(6), today),
      getMealsByDate(uid, today),
      getStreakState(uid),
    ]);
  } catch (err) { console.error('[Dashboard]', err); throw err; }

  const [user, todayStats, weekStats, todayMeals, streakState] = fetchResult;
  if (!user) redirect('/login');

  const stats = todayStats ?? { date: today, totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 };
  const goals = user.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 };
  const streak = streakState?.currentStreak ?? 0;
  const tip = getDailyTip(stats.totalKcal, goals.kcal, stats.totalProtein, goals.protein, streak);

  // Build calorie burn percentage for header ring indicator
  const kcalPct = Math.min(Math.round((stats.totalKcal / Math.max(goals.kcal, 1)) * 100), 100);

  return (
    <div className="relative min-h-screen">

      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold capitalize" style={{ color: 'rgba(248,250,252,0.50)' }}>
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1
              className="text-xl leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC', textShadow: '0 0 24px rgba(139,92,246,0.50)' }}
            >
              Ciao, {user.name?.split(' ')[0] || 'amico'}!
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="streak-badge text-xs px-2.5 py-1.5 rounded-full">
                🔥 {streak}
              </span>
            )}
            {/* Calorie % pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: 'rgba(245,158,11,0.14)',
                border: '1px solid rgba(245,158,11,0.30)',
                color: '#FCD34D',
              }}
            >
              🔥
              {kcalPct}%
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-3 page-content">

        {/* Daily tip */}
        <div
          className="flex gap-3 items-center px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.22)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="text-xs font-medium leading-snug" style={{ color: 'rgba(248,250,252,0.75)' }}>
            {tip}
          </p>
        </div>

        {/* Bento grid */}
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12" style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '1.5rem',
              border: '1px solid rgba(255,255,255,0.10)',
            }}>
              <div className="w-10 h-10 rounded-full border-2 border-t-violet-400 animate-spin"
                style={{ borderColor: 'rgba(139,92,246,0.25)', borderTopColor: '#A78BFA' }} />
            </div>
          }
        >
          <DashboardClient
            uid={uid} today={today} stats={stats} goals={goals}
            todayMeals={todayMeals} weekStats={weekStats} userName={user.name ?? ''}
            streak={streak} tip={tip}
          />
        </Suspense>
      </main>

      <BottomTabBar />
    </div>
  );
}
