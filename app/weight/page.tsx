/**
 * /app/weight/page.tsx  –  Weight Tracking Page
 *
 * Server Component: auth-gated. Fetches recent weight history (Silver + Gold)
 * and passes to the interactive WeightClient for logging new entries.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getRecentBronzeLogs, getRecentGoldWeeks } from '@/lib/repositories/weightRepository';
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
  } catch {
    redirect('/login');
  }

  const [recentLogs, weeklyTrend] = await Promise.all([
    getRecentBronzeLogs(uid, 15),
    getRecentGoldWeeks(uid, 8),
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
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <a
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
            aria-label="Torna alla dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </a>
          <div>
            <h1
              className="text-2xl leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}
            >
              ⚖️ Traccia Peso
            </h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-4 page-content">
        <WeightClient recentLogs={recentLogs} weeklyTrend={weeklyTrend} />
      </main>

      <BottomTabBar />
    </div>
  );
}
