/**
 * /app/weight/page.tsx  –  Weight Tracking Page (light healthy theme)
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getRecentBronzeLogs, getRecentGoldWeeks } from '@/lib/repositories/weightRepository';
import type { BronzeLog, GoldMetrics } from '@/lib/repositories/weightRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import WeightClient from './WeightClient';

export const metadata: Metadata = { title: 'Peso' };

export default async function WeightPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch { redirect('/login'); }

  const [recentLogs, weeklyTrend] = await Promise.all([
    getRecentBronzeLogs(uid, 15).catch(() => [] as Awaited<ReturnType<typeof getRecentBronzeLogs>>),
    getRecentGoldWeeks(uid, 8).catch(() => [] as Awaited<ReturnType<typeof getRecentGoldWeeks>>),
  ]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}>

      {/* Header */}
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
          <Link href="/dashboard" style={{
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
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Monitoraggio</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', fontFamily: 'var(--font-display)' }}>
              ⚖️ Traccia Peso
            </h1>
          </div>
        </div>
      </header>

      <main className="page-content" style={{ padding: '16px 20px' }}>
        <WeightClient recentLogs={recentLogs} weeklyTrend={weeklyTrend} />
      </main>

      <BottomTabBar />
    </div>
  );
}
