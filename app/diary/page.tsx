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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
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
  const params = await searchParams;
  // Accept a ?date=YYYY-MM-DD param; fall back to today if missing / invalid
  const viewDate =
    params.date && DATE_RE.test(params.date) && params.date <= today
      ? params.date
      : today;

  const isPast = viewDate !== today;

  const [meals, stats] = await Promise.all([
    getMealsByDate(uid, viewDate),
    getDailyStats(uid, viewDate),
  ]);

  const displayDate = new Date(viewDate + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            {isPast && (
              <a href="/dashboard" style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#fff', border: '1px solid #E5EBE0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </a>
            )}
            <div>
              <p className="text-xs font-semibold capitalize" style={{ color: isPast ? '#F97316' : '#9CA3AF' }}>
                {isPast ? `📅 ${displayDate}` : displayDate}
              </p>
              <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
                📖 Diario Alimentare
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 page-content">
        <DiaryClient uid={uid} today={viewDate} meals={meals} stats={stats} />
      </main>

      <BottomTabBar />
    </div>
  );
}
