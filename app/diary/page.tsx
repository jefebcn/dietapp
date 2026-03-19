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
    <div className="relative min-h-screen" style={{ background: '#F3F6F0' }}>
      {/* Header */}
      <header className="page-header" style={{
        background: 'rgba(243,246,240,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5EBE0',
      }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold capitalize" style={{ color: '#9CA3AF' }}>
            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
            📖 Diario Alimentare
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 page-content">
        <DiaryClient uid={uid} today={today} meals={meals} stats={stats} />
      </main>

      <BottomTabBar />
    </div>
  );
}
