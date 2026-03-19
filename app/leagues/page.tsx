/**
 * /app/leagues/page.tsx  –  League System
 *
 * Redesigned with premium dark glass aesthetic:
 *  • Current tier hero card with progress to next tier
 *  • How to earn NutriPoints
 *  • All league tiers with member counts
 *  • Perks for each tier
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserLeague, getAllLeagueStats, LEAGUES, getTierForPoints } from '@/lib/repositories/leagueRepository';
import { BottomTabBar } from '@/components/BottomTabBar';

export const metadata: Metadata = { title: 'Leghe' };

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'] as const;

const TIER_STYLES: Record<string, { gradient: string; glow: string; border: string; textColor: string }> = {
  bronze:   { gradient: 'linear-gradient(135deg, rgba(205,127,50,0.25), rgba(205,127,50,0.10))', glow: 'rgba(205,127,50,0.40)', border: 'rgba(205,127,50,0.40)', textColor: '#CD8032' },
  silver:   { gradient: 'linear-gradient(135deg, rgba(192,192,192,0.20), rgba(192,192,192,0.08))', glow: 'rgba(192,192,192,0.30)', border: 'rgba(192,192,192,0.35)', textColor: '#C0C0C0' },
  gold:     { gradient: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.10))', glow: 'rgba(245,158,11,0.45)', border: 'rgba(245,158,11,0.45)', textColor: '#F59E0B' },
  platinum: { gradient: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(34,211,238,0.15))', glow: 'rgba(139,92,246,0.45)', border: 'rgba(139,92,246,0.45)', textColor: '#A78BFA' },
};

const TIER_PERKS: Record<string, string[]> = {
  bronze:   ['Tracciamento base', '5 analisi AI/mese', 'Streak giornaliero'],
  silver:   ['20 analisi AI/mese', 'Grafici settimanali', '1 Streak Freeze/mese'],
  gold:     ['50 analisi AI/mese', 'Report mensile AI', '3 Streak Freeze/mese', 'Badge esclusivo'],
  platinum: ['AI illimitata', 'Report avanzati', 'Streak Freeze illimitati', 'Badge leggendario', 'Accesso anticipato feature'],
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

  const currentTier = membership?.tier ?? 'bronze';
  const currentLeague = LEAGUES[currentTier];
  const tierStyle = TIER_STYLES[currentTier];
  const currentPoints = membership?.nutriPoints ?? 0;
  const tierIdx = TIER_ORDER.indexOf(currentTier as typeof TIER_ORDER[number]);
  const nextTierKey = TIER_ORDER[tierIdx + 1];
  const nextLeague = nextTierKey ? LEAGUES[nextTierKey] : null;
  const progressPct = nextLeague
    ? Math.min(((currentPoints - currentLeague.minPoints) / (nextLeague.minPoints - currentLeague.minPoints)) * 100, 100)
    : 100;

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold" style={{ color: 'rgba(248,250,252,0.45)' }}>
            Classifica & Premi
          </p>
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC', textShadow: '0 0 24px rgba(168,85,247,0.50)' }}>
            {currentLeague.emoji} Leghe NutriTrack
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-4 page-content">

        {/* ── Current Tier Hero ── */}
        <div
          className="relative overflow-hidden p-5 rounded-3xl"
          style={{
            background: tierStyle.gradient,
            border: `1px solid ${tierStyle.border}`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 40px ${tierStyle.glow}`,
          }}
        >
          {/* Bg glow */}
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${tierStyle.glow} 0%, transparent 70%)`, filter: 'blur(30px)' }}/>

          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(248,250,252,0.45)' }}>
                  La tua lega
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-4xl">{currentLeague.emoji}</span>
                  <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
                    {currentLeague.name}
                  </h2>
                </div>
              </div>
              {membership && (
                <div className="text-right">
                  <p className="text-2xl font-black" style={{ color: tierStyle.textColor, fontFamily: 'var(--font-ui)' }}>
                    {currentPoints.toLocaleString('it-IT')}
                  </p>
                  <p className="text-xs font-bold" style={{ color: 'rgba(248,250,252,0.45)' }}>NutriPoints</p>
                </div>
              )}
            </div>

            {/* Progress to next tier */}
            {nextLeague && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>
                    {currentPoints.toLocaleString()} / {nextLeague.minPoints.toLocaleString()} pts
                  </span>
                  <span style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>
                    {nextLeague.emoji} {nextLeague.name}
                  </span>
                </div>
                <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, ${tierStyle.textColor}, rgba(255,255,255,0.80))`,
                      boxShadow: `0 0 12px ${tierStyle.glow}`,
                    }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(248,250,252,0.40)', fontFamily: 'var(--font-ui)' }}>
                  Mancano {Math.max(0, nextLeague.minPoints - currentPoints).toLocaleString()} punti alla lega successiva
                </p>
              </div>
            )}

            {currentTier === 'platinum' && (
              <p className="text-sm font-bold mt-2" style={{ color: tierStyle.textColor, fontFamily: 'var(--font-ui)' }}>
                🏆 Hai raggiunto la lega massima!
              </p>
            )}
          </div>
        </div>

        {/* ── Current tier perks ── */}
        <div className="p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,250,252,0.45)' }}>
            I tuoi vantaggi attuali
          </p>
          <div className="space-y-1.5">
            {TIER_PERKS[currentTier].map((perk) => (
              <div key={perk} className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: tierStyle.textColor }}>✓</span>
                <span className="text-sm" style={{ color: 'rgba(248,250,252,0.75)', fontFamily: 'var(--font-ui)' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── How to earn points ── */}
        <div className="p-4 rounded-2xl"
          style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.20)', backdropFilter: 'blur(16px)' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(167,139,250,0.70)' }}>
            Come guadagnare NutriPoints
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📋', action: 'Registra un pasto', pts: '+10' },
              { icon: '🎯', action: 'Raggiungi obiettivo kcal', pts: '+25' },
              { icon: '🔥', action: 'Mantieni la streak', pts: '+15/gg' },
              { icon: '💧', action: '8 bicchieri d\'acqua', pts: '+5' },
              { icon: '⚖️', action: 'Registra il peso', pts: '+8' },
              { icon: '🏆', action: 'Streak 7 giorni', pts: '+50' },
            ].map((item) => (
              <div key={item.action} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-base">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] leading-tight" style={{ color: 'rgba(248,250,252,0.65)', fontFamily: 'var(--font-ui)' }}>
                    {item.action}
                  </p>
                </div>
                <span className="text-[10px] font-black flex-shrink-0" style={{ color: '#A78BFA' }}>{item.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── All Tiers ── */}
        <div>
          <h3 className="text-sm font-bold mb-3 px-1" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
            Tutte le leghe
          </h3>
          <div className="space-y-2.5">
            {allStats.map(({ tier, totalMembers }) => {
              const league = LEAGUES[tier];
              const style = TIER_STYLES[tier];
              const isActive = tier === currentTier;
              const tierI = TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number]);
              const isUnlocked = tierI <= tierIdx;
              const perks = TIER_PERKS[tier];

              return (
                <div
                  key={tier}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: isActive ? style.gradient : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? style.border : 'rgba(255,255,255,0.08)'}`,
                    backdropFilter: 'blur(16px)',
                    boxShadow: isActive ? `0 4px 24px ${style.glow}` : undefined,
                    opacity: isUnlocked ? 1 : 0.60,
                  }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <span className="text-2xl">{league.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
                          {league.name}
                        </p>
                        {isActive && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: style.glow.replace('0.40', '0.25').replace('0.30', '0.25').replace('0.45', '0.25'), color: style.textColor, border: `1px solid ${style.border}` }}>
                            TU
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(248,250,252,0.45)', fontFamily: 'var(--font-ui)' }}>
                        Min. {league.minPoints.toLocaleString()} punti
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
                        {totalMembers.toLocaleString('it-IT')}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(248,250,252,0.35)', fontFamily: 'var(--font-ui)' }}>
                        membri
                      </p>
                    </div>
                  </div>
                  {/* Perks preview */}
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {perks.slice(0, 3).map((perk) => (
                      <span key={perk} className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: isActive ? style.textColor : 'rgba(248,250,252,0.40)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontFamily: 'var(--font-ui)',
                        }}>
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Premium CTA ── */}
        <a href="/premium"
          className="block p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(139,92,246,0.10))',
            border: '1px solid rgba(245,158,11,0.28)',
          }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>
                Scala le leghe più velocemente
              </p>
              <p className="text-xs" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>
                Premium: punti bonus e streak freeze illimitati
              </p>
            </div>
            <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(252,211,77,0.60)" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </a>

      </main>
      <BottomTabBar />
    </div>
  );
}
