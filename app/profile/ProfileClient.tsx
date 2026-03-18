'use client';

/**
 * ProfileClient.tsx  –  Horizontal Swipe Navigation for Profile Sub-sections
 *
 * Three tabs: Awards, History, Stats
 * Swiping left/right between them uses Framer Motion drag gestures.
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
  streak: {
    current: number;
    longest: number;
    freezeTokens: number;
  };
  weightTrend: GoldMetrics[];
  league: (LeagueDefinition & { tier: LeagueTier }) | null;
}

const TABS = ['Premi', 'Storico', 'Statistiche'] as const;
type Tab = typeof TABS[number];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export default function ProfileClient({
  user,
  streak,
  weightTrend,
  league,
}: ProfileClientProps) {
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
    if (info.offset.x < -threshold && tabIndex < TABS.length - 1) {
      goTo(TABS[tabIndex + 1]);
    } else if (info.offset.x > threshold && tabIndex > 0) {
      goTo(TABS[tabIndex - 1]);
    }
  }

  return (
    <div>
      {/* Profile card */}
      <div
        className="p-4 rounded-3xl mb-4 flex items-center gap-4"
        style={{
          background: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '2.5px solid #BFDBFE',
          boxShadow: '0 6px 0 #1D4ED8, 0 10px 28px rgba(29,78,216,0.12)',
        }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full text-2xl"
          style={{
            width: 60, height: 60,
            background: 'linear-gradient(145deg, #BFDBFE, #93C5FD)',
            border: '3px solid #60A5FA',
            boxShadow: '0 4px 0 #1D4ED8',
            fontFamily: 'var(--font-display)',
          }}
        >
          {user.name.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <h2
            className="text-xl truncate"
            style={{ fontFamily: 'var(--font-display)', color: '#1E3A8A' }}
          >
            {user.name}
          </h2>
          <p
            className="text-sm truncate"
            style={{ fontFamily: 'var(--font-ui)', color: '#1D4ED8', opacity: 0.7 }}
          >
            {user.email}
          </p>
          {league && (
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
              style={{
                fontFamily: 'var(--font-ui)',
                background: league.bgGradient,
                color: league.color,
                border: `1.5px solid ${league.borderColor}`,
              }}
            >
              {league.emoji} {league.name}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex rounded-2xl p-1 mb-4 gap-1"
        style={{
          background: 'rgba(255,255,255,0.7)',
          border: '2px solid #BFDBFE',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => goTo(tab)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              fontFamily: 'var(--font-ui)',
              background: activeTab === tab
                ? 'linear-gradient(145deg, #DBEAFE, #BFDBFE)'
                : 'transparent',
              color: activeTab === tab ? '#1E3A8A' : '#6B7280',
              boxShadow: activeTab === tab
                ? '0 2px 0 #1D4ED8, inset 0 1px 0 rgba(255,255,255,0.8)'
                : 'none',
              border: activeTab === tab ? '1.5px solid #93C5FD' : '1.5px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 36 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            {activeTab === 'Premi' && (
              <AwardsTab streak={streak} league={league} />
            )}
            {activeTab === 'Storico' && (
              <HistoryTab weightTrend={weightTrend} />
            )}
            {activeTab === 'Statistiche' && (
              <StatsTab user={user} streak={streak} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function AwardsTab({
  streak,
  league,
}: {
  streak: ProfileClientProps['streak'];
  league: ProfileClientProps['league'];
}) {
  const badges = [
    {
      earned: streak.current >= 3,
      emoji: '🔥',
      label: '3 giorni di fila',
      desc: `Streak attuale: ${streak.current}`,
    },
    {
      earned: streak.current >= 7,
      emoji: '⚡',
      label: 'Una settimana!',
      desc: 'Streak di 7 giorni',
    },
    {
      earned: streak.longest >= 30,
      emoji: '🏆',
      label: 'Mese intero',
      desc: 'Record: 30+ giorni',
    },
    {
      earned: !!league && league.tier !== 'bronze',
      emoji: league?.emoji ?? '🥉',
      label: league?.name ?? 'Lega Bronze',
      desc: 'Promosso di lega',
    },
    {
      earned: streak.freezeTokens > 0,
      emoji: '🧊',
      label: 'Streak Freeze',
      desc: `${streak.freezeTokens} token disponibili`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className={`p-4 rounded-2xl ${badge.earned ? 'badge-bouncy' : ''}`}
          style={{
            background: badge.earned
              ? 'linear-gradient(145deg, #FEF9C3, #FDE68A)'
              : 'linear-gradient(145deg, #F9FAFB, #F3F4F6)',
            border: `2px solid ${badge.earned ? '#FBBF24' : '#E5E7EB'}`,
            boxShadow: badge.earned
              ? '0 4px 0 #D97706, 0 6px 16px rgba(217,119,6,0.15)'
              : '0 2px 0 #D1D5DB',
            opacity: badge.earned ? 1 : 0.5,
            filter: badge.earned ? 'none' : 'grayscale(1)',
          }}
        >
          <div className="text-3xl mb-1">{badge.emoji}</div>
          <p
            className="text-sm font-bold leading-tight"
            style={{
              fontFamily: 'var(--font-ui)',
              color: badge.earned ? '#92400E' : '#6B7280',
            }}
          >
            {badge.label}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: 'var(--font-ui)', color: badge.earned ? '#B45309' : '#9CA3AF' }}
          >
            {badge.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ weightTrend }: { weightTrend: GoldMetrics[] }) {
  if (weightTrend.length === 0) {
    return (
      <div
        className="p-6 rounded-2xl text-center"
        style={{
          background: 'rgba(255,255,255,0.7)',
          border: '2px solid #BFDBFE',
        }}
      >
        <p
          className="text-4xl mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          📊
        </p>
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-ui)', color: '#6B7280' }}
        >
          Inizia a registrare il tuo peso per vedere la cronologia
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weightTrend.map((w) => (
        <div
          key={w.period}
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '2px solid #BFDBFE',
            boxShadow: '0 3px 0 #93C5FD',
          }}
        >
          <div>
            <p
              className="text-sm font-bold"
              style={{ fontFamily: 'var(--font-ui)', color: '#1E3A8A' }}
            >
              {w.period.replace('week_', 'Settimana ').replace('month_', '')}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: 'var(--font-ui)', color: '#6B7280' }}
            >
              {w.sampleCount} rilevazioni
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-ui)', color: '#1E3A8A' }}
            >
              {w.avgKg} kg
            </p>
            <p
              className="text-xs"
              style={{
                fontFamily: 'var(--font-ui)',
                color: w.trend < 0 ? '#15803D' : w.trend > 0 ? '#BE123C' : '#6B7280',
              }}
            >
              {w.trend > 0 ? '↑' : w.trend < 0 ? '↓' : '→'}{' '}
              {Math.abs(w.trend).toFixed(2)} kg/g
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsTab({
  user,
  streak,
}: {
  user: ProfileClientProps['user'];
  streak: ProfileClientProps['streak'];
}) {
  const stats = [
    { label: 'Streak attuale', value: `${streak.current} 🔥`, color: '#B45309' },
    { label: 'Record streak', value: `${streak.longest} ⚡`, color: '#1D4ED8' },
    { label: 'Streak Freeze', value: `${streak.freezeTokens} 🧊`, color: '#0E7490' },
    { label: 'Obiettivo kcal', value: `${user.goals.kcal} kcal`, color: '#15803D' },
    { label: 'Obiettivo proteine', value: `${user.goals.protein}g`, color: '#1D4ED8' },
    { label: 'Obiettivo carboidrati', value: `${user.goals.carbs}g`, color: '#B45309' },
    { label: 'Obiettivo grassi', value: `${user.goals.fat}g`, color: '#BE123C' },
  ];

  return (
    <div className="space-y-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '2px solid #BFDBFE',
            boxShadow: '0 2px 0 #93C5FD',
          }}
        >
          <span
            className="text-sm"
            style={{ fontFamily: 'var(--font-ui)', color: '#374151' }}
          >
            {stat.label}
          </span>
          <span
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-ui)', color: stat.color }}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
