/**
 * /app/dashboard/page.tsx  –  NutriTrack Dashboard
 *
 * Server Component: auth-gated via __session cookie + firebase-admin,
 * fetches today's stats and 7-day history, passes to Bento Grid client.
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

export const metadata: Metadata = { title: 'Dashboard' };

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

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
    return 'Ottimo lavoro! Sei vicino al tuo obiettivo calorico giornaliero. 💪';
  return 'Stai andando alla grande! Continua a tracciare i tuoi pasti con costanza.';
}

export default async function DashboardPage() {
  // ── Auth ─────────────────────────────────────────────────────────────────
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

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const today = dateStr(new Date());
  const sevenDaysAgo = daysAgo(6);

  const [user, todayStats, weekStats, todayMeals] = await Promise.all([
    getUserById(uid),
    getDailyStats(uid, today),
    getDailyStatsRange(uid, sevenDaysAgo, today),
    getMealsByDate(uid, today),
  ]);

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
  const sprintyTip = getSprintyTip(stats.totalKcal, goals.kcal, stats.totalProtein, goals.protein);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/8"
        style={{
          background: 'rgba(15,23,42,0.80)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1 className="font-serif text-lg font-bold text-white leading-tight">
              Ciao, {user.name?.split(' ')[0] || 'amico'}! 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full border"
              style={{
                background: 'rgba(74,222,128,0.12)',
                color: '#4ade80',
                borderColor: 'rgba(74,222,128,0.3)',
              }}
            >
              NutriPoints
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-24 pt-4 space-y-4">

        {/* Sprinty tip card */}
        <section aria-label="Consiglio di Sprinty">
          <div
            className="glass-card flex gap-4 items-center p-4"
            style={{ borderColor: 'rgba(251,191,36,0.3)' }}
          >
            <SprintyAssistant mood="tip" size="sm" className="flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-0.5">
                Consiglio di Sprinty
              </p>
              <p className="text-sm text-slate-300 leading-snug">{sprintyTip}</p>
            </div>
          </div>
        </section>

        {/* Bento grid (client) */}
        <section aria-label="Riepilogo nutrizionale odierno">
          <Suspense
            fallback={
              <div className="glass-card flex justify-center py-10">
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
