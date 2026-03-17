/**
 * /app/dashboard/page.tsx  –  NutriTrack Dashboard
 *
 * Server Component: fetches today's stats and the last 7 days of history
 * server-side via the Repository layer. Passes serialisable data to
 * Client Components for interactivity.
 *
 * Authentication: verified via session cookie before rendering.
 * Unauthenticated requests are redirected to /login.
 */

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserById } from '@/lib/repositories/userRepository';
import { getDailyStats, getDailyStatsRange, getMealsByDate } from '@/lib/repositories/mealRepository';

import DashboardClient from './DashboardClient';
import SprintyAssistant from '@/components/SprintyAssistant';

// ── Metadata ───────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Dashboard',
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD for a given date */
function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Returns the ISO date string for N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

/** Generates a contextual nutritional tip based on today's progress */
function getSprintyTip(
  totalKcal: number,
  goalKcal: number,
  totalProtein: number,
  goalProtein: number
): string {
  const kcalPct = goalKcal > 0 ? totalKcal / goalKcal : 0;
  const proteinPct = goalProtein > 0 ? totalProtein / goalProtein : 0;

  if (totalKcal === 0)
    return 'Inizia la giornata con una colazione nutriente! Registra il tuo primo pasto.';
  if (kcalPct < 0.3 && new Date().getHours() >= 14)
    return 'Stai mangiando poco oggi! Ricorda di fare pasti regolari per mantenere il metabolismo attivo.';
  if (kcalPct > 1.1)
    return 'Hai superato il tuo obiettivo calorico. Scegli cibi leggeri per il resto della giornata.';
  if (proteinPct < 0.5 && new Date().getHours() >= 13)
    return 'Le tue proteine sono basse oggi. Aggiungi una fonte proteica al prossimo pasto.';
  if (kcalPct >= 0.85 && kcalPct <= 1.0)
    return 'Ottimo lavoro! Sei vicino al tuo obiettivo calorico giornaliero.';
  return 'Stai andando alla grande! Continua a tracciare i tuoi pasti con costanza.';
}

// ── Server Component ───────────────────────────────────────────────────────

export default async function DashboardPage() {
  // ── Auth check ─────────────────────────────────────────────────────────
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    redirect('/login');
  }

  // ── Data fetching (parallel) ────────────────────────────────────────────
  const today = dateStr(new Date());
  const sevenDaysAgo = daysAgo(6);

  const [user, todayStats, weekStats, todayMeals] = await Promise.all([
    getUserById(uid),
    getDailyStats(uid, today),
    getDailyStatsRange(uid, sevenDaysAgo, today),
    getMealsByDate(uid, today),
  ]);

  if (!user) redirect('/login');

  // ── Resolve today's stats (may be null if no meals logged yet) ──────────
  const stats = todayStats ?? {
    date: today,
    totalKcal: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0,
  };

  const goals = user.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 };
  const sprintyTip = getSprintyTip(stats.totalKcal, goals.kcal, stats.totalProtein, goals.protein);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5efe4]">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-[#f5efe4]/90 backdrop-blur-sm border-b border-[#ddd3c4]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8a7868]">
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1 className="font-serif text-lg font-bold text-[#2c1f0e] leading-tight">
              Ciao, {user.name?.split(' ')[0] || 'amico'}!
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-[#e8f3e2] text-[#3a6b27] font-semibold px-3 py-1 rounded-full border border-[#7db560]">
              NutriPoints
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-24 pt-4 space-y-5">

        {/* Sprinty tip card */}
        <section aria-label="Consiglio di Sprinty">
          <div className="card flex gap-4 items-center">
            <SprintyAssistant
              mood="tip"
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#c8861a] uppercase tracking-wide mb-0.5">
                Consiglio di Sprinty
              </p>
              <p className="text-sm text-[#2c1f0e] leading-snug">{sprintyTip}</p>
            </div>
          </div>
        </section>

        {/* Calories ring + macros */}
        <section aria-label="Riepilogo calorico odierno">
          <Suspense
            fallback={
              <div className="card flex justify-center py-8">
                <SprintyAssistant mood="loading" size="md" />
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
    </div>
  );
}
