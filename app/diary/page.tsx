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
    <div
      className="relative min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 45%, #FFF7ED 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(255,251,235,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '2.5px solid #FDE68A',
          boxShadow: '0 4px 20px rgba(180,83,9,0.10)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1
            className="text-2xl"
            style={{ fontFamily: 'var(--font-display)', color: '#78350F' }}
          >
            📖 Diario Alimentare
          </h1>
          <p
            className="text-xs"
            style={{ fontFamily: 'var(--font-ui)', color: '#B45309' }}
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
