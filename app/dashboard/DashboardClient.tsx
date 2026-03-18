'use client';

/**
 * DashboardClient  –  Disney Cartoon Bento Grid Dashboard
 *
 * Design language: Vibrant cartoon style – each data card has its own
 * color identity with a 3D stamp shadow (0 6px 0 [accent]).
 *
 * Card themes:
 *   Calorie ring  – Green  (#F0FDF4 / #16A34A stamp)
 *   Macros        – Blue   (#EFF6FF / #1D4ED8 stamp)
 *   Weekly chart  – Amber  (#FFFBEB / #B45309 stamp)
 *   Water         – Cyan   (#ECFEFF / #0E7490 stamp)
 *   Quick actions – individual vivid colors
 *   Meals list    – Warm neutral (#FFFBEB / #CA8A04 stamp)
 */

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import SprintyAssistant from '@/components/SprintyAssistant';

// ── Types ───────────────────────────────────────────────────────────────────

interface Meal {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  qty: number;
  unit: string;
  addedAt: string;
}

interface DailyStats {
  date: string;
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

interface Goals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  uid: string;
  today: string;
  stats: DailyStats;
  goals: Goals;
  todayMeals: Meal[];
  weekStats: DailyStats[];
  userName: string;
}

// ── SWR fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Card style presets ───────────────────────────────────────────────────────

const CARD = {
  green: {
    background: 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)',
    border: '2.5px solid #86EFAC',
    borderRadius: '1.5rem',
    boxShadow: '0 6px 0 #16A34A, 0 10px 28px rgba(21,128,61,0.18), inset 0 2px 0 rgba(255,255,255,0.70)',
  },
  blue: {
    background: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)',
    border: '2.5px solid #93C5FD',
    borderRadius: '1.5rem',
    boxShadow: '0 6px 0 #1D4ED8, 0 10px 28px rgba(29,78,216,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
  },
  amber: {
    background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
    border: '2.5px solid #FDE68A',
    borderRadius: '1.5rem',
    boxShadow: '0 6px 0 #B45309, 0 10px 28px rgba(180,83,9,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
  },
  cyan: {
    background: 'linear-gradient(145deg, #ECFEFF 0%, #CFFAFE 100%)',
    border: '2.5px solid #67E8F9',
    borderRadius: '1.5rem',
    boxShadow: '0 6px 0 #0E7490, 0 10px 28px rgba(14,116,144,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
  },
  purple: {
    background: 'linear-gradient(145deg, #F5F3FF 0%, #EDE9FE 100%)',
    border: '2.5px solid #C4B5FD',
    borderRadius: '1.5rem',
    boxShadow: '0 6px 0 #6D28D9, 0 10px 28px rgba(109,40,217,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
  },
  neutral: {
    background: 'linear-gradient(145deg, #FFFEF5 0%, #FFFBEB 100%)',
    border: '2.5px solid #FDE68A',
    borderRadius: '1.5rem',
    boxShadow: '0 6px 0 #CA8A04, 0 10px 28px rgba(202,138,4,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
  },
  rose: {
    background: 'linear-gradient(145deg, #FFF1F2 0%, #FFE4E6 100%)',
    border: '2.5px solid #FECDD3',
    borderRadius: '1.5rem',
    boxShadow: '0 6px 0 #BE123C, 0 10px 28px rgba(190,18,60,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
  },
} as const;

// ── Calorie ring ─────────────────────────────────────────────────────────────

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circumference * (1 - pct);
  const isOver = consumed > goal;
  const remaining = Math.abs(goal - consumed);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
      <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
        <defs>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(21,128,61,0.15)" strokeWidth="13" />
        {/* Progress */}
        <motion.circle
          cx="74" cy="74" r={radius}
          fill="none"
          stroke={isOver ? '#F43F5E' : 'url(#kcal-grad)'}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(-90 74 74)"
          filter="url(#ring-glow)"
        />
        <defs>
          <linearGradient id="kcal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl leading-none"
          style={{ color: '#14532D', fontWeight: 900 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {consumed.toLocaleString('it-IT')}
        </motion.span>
        <span className="text-xs mt-0.5 font-bold" style={{ color: '#166534' }}>
          / {goal.toLocaleString('it-IT')} kcal
        </span>
        <span
          className="text-xs font-extrabold mt-1.5 px-2 py-0.5 rounded-full"
          style={
            isOver
              ? { background: '#FFE4E6', color: '#BE123C', border: '1.5px solid #FECDD3' }
              : { background: '#BBF7D0', color: '#14532D', border: '1.5px solid #86EFAC' }
          }
        >
          {isOver
            ? `+${remaining.toLocaleString('it-IT')} oltre`
            : `${remaining.toLocaleString('it-IT')} rimaste`}
        </span>
      </div>
    </div>
  );
}

// ── Macro bar ────────────────────────────────────────────────────────────────

function MacroBar({
  label, value, goal, color, trackColor, textColor,
}: {
  label: string; value: number; goal: number; color: string; trackColor: string; textColor: string;
}) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: textColor }}>
          {label}
        </span>
        <span className="text-xs font-bold" style={{ color: textColor, opacity: 0.8 }}>
          {Math.round(value)}<span style={{ opacity: 0.6 }}>/{goal}g</span>
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: trackColor, border: '1.5px solid rgba(0,0,0,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemax={goal}
          aria-label={label}
        />
      </div>
    </div>
  );
}

// ── Water tracker ────────────────────────────────────────────────────────────

function WaterTracker({ glasses = 0 }: { glasses?: number }) {
  const [count, setCount] = useState(glasses);
  const goal = 8;

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wide mb-2" style={{ color: '#0E7490' }}>
        Acqua
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCount(i < count ? i : i + 1)}
            whileTap={{ scale: 0.75 }}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-base transition-all"
            style={
              i < count
                ? {
                    background: 'linear-gradient(145deg, #A5F3FC, #67E8F9)',
                    border: '2px solid #0E7490',
                    boxShadow: '0 3px 0 #0E7490',
                  }
                : {
                    background: 'rgba(14,116,144,0.08)',
                    border: '2px solid rgba(14,116,144,0.20)',
                  }
            }
            aria-label={`Bicchiere ${i + 1}${i < count ? ' (bevuto)' : ''}`}
          >
            💧
          </motion.button>
        ))}
      </div>
      <p className="text-xs mt-2 font-bold" style={{ color: '#0E7490' }}>
        {count} / {goal} bicchieri
      </p>
    </div>
  );
}

// ── Weekly mini-chart ────────────────────────────────────────────────────────

function WeeklyChart({ weekStats, goalKcal }: { weekStats: DailyStats[]; goalKcal: number }) {
  const max = Math.max(goalKcal * 1.25, ...weekStats.map((d) => d.totalKcal), 100);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wide mb-3" style={{ color: '#B45309' }}>
        Ultime 7 giornate
      </p>
      <div className="flex items-end gap-1.5 h-16">
        {weekStats.map((day, idx) => {
          const pct = Math.min((day.totalKcal / max) * 100, 100);
          const isToday = day.date === today;
          const isOver = day.totalKcal > goalKcal;
          const d = new Date(day.date + 'T12:00:00');

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 52 }}>
                <motion.div
                  className="w-full rounded-t-lg"
                  style={{
                    background: isToday
                      ? 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)'
                      : isOver
                      ? 'linear-gradient(180deg, #FB7185 0%, #F43F5E 100%)'
                      : 'linear-gradient(180deg, #FDE68A 0%, #FCD34D 100%)',
                    boxShadow: isToday ? '0 3px 0 #B45309' : undefined,
                    border: isToday ? '2px solid #FBBF24' : '1px solid rgba(0,0,0,0.08)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, day.totalKcal > 0 ? 10 : 2)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span
                className="text-[10px] font-extrabold"
                style={{ color: isToday ? '#B45309' : '#92400E', opacity: isToday ? 1 : 0.55 }}
              >
                {days[d.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-2 font-bold" style={{ color: '#92400E', opacity: 0.7 }}>
        Obiettivo: {goalKcal.toLocaleString('it-IT')} kcal/gg
      </p>
    </div>
  );
}

// ── NutriPoints mini-widget ───────────────────────────────────────────────────

function NutriPointsWidget({ stats, goals }: { stats: DailyStats; goals: Goals }) {
  const kcalPct = goals.kcal > 0 ? stats.totalKcal / goals.kcal : 0;
  const proteinPct = goals.protein > 0 ? stats.totalProtein / goals.protein : 0;
  const avgPct = (kcalPct + proteinPct) / 2;
  const points = Math.round(Math.min(avgPct, 1) * 100);

  const badge =
    points >= 80 ? { label: '🌟 Ottimo!', bg: '#BBF7D0', color: '#14532D' }
    : points >= 50 ? { label: '👍 Buono',  bg: '#FEF3C7', color: '#92400E' }
    : { label: '💪 Dai!',   bg: '#FFE4E6', color: '#BE123C' };

  return (
    <div className="flex items-center gap-2 pt-3 mt-auto" style={{ borderTop: '2px solid rgba(109,40,217,0.12)' }}>
      <span className="text-2xl font-black leading-none" style={{ color: '#6D28D9' }}>
        {points}
      </span>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#6D28D9' }}>NutriPts</p>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>
    </div>
  );
}

// ── Meal row ─────────────────────────────────────────────────────────────────

function MealRow({ meal, onDelete }: { meal: Meal; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(meal.id);
    setDeleting(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      className="flex items-center gap-3 py-2.5 last:border-0"
      style={{ borderBottom: '2px solid rgba(202,138,4,0.10)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold truncate" style={{ color: '#1A2E1A' }}>
          {meal.name}
        </p>
        <p className="text-xs font-bold" style={{ color: '#92400E', opacity: 0.75 }}>
          {meal.qty}{meal.unit} · P <span style={{ color: '#1D4ED8' }}>{Math.round(meal.protein)}g</span> · C <span style={{ color: '#D97706' }}>{Math.round(meal.carbs)}g</span> · G <span style={{ color: '#BE123C' }}>{Math.round(meal.fat)}g</span>
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-sm font-black px-2 py-0.5 rounded-full"
          style={{ background: '#DCFCE7', color: '#14532D', border: '1.5px solid #86EFAC' }}
        >
          {Math.round(meal.kcal)} kcal
        </span>
        <motion.button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Elimina ${meal.name}`}
          className="p-1.5 rounded-xl transition-colors disabled:opacity-40"
          style={{ background: '#FFE4E6', color: '#BE123C', border: '1.5px solid #FECDD3' }}
          whileTap={{ scale: 0.85 }}
          whileHover={{ background: '#FECDD3' } as React.CSSProperties}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </motion.button>
      </div>
    </motion.li>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────

function QuickAction({
  label, icon, href, cardStyle, labelColor,
}: {
  label: string; icon: string; href: string;
  cardStyle: React.CSSProperties; labelColor: string;
}) {
  return (
    <motion.div
      role="link"
      tabIndex={0}
      onClick={() => { window.location.href = href; }}
      onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = href; }}
      className="flex flex-col items-center gap-2 p-4 text-center cursor-pointer select-none"
      style={cardStyle}
      whileHover={{ scale: 1.04, y: -3, transition: { type: 'spring', stiffness: 340, damping: 22 } }}
      whileTap={{ scale: 0.96, y: 4 }}
    >
      <motion.span
        className="text-2xl"
        aria-hidden="true"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.span>
      <span className="text-xs font-extrabold" style={{ color: labelColor }}>{label}</span>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function DashboardClient({
  uid,
  today,
  stats: initialStats,
  goals,
  todayMeals: initialMeals,
  weekStats,
  userName,
}: Props) {
  const { data: mealsData, mutate } = useSWR(
    `/api/meals?date=${today}`,
    fetcher,
    {
      fallbackData: { meals: initialMeals, stats: initialStats },
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  const meals: Meal[] = mealsData?.meals ?? initialMeals;
  const stats: DailyStats = mealsData?.stats ?? initialStats;

  const goalPct = Math.min((stats.totalKcal / Math.max(goals.kcal, 1)) * 100, 100);
  const hitGoal = goalPct >= 85 && stats.totalKcal <= goals.kcal * 1.05;

  const handleDeleteMeal = async (mealId: string) => {
    await fetch(`/api/meals/${mealId}?date=${today}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <div className="space-y-4">

      {/* ── Row 1: Calorie Ring (tall) + Macros ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Calorie Ring – green hero card, spans 2 rows */}
        <motion.div
          className="col-span-1 flex flex-col items-center justify-center gap-2 p-4"
          style={{ ...CARD.green, gridRow: 'span 2' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <p className="text-xs font-extrabold uppercase tracking-wide self-start" style={{ color: '#166534' }}>
            Calorie
          </p>
          <CalorieRing consumed={Math.round(stats.totalKcal)} goal={goals.kcal} />
          {hitGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-xs font-extrabold px-2 py-1 rounded-full"
              style={{ background: '#BBF7D0', color: '#14532D', border: '2px solid #86EFAC' }}
            >
              <SprintyAssistant mood="success" size="xs" />
              Obiettivo!
            </motion.div>
          )}
        </motion.div>

        {/* Macros – blue card, col-span-2 */}
        <motion.div
          className="col-span-2 flex flex-col justify-center gap-3.5 p-4"
          style={CARD.blue}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
        >
          <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#1D4ED8' }}>
            Macronutrienti
          </p>
          <MacroBar
            label="Proteine" value={stats.totalProtein} goal={goals.protein}
            color="linear-gradient(90deg, #60A5FA, #3B82F6)" trackColor="#BFDBFE" textColor="#1E3A8A"
          />
          <MacroBar
            label="Carboidrati" value={stats.totalCarbs} goal={goals.carbs}
            color="linear-gradient(90deg, #FBBF24, #F59E0B)" trackColor="#FDE68A" textColor="#78350F"
          />
          <MacroBar
            label="Grassi" value={stats.totalFat} goal={goals.fat}
            color="linear-gradient(90deg, #FB7185, #F43F5E)" trackColor="#FECDD3" textColor="#881337"
          />
        </motion.div>
      </div>

      {/* ── Row 2: Weekly chart + Water (below macros, right of calorie ring) ── */}
      {weekStats.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            className="col-span-2 p-4"
            style={CARD.amber}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.16 }}
          >
            <WeeklyChart weekStats={weekStats} goalKcal={goals.kcal} />
          </motion.div>
          <motion.div
            className="col-span-1 p-4 flex flex-col"
            style={CARD.cyan}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.22 }}
          >
            <WaterTracker />
            <NutriPointsWidget stats={stats} goals={goals} />
          </motion.div>
        </div>
      )}

      {/* ── Row 3: Quick actions ── */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction
          label="Cerca cibo"
          icon="🔍"
          href="/diary"
          cardStyle={CARD.blue}
          labelColor="#1D4ED8"
        />
        <QuickAction
          label="Scansiona"
          icon="📷"
          href="/diary?scan=1"
          cardStyle={CARD.purple}
          labelColor="#6D28D9"
        />
        <QuickAction
          label="Peso"
          icon="⚖️"
          href="/weight"
          cardStyle={CARD.amber}
          labelColor="#B45309"
        />
      </div>

      {/* ── Row 4: Today's meals ── */}
      <motion.div
        className="p-4"
        style={CARD.neutral}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.30 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold" style={{ color: '#1A2E1A' }}>
            Pasti di oggi
            {meals.length > 0 && (
              <span
                className="ml-2 text-xs font-extrabold px-2 py-0.5 rounded-full"
                style={{ background: '#FEF3C7', color: '#B45309', border: '1.5px solid #FDE68A' }}
              >
                {meals.length}
              </span>
            )}
          </h3>
          <motion.a
            href="/diary"
            className="text-xs font-extrabold px-3 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(145deg, #F0FDF4, #DCFCE7)',
              color: '#14532D',
              border: '2px solid #86EFAC',
              boxShadow: '0 3px 0 #16A34A',
            }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.97, y: 2 }}
          >
            + Aggiungi
          </motion.a>
        </div>

        {meals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6 flex flex-col items-center gap-3"
          >
            <SprintyAssistant
              mood="idle"
              size="sm"
              message="Nessun pasto ancora! Inizia ad aggiungere il tuo primo pasto."
            />
          </motion.div>
        ) : (
          <AnimatePresence>
            <ul>
              {meals.map((meal) => (
                <MealRow key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
              ))}
            </ul>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
