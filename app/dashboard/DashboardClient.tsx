'use client';

/**
 * DashboardClient  –  Glassmorphic Bento Grid Dashboard
 *
 * Design language: Deep Slate + Glassmorphism + Bento Grid
 * Palette: Avocado Green (#4ade80) · Electric Blue (#60a5fa) · Amber (#fbbf24)
 * Animation: Framer Motion micro-interactions (card tilt on hover, counters)
 */

import { useState } from 'react';
import useSWR from 'swr';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

// ── Tilt card wrapper ────────────────────────────────────────────────────────

function TiltCard({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(nx);
    y.set(ny);
  }
  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`glass-card p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}

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
        {/* Glow filter */}
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
        <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
        {/* Progress */}
        <motion.circle
          cx="74"
          cy="74"
          r={radius}
          fill="none"
          stroke={isOver ? '#fb7185' : '#4ade80'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(-90 74 74)"
          filter="url(#ring-glow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold font-mono text-white leading-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {consumed.toLocaleString('it-IT')}
        </motion.span>
        <span className="text-xs text-slate-400 mt-0.5">/ {goal.toLocaleString('it-IT')} kcal</span>
        <span
          className={[
            'text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-full',
            isOver
              ? 'bg-rose-500/20 text-rose-400'
              : 'bg-green-500/20 text-green-400',
          ].join(' ')}
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
  label,
  value,
  goal,
  color,
  glowColor,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  glowColor: string;
}) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-mono text-slate-300">
          {Math.round(value)}g
          <span className="text-slate-500"> / {goal}g</span>
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${glowColor}` }}
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
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Acqua</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCount(i < count ? i : i + 1)}
            whileTap={{ scale: 0.85 }}
            className={[
              'w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all',
              i < count
                ? 'bg-blue-500/30 border border-blue-400/50 text-blue-300'
                : 'bg-white/5 border border-white/10 text-slate-600',
            ].join(' ')}
            aria-label={`Bicchiere ${i + 1}${i < count ? ' (bevuto)' : ''}`}
          >
            💧
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1.5">
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
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Ultime 7 giornate</p>
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
                    backgroundColor: isToday ? '#4ade80' : isOver ? '#fb7185' : '#60a5fa',
                    opacity: isToday ? 1 : 0.55,
                    boxShadow: isToday ? '0 0 8px rgba(74,222,128,0.4)' : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, day.totalKcal > 0 ? 10 : 2)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span className={`text-[10px] ${isToday ? 'text-green-400 font-bold' : 'text-slate-500'}`}>
                {days[d.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Obiettivo: {goalKcal.toLocaleString('it-IT')} kcal/gg
      </p>
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
      className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{meal.name}</p>
        <p className="text-xs text-slate-500">
          {meal.qty}{meal.unit} · P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · G {Math.round(meal.fat)}g
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold font-mono text-slate-200">
          {Math.round(meal.kcal)} kcal
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Elimina ${meal.name}`}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-500/15 hover:text-rose-400 transition-colors disabled:opacity-40"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </button>
      </div>
    </motion.li>
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

      {/* ── Row 1: Calorie ring + Macros (2-col bento) ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Calorie ring */}
        <TiltCard className="flex flex-col items-center justify-center gap-2 col-span-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide self-start">Calorie</p>
          <CalorieRing consumed={Math.round(stats.totalKcal)} goal={goals.kcal} />
          {hitGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/15 px-2 py-1 rounded-full border border-green-500/30"
            >
              <SprintyAssistant mood="success" size="xs" />
              Obiettivo!
            </motion.div>
          )}
        </TiltCard>

        {/* Macros */}
        <TiltCard className="flex flex-col justify-center gap-4 col-span-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Macro</p>
          <MacroBar label="Proteine"    value={stats.totalProtein} goal={goals.protein} color="#4ade80" glowColor="rgba(74,222,128,0.4)" />
          <MacroBar label="Carboidrati" value={stats.totalCarbs}   goal={goals.carbs}   color="#fbbf24" glowColor="rgba(251,191,36,0.4)" />
          <MacroBar label="Grassi"      value={stats.totalFat}     goal={goals.fat}     color="#fb7185" glowColor="rgba(251,113,133,0.4)" />
        </TiltCard>
      </div>

      {/* ── Row 2: Quick actions (3-col bento) ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cerca cibo',  icon: '🔍', href: '/diary',        color: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.3)' },
          { label: 'Scansiona',   icon: '📷', href: '/diary?scan=1', color: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.3)' },
          { label: 'Peso',        icon: '⚖️', href: '/weight',       color: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
        ].map((action) => (
          <motion.a
            key={action.label}
            href={action.href}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96 }}
            style={{ background: action.color, borderColor: action.border }}
            className="glass-card-sm flex flex-col items-center gap-2 text-center border transition-all"
          >
            <span className="text-2xl" aria-hidden="true">{action.icon}</span>
            <span className="text-xs font-medium text-slate-300">{action.label}</span>
          </motion.a>
        ))}
      </div>

      {/* ── Row 3: Weekly chart + Water (2-col bento) ── */}
      {weekStats.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <TiltCard className="col-span-2">
            <WeeklyChart weekStats={weekStats} goalKcal={goals.kcal} />
          </TiltCard>
          <TiltCard className="col-span-1">
            <WaterTracker />
          </TiltCard>
        </div>
      )}

      {/* ── Row 4: Today's meals ── */}
      <TiltCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">
            Pasti di oggi
            {meals.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-500">({meals.length})</span>
            )}
          </h3>
          <motion.a
            href="/diary"
            whileHover={{ scale: 1.05 }}
            className="text-xs text-green-400 font-semibold hover:text-green-300 transition-colors"
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
          <ul>
            {meals.map((meal) => (
              <MealRow key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
            ))}
          </ul>
        )}
      </TiltCard>
    </div>
  );
}
