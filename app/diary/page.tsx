/**
 * /app/diary/page.tsx  –  Food Diary
 *
 * Accessible to guests — they see the full UI with empty meals.
 * Saving/editing meals requires login (gated in DiaryClient).
 */

import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getMealsByDate, getDailyStats } from '@/lib/repositories/mealRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import { GuestBanner } from '@/components/GuestBanner';
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

  // Try to resolve uid — guests get null
  let uid: string | null = null;
  if (sessionCookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
    } catch { /* invalid cookie — treat as guest */ }
  }

  const today = todayStr();
  const params = await searchParams;
  const viewDate =
    params.date && DATE_RE.test(params.date) && params.date <= today
      ? params.date
      : today;

  const isPast = viewDate !== today;

  const displayDate = new Date(viewDate + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // For guests: empty data
  const meals = uid ? await getMealsByDate(uid, viewDate).catch(() => []) : [];
  const stats = uid ? await getDailyStats(uid, viewDate).catch(() => null) : null;

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
            <div style={{ flex: 1 }}>
              <p className="text-xs font-semibold capitalize" style={{ color: isPast ? '#F97316' : '#9CA3AF' }}>
                {isPast ? `📅 ${displayDate}` : displayDate}
              </p>
              <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
                📖 Diario Alimentare
              </h1>
            </div>

            {isPast && uid && (
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                  background: '#F97316', border: '1.5px solid rgba(249,115,22,0.4)',
                  color: '#fff',
                }}>
                  🍽️ Pasti
                </span>
                <Link href={`/weight?date=${viewDate}`} style={{
                  fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                  background: '#fff', border: '1.5px solid #E5EBE0',
                  color: '#6B7280', textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  ⚖️ Peso
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 page-content">
        {!uid && <GuestBanner />}
        <DiaryClient uid={uid ?? ''} today={viewDate} meals={meals} stats={stats} isGuest={!uid} />
      </main>

      <BottomTabBar />
    </div>
  );
}
