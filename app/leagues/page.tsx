/**
 * /app/leagues/page.tsx  –  League System (light healthy theme)
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserLeague, getAllLeagueStats, LEAGUES, getTierForPoints } from '@/lib/repositories/leagueRepository';
import { BottomTabBar } from '@/components/BottomTabBar';

export const metadata: Metadata = { title: 'Leghe' };

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'] as const;

const TIER_STYLES: Record<string, { bg: string; accent: string; border: string }> = {
  bronze:   { bg: '#FDF8F3', accent: '#CD8032', border: '#E8D5BC' },
  silver:   { bg: '#F8F8FA', accent: '#6B7280', border: '#D1D5DB' },
  gold:     { bg: '#FFFBEB', accent: '#F59E0B', border: '#FDE68A' },
  platinum: { bg: '#F5F3FF', accent: '#8B5CF6', border: '#DDD6FE' },
};

const TIER_PERKS: Record<string, string[]> = {
  bronze:   ['Tracciamento base', '5 analisi AI/mese', 'Streak giornaliero'],
  silver:   ['20 analisi AI/mese', 'Grafici settimanali', '1 Streak Freeze/mese'],
  gold:     ['50 analisi AI/mese', 'Report mensile AI', '3 Streak Freeze/mese', 'Badge esclusivo'],
  platinum: ['AI illimitata', 'Report avanzati', 'Streak Freeze illimitati', 'Badge leggendario', 'Accesso anticipato'],
};

export default async function LeaguesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch { redirect('/login'); }

  const [membership, allStats] = await Promise.all([
    getUserLeague(uid),
    getAllLeagueStats(),
  ]);

  const currentTier   = membership?.tier ?? 'bronze';
  const currentLeague = LEAGUES[currentTier];
  const tierStyle     = TIER_STYLES[currentTier];
  const currentPoints = membership?.nutriPoints ?? 0;
  const tierIdx       = TIER_ORDER.indexOf(currentTier as typeof TIER_ORDER[number]);
  const nextTierKey   = TIER_ORDER[tierIdx + 1];
  const nextLeague    = nextTierKey ? LEAGUES[nextTierKey] : null;
  const progressPct   = nextLeague
    ? Math.min(((currentPoints - currentLeague.minPoints) / (nextLeague.minPoints - currentLeague.minPoints)) * 100, 100)
    : 100;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}>

      {/* Header */}
      <header className="page-header">
        <div style={{ padding: '14px 20px' }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Classifica & Premi</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', fontFamily: 'var(--font-display)' }}>
            {currentLeague.emoji} Leghe NutriTrack
          </h1>
        </div>
      </header>

      <main className="page-content" style={{ padding: '16px 20px' }}>

        {/* ── Current Tier Hero ── */}
        <div style={{
          background: tierStyle.bg,
          border: `1.5px solid ${tierStyle.border}`,
          borderRadius: 24,
          padding: 20,
          marginBottom: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 6 }}>
                La tua lega
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 36 }}>{currentLeague.emoji}</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', fontFamily: 'var(--font-display)' }}>
                  {currentLeague.name}
                </h2>
              </div>
            </div>
            {membership && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: tierStyle.accent, lineHeight: 1 }}>
                  {currentPoints.toLocaleString('it-IT')}
                </p>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF' }}>NutriPoints</p>
              </div>
            )}
          </div>

          {nextLeague && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                  {currentPoints.toLocaleString()} / {nextLeague.minPoints.toLocaleString()} pts
                </span>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                  {nextLeague.emoji} {nextLeague.name}
                </span>
              </div>
              <div style={{ height: 8, background: '#E5EBE0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg, ${tierStyle.accent}, ${tierStyle.accent}cc)`,
                  width: `${progressPct}%`,
                  transition: 'width 1s ease',
                }} />
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                Mancano {Math.max(0, nextLeague.minPoints - currentPoints).toLocaleString()} punti
              </p>
            </div>
          )}
          {currentTier === 'platinum' && (
            <p style={{ fontSize: 14, fontWeight: 700, color: tierStyle.accent, marginTop: 8 }}>
              🏆 Hai raggiunto la lega massima!
            </p>
          )}
        </div>

        {/* ── Current perks ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
            I tuoi vantaggi attuali
          </p>
          {TIER_PERKS[currentTier].map((perk) => (
            <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span style={{ fontSize: 14, color: tierStyle.accent }}>✓</span>
              <span style={{ fontSize: 14, color: '#1C1917', fontWeight: 500 }}>{perk}</span>
            </div>
          ))}
        </div>

        {/* ── Earn points ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 12 }}>
            Come guadagnare NutriPoints
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: '📋', action: 'Registra un pasto', pts: '+10' },
              { icon: '🎯', action: 'Obiettivo kcal', pts: '+25' },
              { icon: '🔥', action: 'Mantieni streak', pts: '+15/gg' },
              { icon: '⚖️', action: 'Registra peso', pts: '+8' },
              { icon: '📊', action: 'Analisi completa', pts: '+5' },
              { icon: '🏆', action: 'Streak 7 giorni', pts: '+50' },
            ].map((item) => (
              <div key={item.action} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 12, background: '#F8FAF7',
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.3 }}>{item.action}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#F97316', flexShrink: 0 }}>{item.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── All tiers ── */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', marginBottom: 10 }}>Tutte le leghe</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allStats.map(({ tier, totalMembers }) => {
            const league    = LEAGUES[tier];
            const style     = TIER_STYLES[tier];
            const isActive  = tier === currentTier;
            const tierI     = TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number]);
            const isLocked  = tierI > tierIdx;

            return (
              <div key={tier} style={{
                background: isActive ? style.bg : '#fff',
                border: `1.5px solid ${isActive ? style.border : '#E5EBE0'}`,
                borderRadius: 18,
                overflow: 'hidden',
                opacity: isLocked ? 0.60 : 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <span style={{ fontSize: 26 }}>{league.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917' }}>{league.name}</p>
                      {isActive && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '2px 7px',
                          borderRadius: 99, background: style.accent,
                          color: '#fff',
                        }}>
                          TU
                        </span>
                      )}
                      {isLocked && (
                        <span style={{ fontSize: 12 }}>🔒</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      Min. {league.minPoints.toLocaleString()} punti
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917' }}>
                      {totalMembers.toLocaleString('it-IT')}
                    </p>
                    <p style={{ fontSize: 10, color: '#9CA3AF' }}>membri</p>
                  </div>
                </div>
                <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TIER_PERKS[tier].slice(0, 3).map((perk) => (
                    <span key={perk} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 99, background: `${style.accent}15`,
                      color: style.accent, border: `1px solid ${style.accent}30`,
                    }}>
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Premium CTA ── */}
        <Link href="/premium" style={{ textDecoration: 'none', display: 'block', marginTop: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)',
            border: '1.5px solid #FDE68A',
            borderRadius: 20, padding: 16,
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 2px 8px rgba(245,158,11,0.10)',
          }}>
            <span style={{ fontSize: 28 }}>✨</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917' }}>
                Scala le leghe più velocemente
              </p>
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                Premium: punti bonus e streak freeze illimitati
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>

      </main>
      <BottomTabBar />
    </div>
  );
}
