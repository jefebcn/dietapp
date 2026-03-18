/**
 * /app/dashboard/page.tsx  –  NutriTrack Dashboard
 *
 * Server Component: auth-gated via __session cookie + firebase-admin.
 * Fetches today's stats and 7-day history, passes to Bento Grid client.
 * Includes persistent BottomTabBar via layout wrapper.
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

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

function getDailyTip(
  totalKcal: number,
  goalKcal: number,
  totalProtein: number,
  goalProtein: number,
  streak: number,
): string {
  if (streak >= 7)
    return `🔥 ${streak} giorni di fila! Sei inarrestabile!`;
  if (totalKcal === 0)
    return 'Inizia la giornata con una colazione nutriente! Registra il tuo primo pasto.';
  const kcalPct = goalKcal > 0 ? totalKcal / goalKcal : 0;
  const proteinPct = goalProtein > 0 ? totalProtein / goalProtein : 0;
  if (kcalPct < 0.3 && new Date().getHours() >= 14)
    return 'Stai mangiando poco oggi! Ricorda di fare pasti regolari.';
  if (kcalPct > 1.1)
    return 'Hai superato il tuo obiettivo calorico. Scegli cibi leggeri per stasera.';
  if (proteinPct < 0.5 && new Date().getHours() >= 13)
    return 'Le proteine sono basse oggi. Aggiungi una fonte proteica al prossimo pasto.';
  if (kcalPct >= 0.85 && kcalPct <= 1.0)
    return 'Ottimo lavoro! Sei vicino al tuo obiettivo calorico. 💪';
  return 'Stai andando alla grande! Continua a tracciare i tuoi pasti.';
}

export default async function DashboardPage() {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    redirect('/login');
  }

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const today = dateStr(new Date());
  const sevenDaysAgo = daysAgo(6);

  let fetchResult;
  try {
    fetchResult = await Promise.all([
      getUserById(uid),
      getDailyStats(uid, today),
      getDailyStatsRange(uid, sevenDaysAgo, today),
      getMealsByDate(uid, today),
      getStreakState(uid),
    ]);
  } catch (err) {
    console.error('[Dashboard] data fetch failed:', err);
    throw err;
  }

  const [user, todayStats, weekStats, todayMeals, streakState] = fetchResult;

  if (!user) redirect('/login');

  const stats = todayStats ?? {
    date: today,
    totalKcal: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0,
  };

  const goals = user.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 };
  const streak = streakState?.currentStreak ?? 0;
  const dailyTip = getDailyTip(
    stats.totalKcal, goals.kcal,
    stats.totalProtein, goals.protein,
    streak,
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #EEF2FF 0%, #F5F0FF 40%, #ECFDF5 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(238,242,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '2.5px solid #A5B4FC',
          boxShadow: '0 4px 20px rgba(67,56,202,0.10)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold" style={{ color: '#6366F1' }}>
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1
              className="text-xl leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: '#312E81' }}
            >
              Ciao, {user.name?.split(' ')[0] || 'amico'}!
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Streak badge */}
            {streak > 0 && (
              <span
                className="text-xs font-bold px-2.5 py-1.5 rounded-full"
                style={{
                  fontFamily: 'var(--font-ui)',
                  background: 'linear-gradient(145deg, #FEF3C7, #FDE68A)',
                  color: '#92400E',
                  border: '2px solid #FBBF24',
                  boxShadow: '0 3px 0 #D97706',
                }}
              >
                🔥 {streak}
              </span>
            )}
            <span
              className="text-xs font-extrabold px-3 py-1.5 rounded-full"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(145deg, #EEF2FF, #E0E7FF)',
                color: '#3730A3',
                border: '2px solid #A5B4FC',
                boxShadow: '0 3px 0 #4338CA',
              }}
            >
              NutriTrack
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-4 page-content">
        {/* Daily tip card — no mascot, clean text */}
        <section aria-label="Consiglio del giorno">
          <div
            className="flex gap-3 items-center p-4"
            style={{
              background: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 100%)',
              borderRadius: '1.5rem',
              border: '2.5px solid #A5B4FC',
              boxShadow: '0 5px 0 #4338CA, 0 10px 24px rgba(67,56,202,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
            }}
          >
            <span className="text-2xl flex-shrink-0">💡</span>
            <div className="min-w-0">
              <p
                className="text-xs uppercase tracking-wide mb-0.5 font-bold"
                style={{ fontFamily: 'var(--font-ui)', color: '#4338CA' }}
              >
                Consiglio del giorno
              </p>
              <p
                className="text-sm leading-snug font-medium"
                style={{ fontFamily: 'var(--font-ui)', color: '#1E1B4B' }}
              >
                {dailyTip}
              </p>
            </div>
          </div>
        </section>

        {/* Bento grid (client) */}
        <section aria-label="Riepilogo nutrizionale odierno">
          <Suspense
            fallback={
              <div
                className="flex justify-center items-center py-10"
                style={{
                  background: 'linear-gradient(145deg, #EEF2FF, #E0E7FF)',
                  borderRadius: '1.5rem',
                  border: '2.5px solid #A5B4FC',
                  boxShadow: '0 6px 0 #4338CA, 0 10px 28px rgba(67,56,202,0.15)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin"
                  style={{ borderTopColor: '#4338CA', borderColor: '#C7D2FE' }}
                />
              </div>
            }
          >
            <DashboardClient
              uid={uid}
              today={today}
              stats={stats}
              goals={goals}
              todayMeals={todayMeals}
              weekStats={weekStats}
              userName={user.name ?? ''}
            />
          </Suspense>
        </section>
      </main>

      {/* Persistent bottom navigation */}
      <BottomTabBar />
    </div>
  );
}
