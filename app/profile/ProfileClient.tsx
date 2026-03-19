'use client';

/**
 * ProfileClient.tsx  –  User Profile with Premium Section
 *
 * Redesigned with:
 *  • Premium upgrade banner at top (for free users)
 *  • Large avatar with gradient ring
 *  • Streak & league highlights
 *  • Swipeable tabs: Premi / Stats / Storico
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import type { GoldMetrics } from '@/lib/repositories/weightRepository';
import type { LeagueDefinition, LeagueTier } from '@/lib/repositories/leagueRepository';

interface ProfileClientProps {
  user: {
    name: string;
    email: string;
    goals: { kcal: number; protein: number; carbs: number; fat: number };
  };
  streak: { current: number; longest: number; freezeTokens: number };
  weightTrend: GoldMetrics[];
  league: (LeagueDefinition & { tier: LeagueTier }) | null;
}

const TABS = ['Premi', 'Statistiche', 'Storico'] as const;
type Tab = typeof TABS[number];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
};

export default function ProfileClient({ user, streak, weightTrend, league }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Premi');
  const [direction, setDirection] = useState(0);
  const tabIndex = TABS.indexOf(activeTab);

  function goTo(tab: Tab) {
    const newIdx = TABS.indexOf(tab);
    setDirection(newIdx > tabIndex ? 1 : -1);
    setActiveTab(tab);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const threshold = 60;
    if (info.offset.x < -threshold && tabIndex < TABS.length - 1) goTo(TABS[tabIndex + 1]);
    else if (info.offset.x > threshold && tabIndex > 0) goTo(TABS[tabIndex - 1]);
  }

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const G = {
    base: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
    cyan: { background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.22)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
    amber: { background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
    violet: { background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
  };

  return (
    <div className="space-y-4">

      {/* ── Premium Banner ── */}
      <motion.a
        href="/premium"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="block relative overflow-hidden rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(139,92,246,0.12))',
          border: '1px solid rgba(245,158,11,0.30)',
        }}
      >
        <div className="absolute top-0 right-0 w-24 h-24"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.20) 0%, transparent 70%)', filter: 'blur(20px)' }}/>
        <div className="relative flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>
              Prova Premium Gratis per 7 giorni
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>
              AI illimitata · Grafici avanzati · Streak freeze ∞ · €4,99/mese
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(252,211,77,0.60)" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </motion.a>

      {/* ── Profile Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="relative overflow-hidden"
        style={G.cyan}
      >
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}/>

        <div className="relative p-5">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(139,92,246,0.25))',
                  border: '2px solid rgba(34,211,238,0.40)',
                  color: '#F8FAFC',
                  fontFamily: 'var(--font-ui)',
                  boxShadow: '0 0 24px rgba(34,211,238,0.30)',
                }}
              >
                {initials}
              </div>
              {league && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: 'rgba(8,11,20,0.90)', border: '1.5px solid rgba(255,255,255,0.20)' }}>
                  {league.emoji}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl truncate" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
                {user.name}
              </h2>
              <p className="text-sm truncate" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>
                {user.email}
              </p>
              {league && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-semibold"
                  style={{ background: 'rgba(255,255,255,0.10)', color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.18)', fontFamily: 'var(--font-ui)' }}>
                  {league.emoji} {league.name}
                </span>
              )}
            </div>

            <a href="/settings" className="flex-shrink-0 p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(248,250,252,0.55)" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </a>
          </div>

          {/* Streak + Goals quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '🔥', value: streak.current, label: 'Streak', color: '#FCD34D' },
              { icon: '⚡', value: streak.longest, label: 'Record', color: '#A78BFA' },
              { icon: '🧊', value: streak.freezeTokens, label: 'Freeze', color: '#67E8F9' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="text-base mb-0.5">{stat.icon}</div>
                <p className="text-lg font-black leading-none" style={{ color: stat.color, fontFamily: 'var(--font-ui)' }}>
                  {stat.value}
                </p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'rgba(248,250,252,0.40)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => goTo(tab)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeTab === tab ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: activeTab === tab ? '#F8FAFC' : 'rgba(248,250,252,0.38)',
              border: activeTab === tab ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
              fontFamily: 'var(--font-ui)',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Swipeable Content ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 36 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            {activeTab === 'Premi'      && <AwardsTab streak={streak} league={league} G={G}/>}
            {activeTab === 'Statistiche' && <StatsTab user={user} streak={streak} G={G}/>}
            {activeTab === 'Storico'    && <HistoryTab weightTrend={weightTrend} G={G}/>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-panels ─────────────────────────────────────────────────────────────────

function AwardsTab({ streak, league, G }: {
  streak: ProfileClientProps['streak'];
  league: ProfileClientProps['league'];
  G: Record<string, React.CSSProperties>;
}) {
  const badges = [
    { earned: streak.current >= 3,   emoji: '🔥', label: '3 giorni di fila',  desc: `Streak: ${streak.current}`,         color: '245,158,11' },
    { earned: streak.current >= 7,   emoji: '⚡', label: 'Una settimana!',     desc: 'Streak di 7 giorni',                color: '139,92,246' },
    { earned: streak.current >= 30,  emoji: '🌙', label: 'Un mese!',           desc: 'Streak di 30 giorni',               color: '34,211,238' },
    { earned: streak.longest >= 30,  emoji: '🏆', label: 'Mese intero record', desc: `Record: ${streak.longest} giorni`,  color: '245,158,11' },
    { earned: !!league && league.tier !== 'bronze', emoji: league?.emoji ?? '🥉', label: league?.name ?? 'Lega Bronze', desc: 'Promosso di lega', color: '168,85,247' },
    { earned: streak.freezeTokens > 0, emoji: '🧊', label: 'Streak Freeze',   desc: `${streak.freezeTokens} disponibili`, color: '34,211,238' },
    { earned: streak.longest >= 7,   emoji: '💪', label: 'Costante',          desc: 'Record 7+ giorni',                  color: '52,211,153' },
    { earned: streak.current >= 14,  emoji: '🌟', label: 'Due settimane!',    desc: 'Streak di 14 giorni',               color: '245,158,11' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {badges.map((badge) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: badge.earned ? 1 : 0.4, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280 }}
          className="p-3.5 rounded-2xl"
          style={{
            background: badge.earned ? `rgba(${badge.color},0.12)` : 'rgba(255,255,255,0.04)',
            border: badge.earned ? `1px solid rgba(${badge.color},0.30)` : '1px solid rgba(255,255,255,0.08)',
            filter: badge.earned ? 'none' : 'grayscale(1)',
          }}
        >
          <div className="text-2xl mb-1.5">{badge.emoji}</div>
          <p className="text-xs font-bold leading-tight mb-0.5" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
            {badge.label}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>
            {badge.desc}
          </p>
          {badge.earned && (
            <div className="mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block"
              style={{ background: `rgba(${badge.color},0.20)`, color: `rgb(${badge.color})` }}>
              Sbloccato ✓
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function StatsTab({ user, streak, G }: {
  user: ProfileClientProps['user'];
  streak: ProfileClientProps['streak'];
  G: Record<string, React.CSSProperties>;
}) {
  const stats = [
    { label: 'Streak attuale',     value: `${streak.current}`,         unit: 'giorni', icon: '🔥', color: '#FCD34D' },
    { label: 'Record streak',      value: `${streak.longest}`,         unit: 'giorni', icon: '⚡', color: '#A78BFA' },
    { label: 'Streak Freeze',      value: `${streak.freezeTokens}`,    unit: 'token',  icon: '🧊', color: '#67E8F9' },
    { label: 'Obiettivo calorie',  value: `${user.goals.kcal}`,        unit: 'kcal',   icon: '🔥', color: '#FCD34D' },
    { label: 'Obiettivo proteine', value: `${user.goals.protein}`,     unit: 'g',      icon: '💪', color: '#22D3EE' },
    { label: 'Obiettivo carb.',    value: `${user.goals.carbs}`,       unit: 'g',      icon: '🌾', color: '#FB923C' },
    { label: 'Obiettivo grassi',   value: `${user.goals.fat}`,         unit: 'g',      icon: '🥑', color: '#F87171' },
  ];

  return (
    <div className="space-y-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{stat.icon}</span>
            <span className="text-sm" style={{ color: 'rgba(248,250,252,0.65)', fontFamily: 'var(--font-ui)' }}>
              {stat.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black" style={{ color: stat.color, fontFamily: 'var(--font-ui)' }}>
              {stat.value}
            </span>
            <span className="text-xs" style={{ color: 'rgba(248,250,252,0.40)', fontFamily: 'var(--font-ui)' }}>
              {stat.unit}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function HistoryTab({ weightTrend, G }: {
  weightTrend: GoldMetrics[];
  G: Record<string, React.CSSProperties>;
}) {
  if (weightTrend.length === 0) {
    return (
      <div className="p-8 rounded-2xl text-center" style={G.base}>
        <span className="text-4xl">📊</span>
        <p className="text-sm mt-3" style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>
          Inizia a registrare il peso per vedere la cronologia
        </p>
        <a href="/insights" className="inline-block mt-3 text-xs px-4 py-2 rounded-xl font-bold"
          style={{ background: 'rgba(52,211,153,0.18)', color: '#34D399', border: '1px solid rgba(52,211,153,0.30)', fontFamily: 'var(--font-ui)' }}>
          ⚖️ Vai a Insights
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {weightTrend.map((w, i) => (
        <motion.div
          key={w.period}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
              {w.period.replace('week_', 'Settimana ').replace('month_', '')}
            </p>
            <p className="text-xs" style={{ color: 'rgba(248,250,252,0.45)', fontFamily: 'var(--font-ui)' }}>
              {w.sampleCount} rilevazioni
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
              {w.avgKg} kg
            </p>
            <p className="text-xs font-bold" style={{
              color: w.trend < 0 ? '#34D399' : w.trend > 0 ? '#F87171' : 'rgba(248,250,252,0.45)',
              fontFamily: 'var(--font-ui)',
            }}>
              {w.trend > 0 ? '↑' : w.trend < 0 ? '↓' : '→'} {Math.abs(w.trend).toFixed(2)} kg/g
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
