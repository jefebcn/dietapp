/**
 * /app/insights/page.tsx  –  Insights & Analytics Page
 *
 * Merges weight tracking + nutrition analytics.
 * Server Component: auth-gated.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getRecentBronzeLogs, getRecentGoldWeeks } from '@/lib/repositories/weightRepository';
import { getDailyStatsRange } from '@/lib/repositories/mealRepository';
import { getUserById } from '@/lib/repositories/userRepository';
import { getStreakState } from '@/lib/repositories/streakRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import InsightsClient from './InsightsClient';

export const metadata: Metadata = { title: 'Insights' };

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default async function InsightsPage() {
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

  const [recentLogs, weeklyTrend, monthStats, user, streakState] = await Promise.all([
    getRecentBronzeLogs(uid, 10),
    getRecentGoldWeeks(uid, 8),
    getDailyStatsRange(uid, daysAgo(29), new Date().toISOString().split('T')[0]),
    getUserById(uid),
    getStreakState(uid),
  ]);

  const goals = user?.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 };
  const streak = streakState?.currentStreak ?? 0;
  const longestStreak = streakState?.longestStreak ?? 0;

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold" style={{ color: 'rgba(248,250,252,0.45)' }}>
            I tuoi progressi
          </p>
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC', textShadow: '0 0 24px rgba(52,211,153,0.45)' }}>
            📊 Insights
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 page-content">
        <InsightsClient
          recentLogs={recentLogs}
          weeklyTrend={weeklyTrend}
          monthStats={monthStats}
          goals={goals}
          streak={streak}
          longestStreak={longestStreak}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
