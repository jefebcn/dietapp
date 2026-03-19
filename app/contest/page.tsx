/**
 * /app/contest/page.tsx  –  Contest & Challenge Arena
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserById } from '@/lib/repositories/userRepository';
import { getStreakState } from '@/lib/repositories/streakRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import ContestClient from './ContestClient';

export const metadata: Metadata = { title: 'Contest' };

export default async function ContestPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch { redirect('/login'); }

  const [user, streakState] = await Promise.all([
    getUserById(uid).catch(() => null),
    getStreakState(uid).catch(() => null),
  ]);

  const streak = streakState?.currentStreak ?? 0;
  const userName = user?.name ?? 'Atleta';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}>
      {/* Header */}
      <header className="page-header" style={{
        background: 'rgba(243,246,240,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5EBE0',
      }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
            Sfide e classifiche
          </p>
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
            🏆 Contest
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 page-content">
        <ContestClient streak={streak} userName={userName} />
      </main>

      <BottomTabBar />
    </div>
  );
}
