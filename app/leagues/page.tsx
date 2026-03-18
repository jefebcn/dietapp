/**
 * /app/leagues/page.tsx  –  League System Overview
 *
 * Shows the user's current tier, leaderboard, and league stats.
 * Server Component: auth-gated.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserLeague, getAllLeagueStats, LEAGUES, getTierForPoints } from '@/lib/repositories/leagueRepository';
import { BottomTabBar } from '@/components/BottomTabBar';

export const metadata: Metadata = { title: 'Leghe' };

export default async function LeaguesPage() {
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

  const [membership, allStats] = await Promise.all([
    getUserLeague(uid),
    getAllLeagueStats(),
  ]);

  const currentTier = membership?.tier ?? 'bronze';
  const currentLeague = LEAGUES[currentTier];

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 45%, #DBEAFE 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(245,243,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '2.5px solid #C4B5FD',
          boxShadow: '0 4px 20px rgba(109,40,217,0.10)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1
            className="text-2xl"
            style={{ fontFamily: 'var(--font-display)', color: '#4C1D95' }}
          >
            {currentLeague.emoji} Leghe NutriTrack
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-4 page-content">

        {/* Current tier card */}
        <div
          className="p-5 rounded-3xl"
          style={{
            background: currentLeague.bgGradient,
            border: `2.5px solid ${currentLeague.borderColor}`,
            boxShadow: `0 6px 0 ${currentLeague.shadowColor}, 0 10px 28px rgba(0,0,0,0.10)`,
          }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-1"
            style={{ fontFamily: 'var(--font-ui)', color: currentLeague.color, opacity: 0.7 }}
          >
            La tua lega attuale
          </p>
          <h2
            className="text-3xl mb-1"
            style={{ fontFamily: 'var(--font-display)', color: currentLeague.color }}
          >
            {currentLeague.emoji} {currentLeague.name}
          </h2>
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-ui)', color: currentLeague.color, opacity: 0.8 }}
          >
            {membership
              ? `${membership.nutriPoints.toLocaleString('it-IT')} NutriPoints`
              : 'Inizia a tracciare per guadagnare punti!'}
          </p>
        </div>

        {/* All tiers */}
        <div className="space-y-3">
          <h3
            className="text-base font-semibold px-1"
            style={{ fontFamily: 'var(--font-ui)', color: '#4C1D95' }}
          >
            Tutte le leghe
          </h3>
          {allStats.map(({ tier, totalMembers }) => {
            const league = LEAGUES[tier];
            const isActive = tier === currentTier;
            return (
              <div
                key={tier}
                className="flex items-center justify-between p-4 rounded-2xl transition-all"
                style={{
                  background: isActive ? league.bgGradient : 'rgba(255,255,255,0.7)',
                  border: `2px solid ${isActive ? league.borderColor : 'rgba(196,181,253,0.4)'}`,
                  boxShadow: isActive
                    ? `0 4px 0 ${league.shadowColor}, 0 8px 16px rgba(0,0,0,0.08)`
                    : '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{league.emoji}</span>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ fontFamily: 'var(--font-ui)', color: league.color }}
                    >
                      {league.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ fontFamily: 'var(--font-ui)', color: league.color, opacity: 0.65 }}
                    >
                      Min. {league.minPoints.toLocaleString('it-IT')} punti
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ fontFamily: 'var(--font-ui)', color: league.color }}
                  >
                    {totalMembers.toLocaleString('it-IT')}
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-ui)', color: league.color, opacity: 0.6 }}
                  >
                    membri
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
