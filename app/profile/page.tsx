/**
 * /app/profile/page.tsx  –  User Profile
 *
 * Horizontal swipe navigation between Awards, History, and Stats tabs
 * via client-side gesture detection. Server Component: auth-gated.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserById } from '@/lib/repositories/userRepository';
import { getStreakState, getFreezeTokens } from '@/lib/repositories/streakRepository';
import { getRecentGoldWeeks } from '@/lib/repositories/weightRepository';
import { getUserLeague, LEAGUES } from '@/lib/repositories/leagueRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = { title: 'Profilo' };

export default async function ProfilePage() {
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

  const [user, streak, freezeTokens, weightTrend, league] = await Promise.all([
    getUserById(uid),
    getStreakState(uid),
    getFreezeTokens(uid),
    getRecentGoldWeeks(uid, 8),
    getUserLeague(uid),
  ]);

  if (!user) redirect('/login');

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold" style={{ color: 'rgba(248,250,252,0.45)' }}>Il tuo spazio</p>
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC', textShadow: '0 0 24px rgba(34,211,238,0.40)' }}>
            👤 Il Tuo Profilo
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 page-content">
        <ProfileClient
          user={{
            name: user.name ?? '',
            email: user.email ?? '',
            goals: user.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 },
          }}
          streak={{
            current: streak?.currentStreak ?? 0,
            longest: streak?.longestStreak ?? 0,
            freezeTokens: freezeTokens?.available ?? 0,
          }}
          weightTrend={weightTrend}
          league={league ? { tier: league.tier, ...LEAGUES[league.tier] } : null}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
