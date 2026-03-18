/**
 * /app/diary/page.tsx  –  Food Diary
 *
 * Displays today's meals with BottomSheet for food detail entry.
 * Server Component: auth-gated.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getMealsByDate, getDailyStats } from '@/lib/repositories/mealRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import DiaryClient from './DiaryClient';

export const metadata: Metadata = { title: 'Diario' };

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default async function DiaryPage() {
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

  const today = todayStr();
  const [meals, stats] = await Promise.all([
    getMealsByDate(uid, today),
    getDailyStats(uid, today),
  ]);

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(8,11,20,0.82)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1
            className="text-2xl"
            style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}
          >
            📖 Diario Alimentare
          </h1>
          <p
            className="text-xs"
            style={{ fontFamily: 'var(--font-ui)', color: 'rgba(248,250,252,0.65)' }}
          >
            {new Date().toLocaleDateString('it-IT', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 page-content">
        <DiaryClient uid={uid} today={today} meals={meals} stats={stats} />
      </main>

      <BottomTabBar />
    </div>
  );
}
