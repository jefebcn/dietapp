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
    ]);
  } catch (err) {
    console.error('[Dashboard] data fetch failed:', err);
    throw err; // re-throw so error.tsx catches it with the actual message
  }

  const [user, todayStats, weekStats, todayMeals] = fetchResult;

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
    <div className="relative min-h-screen" style={{ background: '#f7f3e9' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(247,243,233,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1.5px solid rgba(210,185,140,0.30)',
          boxShadow: '0 2px 12px rgba(90,58,20,0.08)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: '#a08060' }}>
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1 className="font-serif text-lg font-bold leading-tight" style={{ color: '#3d2a0a' }}>
              Ciao, {user.name?.split(' ')[0] || 'amico'}! 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(136,176,75,0.15)',
                color: '#5a7a1a',
                border: '1.5px solid rgba(136,176,75,0.35)',
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
            className="flex gap-4 items-center p-4"
            style={{
              background: 'linear-gradient(160deg, #fffdf8 0%, #faf5ea 100%)',
              borderRadius: '1.5rem',
              border: '1.5px solid rgba(217,119,6,0.22)',
              boxShadow: [
                '0 8px 24px rgba(90,58,20,0.10)',
                'inset 0 1.5px 0 rgba(255,255,255,0.80)',
              ].join(', '),
            }}
          >
            <SprintyAssistant mood="tip" size="sm" className="flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#d97706' }}>
                Consiglio di Sprinty
              </p>
              <p className="text-sm leading-snug" style={{ color: '#7a5c2e' }}>{sprintyTip}</p>
            </div>
          </div>
        </section>

        {/* Bento grid (client) */}
        <section aria-label="Riepilogo nutrizionale odierno">
          <Suspense
            fallback={
              <div
                className="flex justify-center py-10"
                style={{
                  background: 'linear-gradient(160deg,#fffdf8 0%,#faf5ea 100%)',
                  borderRadius: '2rem',
                  boxShadow: '0 10px 32px rgba(90,58,20,0.14), inset 0 1.5px 0 rgba(255,255,255,0.80)',
                }}
              >
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
