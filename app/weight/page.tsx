/**
 * /app/weight/page.tsx  –  Weight Tracking Page (light healthy theme)
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import {
  getRecentBronzeLogs,
  getRecentGoldWeeks,
  getBronzeLogsForDate,
} from '@/lib/repositories/weightRepository';
import type { BronzeLog, GoldMetrics } from '@/lib/repositories/weightRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import WeightClient from './WeightClient';

export const metadata: Metadata = { title: 'Peso' };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function WeightPage({
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
  } catch { redirect('/login'); }

  const today = new Date().toISOString().split('T')[0];
  const params = await searchParams;
  const viewDate =
    params.date && DATE_RE.test(params.date) && params.date <= today
      ? params.date
      : today;
  const isPast = viewDate !== today;

  const [recentLogs, weeklyTrend, dayLogs] = await Promise.all([
    getRecentBronzeLogs(uid, 20).catch(() => [] as Awaited<ReturnType<typeof getRecentBronzeLogs>>),
    getRecentGoldWeeks(uid, 8).catch(() => [] as Awaited<ReturnType<typeof getRecentGoldWeeks>>),
    isPast
      ? getBronzeLogsForDate(uid, viewDate).catch(() => [] as Awaited<ReturnType<typeof getBronzeLogsForDate>>)
      : Promise.resolve([] as Awaited<ReturnType<typeof getBronzeLogsForDate>>),
  ]);

  const displayDate = new Date(viewDate + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Back destination: if coming from a dated diary, go back there; otherwise dashboard
  const backHref = isPast ? `/diary?date=${viewDate}` : '/dashboard';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}>

      {/* Header */}
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
          <Link href={backHref} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#fff', border: '1.5px solid #E5EBE0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: isPast ? '#F97316' : '#9CA3AF' }}>
              {isPast ? `📅 ${displayDate}` : 'Monitoraggio'}
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', fontFamily: 'var(--font-display)' }}>
              ⚖️ Traccia Peso
            </h1>
          </div>

          {/* Day-switcher: Pasti ↔ Peso (only for past dates) */}
          {isPast && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <Link href={`/diary?date=${viewDate}`} style={{
                fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                background: '#fff', border: '1.5px solid #E5EBE0',
                color: '#6B7280', textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                🍽️ Pasti
              </Link>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                background: '#F97316', border: '1.5px solid rgba(249,115,22,0.4)',
                color: '#fff',
              }}>
                ⚖️ Peso
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="page-content" style={{ padding: '16px 20px' }}>
        <WeightClient
          recentLogs={recentLogs}
          weeklyTrend={weeklyTrend}
          viewDate={viewDate}
          dayLogs={dayLogs}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
