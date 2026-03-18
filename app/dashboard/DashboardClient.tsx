'use client';

/**
 * DashboardClient  –  Dark Glass Dashboard
 *
 * Design: Deep space backdrop + frosted glass cards + neon data.
 * Data colors: Amber (calories) · Cyan (protein) · Orange (carbs) · Rose (fat)
 */

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

interface Meal {
  id: string; name: string; kcal: number;
  protein: number; carbs: number; fat: number;
  qty: number; unit: string; addedAt: string;
}
interface DailyStats {
  date: string; totalKcal: number; totalProtein: number;
  totalCarbs: number; totalFat: number; mealCount: number;
}
interface Goals { kcal: number; protein: number; carbs: number; fat: number; }
interface Props {
  uid: string; today: string; stats: DailyStats; goals: Goals;
  todayMeals: Meal[]; weekStats: DailyStats[]; userName: string;
}

// ── Glass card presets ────────────────────────────────────────────────────────

const G = {
  base: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '1.5rem',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  violet: {
    background: 'rgba(139,92,246,0.10)',
    border: '1px solid rgba(139,92,246,0.30)',
    borderRadius: '1.5rem',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(139,92,246,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  amber: {
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.28)',
    borderRadius: '1.5rem',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(245,158,11,0.10)',
  },
  cyan: {
    background: 'rgba(34,211,238,0.07)',
    border: '1px solid rgba(34,211,238,0.22)',
    borderRadius: '1.5rem',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(34,211,238,0.08)',
  },
  emerald: {
    background: 'rgba(52,211,153,0.07)',
    border: '1px solid rgba(52,211,153,0.22)',
    borderRadius: '1.5rem',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(52,211,153,0.08)',
  },
  rose: {
    background: 'rgba(248,113,113,0.07)',
    border: '1px solid rgba(248,113,113,0.22)',
    borderRadius: '1.5rem',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(248,113,113,0.08)',
  },
} as const;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Calorie Ring ─────────────────────────────────────────────────────────────

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
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="kcal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isOver ? '#F87171' : '#F59E0B'} />
            <stop offset="100%" stopColor={isOver ? '#EF4444' : '#FCD34D'} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="13" />
        {/* Progress */}
        <motion.circle
          cx="74" cy="74" r={radius}
          fill="none"
          stroke="url(#kcal-grad)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          transform="rotate(-90 74 74)"
          filter="url(#ring-glow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl leading-none font-black"
          style={{ color: isOver ? '#F87171' : '#FCD34D' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {consumed.toLocaleString('it-IT')}
        </motion.span>
        <span className="text-[10px] mt-0.5 font-bold" style={{ color: 'rgba(248,250,252,0.55)' }}>
          / {goal.toLocaleString('it-IT')} kcal
        </span>
        <span
          className="text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full"
          style={
            isOver
              ? { background: 'rgba(248,113,113,0.18)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.35)' }
              : { background: 'rgba(245,158,11,0.18)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.35)' }
          }
        >
          {isOver ? `+${remaining.toLocaleString('it-IT')} oltre` : `${remaining.toLocaleString('it-IT')} rim.`}
        </span>
      </div>
    </div>
  );
}

// ── Macro Bar ─────────────────────────────────────────────────────────────────

function MacroBar({
  label, value, goal, fillClass, labelColor, trackColor,
}: {
  label: string; value: number; goal: number;
  fillClass: string; labelColor: string; trackColor?: string;
}) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: labelColor }}>
          {label}
        </span>
        <span className="text-xs font-semibold" style={{ color: 'rgba(248,250,252,0.55)' }}>
          {Math.round(value)}<span style={{ opacity: 0.6 }}>/{goal}g</span>
        </span>
      </div>
      <div className="macro-track" style={trackColor ? { background: trackColor } : {}}>
        <motion.div
          className={`h-full rounded-full ${fillClass}`}
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

// ── Water Tracker ─────────────────────────────────────────────────────────────

function WaterTracker({ glasses = 0 }: { glasses?: number }) {
  const [count, setCount] = useState(glasses);
  const goal = 8;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#22D3EE' }}>Acqua</p>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCount(i < count ? i : i + 1)}
            whileTap={{ scale: 0.72 }}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all"
            style={
              i < count
                ? { background: 'rgba(34,211,238,0.25)', border: '1px solid rgba(34,211,238,0.60)', boxShadow: '0 0 10px rgba(34,211,238,0.40)' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }
            }
            aria-label={`Bicchiere ${i + 1}`}
          >💧</motion.button>
        ))}
      </div>
      <p className="text-xs mt-1.5 font-semibold" style={{ color: 'rgba(34,211,238,0.70)' }}>
        {count}/{goal} bicchieri
      </p>
    </div>
  );
}

// ── Weekly Chart ──────────────────────────────────────────────────────────────

function WeeklyChart({ weekStats, goalKcal }: { weekStats: DailyStats[]; goalKcal: number }) {
  const max = Math.max(goalKcal * 1.25, ...weekStats.map((d) => d.totalKcal), 100);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,250,252,0.55)' }}>
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
                  className="w-full rounded-t-md"
                  style={{
                    background: isToday
                      ? 'linear-gradient(180deg, #FBBF24, #F59E0B)'
                      : isOver
                      ? 'linear-gradient(180deg, #F87171, #EF4444)'
                      : 'rgba(255,255,255,0.12)',
                    boxShadow: isToday ? '0 0 12px rgba(245,158,11,0.60)' : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, day.totalKcal > 0 ? 8 : 2)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span className="text-[9px] font-bold" style={{ color: isToday ? '#FBBF24' : 'rgba(248,250,252,0.40)' }}>
                {days[d.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mt-2 font-semibold" style={{ color: 'rgba(248,250,252,0.38)' }}>
        Target: {goalKcal.toLocaleString('it-IT')} kcal/gg
      </p>
    </div>
  );
}

// ── NutriPoints ───────────────────────────────────────────────────────────────

function NutriPointsWidget({ stats, goals }: { stats: DailyStats; goals: Goals }) {
  const avg = ((stats.totalKcal / Math.max(goals.kcal, 1)) + (stats.totalProtein / Math.max(goals.protein, 1))) / 2;
  const points = Math.round(Math.min(avg, 1) * 100);
  const badge = points >= 80 ? { label: '🌟 Top!', color: '#34D399' }
    : points >= 50 ? { label: '👍 Bene', color: '#FBBF24' }
    : { label: '💪 Dai!', color: '#F87171' };
  return (
    <div className="flex items-center gap-2 pt-2.5 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-2xl font-black" style={{ color: '#A78BFA', textShadow: '0 0 16px rgba(167,139,250,0.60)' }}>
        {points}
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(167,139,250,0.70)' }}>NutriPts</p>
        <span className="text-[10px] font-bold" style={{ color: badge.color }}>{badge.label}</span>
      </div>
    </div>
  );
}

// ── Meal Row ──────────────────────────────────────────────────────────────────

function MealRow({ meal, onDelete }: { meal: Meal; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      className="flex items-center gap-3 py-2.5 last:border-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: '#F8FAFC' }}>{meal.name}</p>
        <p className="text-xs" style={{ color: 'rgba(248,250,252,0.50)' }}>
          {meal.qty}{meal.unit} ·{' '}
          <span style={{ color: '#67E8F9' }}>P {Math.round(meal.protein)}g</span>{' '}·{' '}
          <span style={{ color: '#FDBA74' }}>C {Math.round(meal.carbs)}g</span>{' '}·{' '}
          <span style={{ color: '#FCA5A5' }}>G {Math.round(meal.fat)}g</span>
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(245,158,11,0.18)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.30)' }}
        >
          {Math.round(meal.kcal)} kcal
        </span>
        <motion.button
          onClick={async () => { setDeleting(true); await onDelete(meal.id); setDeleting(false); }}
          disabled={deleting}
          aria-label={`Elimina ${meal.name}`}
          className="p-1.5 rounded-xl disabled:opacity-40"
          style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.22)' }}
          whileTap={{ scale: 0.85 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </motion.button>
      </div>
    </motion.li>
  );
}

// ── Quick Action ──────────────────────────────────────────────────────────────

function QuickAction({ label, icon, href, accent }: {
  label: string; icon: string; href: string; accent: string;
}) {
  return (
    <motion.div
      role="link" tabIndex={0}
      onClick={() => { window.location.href = href; }}
      onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = href; }}
      className="flex flex-col items-center gap-1.5 py-3 px-2 text-center cursor-pointer select-none rounded-2xl"
      style={{
        background: `rgba(${accent},0.08)`,
        border: `1px solid rgba(${accent},0.22)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      whileHover={{ scale: 1.06, y: -3, transition: { type: 'spring', stiffness: 340, damping: 22 } }}
      whileTap={{ scale: 0.94, y: 2 }}
    >
      <motion.span
        className="text-2xl"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.span>
      <span className="text-[10px] font-bold" style={{ color: `rgba(248,250,252,0.70)` }}>{label}</span>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardClient({
  uid, today, stats: initialStats, goals, todayMeals: initialMeals, weekStats, userName,
}: Props) {
  const { data: mealsData, mutate } = useSWR(`/api/meals?date=${today}`, fetcher, {
    fallbackData: { meals: initialMeals, stats: initialStats },
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const meals: Meal[] = mealsData?.meals ?? initialMeals;
  const stats: DailyStats = mealsData?.stats ?? initialStats;
  const hitGoal = stats.totalKcal >= goals.kcal * 0.85 && stats.totalKcal <= goals.kcal * 1.05;

  const handleDeleteMeal = async (mealId: string) => {
    await fetch(`/api/meals/${mealId}?date=${today}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <div className="space-y-3">

      {/* ── Row 1: Calorie Ring + Macros ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Calorie card — spans 2 rows */}
        <motion.div
          className="col-span-1 flex flex-col items-center justify-center gap-2 p-4"
          style={{ ...G.amber, gridRow: 'span 2' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <p className="text-xs font-bold uppercase tracking-wide self-start" style={{ color: 'rgba(252,211,77,0.70)' }}>
            Calorie
          </p>
          <CalorieRing consumed={Math.round(stats.totalKcal)} goal={goals.kcal} />
          {hitGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(52,211,153,0.18)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.30)' }}
            >
              ✨ Obiettivo!
            </motion.div>
          )}
        </motion.div>

        {/* Macros */}
        <motion.div
          className="col-span-2 flex flex-col justify-center gap-3.5 p-4"
          style={G.base}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
        >
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(248,250,252,0.55)' }}>
            Macronutrienti
          </p>
          <MacroBar label="Proteine"    value={stats.totalProtein} goal={goals.protein} fillClass="macro-fill-cyan"   labelColor="#22D3EE" />
          <MacroBar label="Carboidrati" value={stats.totalCarbs}   goal={goals.carbs}   fillClass="macro-fill-orange" labelColor="#FB923C" />
          <MacroBar label="Grassi"      value={stats.totalFat}     goal={goals.fat}     fillClass="macro-fill-rose"   labelColor="#F87171" />
        </motion.div>
      </div>

      {/* ── Row 2: Weekly Chart + Water ── */}
      {weekStats.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            className="col-span-2 p-4"
            style={G.base}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.16 }}
          >
            <WeeklyChart weekStats={weekStats} goalKcal={goals.kcal} />
          </motion.div>
          <motion.div
            className="col-span-1 p-3.5 flex flex-col"
            style={G.cyan}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.22 }}
          >
            <WaterTracker />
            <NutriPointsWidget stats={stats} goals={goals} />
          </motion.div>
        </div>
      )}

      {/* ── Row 3: Quick Actions ── */}
      <div className="grid grid-cols-4 gap-2.5">
        <QuickAction label="Diario"   icon="📋" href="/diary"     accent="34,211,238" />
        <QuickAction label="Peso"     icon="⚖️" href="/weight"    accent="245,158,11" />
        <QuickAction label="Leghe"    icon="🏆" href="/leagues"   accent="168,85,247" />
        <QuickAction label="Imposta." icon="⚙️" href="/settings"  accent="248,113,113" />
      </div>

      {/* ── Row 4: Today's Meals ── */}
      <motion.div
        className="p-4"
        style={G.base}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.30 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: '#F8FAFC' }}>
            Pasti di oggi
            {meals.length > 0 && (
              <span
                className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.18)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.30)' }}
              >
                {meals.length}
              </span>
            )}
          </h3>
          <motion.a
            href="/diary"
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(139,92,246,0.18)',
              color: '#C4B5FD',
              border: '1px solid rgba(139,92,246,0.35)',
              boxShadow: '0 0 12px rgba(139,92,246,0.25)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            + Aggiungi
          </motion.a>
        </div>

        {meals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">🍽️</span>
            <p className="text-sm font-bold" style={{ color: 'rgba(248,250,252,0.65)' }}>Nessun pasto ancora</p>
            <p className="text-xs" style={{ color: 'rgba(248,250,252,0.40)' }}>
              Aggiungi il tuo primo pasto per iniziare!
            </p>
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
