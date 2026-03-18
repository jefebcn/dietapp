'use client';

/**
 * DashboardClient  –  Claymorphic Bento Grid Dashboard
 *
 * Design language: Claymorphism – warm cream (#f7f3e9) base, clay card surfaces
 * Palette: Avocado Green (#88b04b) · Amber (#d97706) · Rose (#f43f5e)
 * Animation: Framer Motion micro-interactions via ClayCard interactive prop
 */

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { ClayCard } from '@/components/ClayCard';
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
        <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(90,58,20,0.12)" strokeWidth="12" />
        {/* Progress */}
        <motion.circle
          cx="74"
          cy="74"
          r={radius}
          fill="none"
          stroke={isOver ? '#f43f5e' : '#88b04b'}
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
          className="text-2xl font-bold font-mono leading-none"
          style={{ color: '#3d2a0a' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {consumed.toLocaleString('it-IT')}
        </motion.span>
        <span className="text-xs mt-0.5" style={{ color: '#a08060' }}>
          / {goal.toLocaleString('it-IT')} kcal
        </span>
        <span
          className="text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-full"
          style={
            isOver
              ? { background: 'rgba(244,63,94,0.12)', color: '#e11d48' }
              : { background: 'rgba(136,176,75,0.15)', color: '#5a7a1a' }
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
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a08060' }}>
          {label}
        </span>
        <span className="text-xs font-mono" style={{ color: '#5c3d1a' }}>
          {Math.round(value)}g
          <span style={{ color: '#c8a878' }}> / {goal}g</span>
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(90,58,20,0.10)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
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
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#a08060' }}>
        Acqua
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCount(i < count ? i : i + 1)}
            whileTap={{ scale: 0.82 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all"
            style={
              i < count
                ? {
                    background: 'rgba(96,165,250,0.18)',
                    border: '1.5px solid rgba(96,165,250,0.45)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                  }
                : {
                    background: 'rgba(90,58,20,0.06)',
                    border: '1.5px solid rgba(90,58,20,0.12)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                  }
            }
            aria-label={`Bicchiere ${i + 1}${i < count ? ' (bevuto)' : ''}`}
          >
            💧
          </motion.button>
        ))}
      </div>
      <p className="text-xs mt-1.5" style={{ color: '#c8a878' }}>
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
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#a08060' }}>
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
                    backgroundColor: isToday ? '#88b04b' : isOver ? '#f43f5e' : '#c8a878',
                    opacity: isToday ? 1 : 0.6,
                    boxShadow: isToday
                      ? '0 0 8px rgba(136,176,75,0.45), inset 0 1px 0 rgba(255,255,255,0.4)'
                      : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, day.totalKcal > 0 ? 10 : 2)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span
                className="text-[10px]"
                style={{ color: isToday ? '#5a7a1a' : '#c8a878', fontWeight: isToday ? 700 : 400 }}
              >
                {days[d.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-2" style={{ color: '#c8a878' }}>
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
      className="flex items-center gap-3 py-2.5 last:border-0"
      style={{ borderBottom: '1.5px solid rgba(90,58,20,0.07)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#3d2a0a' }}>
          {meal.name}
        </p>
        <p className="text-xs" style={{ color: '#a08060' }}>
          {meal.qty}{meal.unit} · P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · G {Math.round(meal.fat)}g
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold font-mono" style={{ color: '#5c3d1a' }}>
          {Math.round(meal.kcal)} kcal
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Elimina ${meal.name}`}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
          style={{ color: '#c8a878' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#e11d48';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.10)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#c8a878';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
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

      {/* ── Row 1: Calorie ring + Macros ── */}
      <div className="grid grid-cols-2 gap-4">

        <ClayCard elevated interactive className="flex flex-col items-center justify-center gap-2 p-4 col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide self-start" style={{ color: '#a08060' }}>
            Calorie
          </p>
          <CalorieRing consumed={Math.round(stats.totalKcal)} goal={goals.kcal} />
          {hitGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
              style={{
                background: 'rgba(136,176,75,0.15)',
                color: '#5a7a1a',
                border: '1px solid rgba(136,176,75,0.35)',
              }}
            >
              <SprintyAssistant mood="success" size="xs" />
              Obiettivo!
            </motion.div>
          )}
        </ClayCard>

        <ClayCard elevated interactive className="flex flex-col justify-center gap-4 p-4 col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a08060' }}>
            Macro
          </p>
          <MacroBar label="Proteine"    value={stats.totalProtein} goal={goals.protein} color="#88b04b" />
          <MacroBar label="Carboidrati" value={stats.totalCarbs}   goal={goals.carbs}   color="#d97706" />
          <MacroBar label="Grassi"      value={stats.totalFat}     goal={goals.fat}     color="#f43f5e" />
        </ClayCard>
      </div>

      {/* ── Row 2: Quick actions ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cerca cibo',  icon: '🔍', href: '/diary',        glow: 'blue'  as const },
          { label: 'Scansiona',   icon: '📷', href: '/diary?scan=1', glow: 'green' as const },
          { label: 'Peso',        icon: '⚖️', href: '/weight',       glow: 'amber' as const },
        ].map((action) => (
          <ClayCard
            key={action.label}
            interactive
            glow={action.glow}
            className="flex flex-col items-center gap-2 p-4 text-center"
            role="link"
            onClick={() => { window.location.href = action.href; }}
            tabIndex={0}
            aria-label={action.label}
          >
            <span className="text-2xl" aria-hidden="true">{action.icon}</span>
            <span className="text-xs font-semibold" style={{ color: '#7a5c2e' }}>{action.label}</span>
          </ClayCard>
        ))}
      </div>

      {/* ── Row 3: Weekly chart + Water ── */}
      {weekStats.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <ClayCard elevated interactive className="col-span-2 p-4">
            <WeeklyChart weekStats={weekStats} goalKcal={goals.kcal} />
          </ClayCard>
          <ClayCard elevated interactive className="col-span-1 p-4">
            <WaterTracker />
          </ClayCard>
        </div>
      )}

      {/* ── Row 4: Today's meals ── */}
      <ClayCard elevated className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: '#3d2a0a' }}>
            Pasti di oggi
            {meals.length > 0 && (
              <span className="ml-2 text-xs font-normal" style={{ color: '#c8a878' }}>
                ({meals.length})
              </span>
            )}
          </h3>
          <motion.a
            href="/diary"
            whileHover={{ scale: 1.05 }}
            className="text-xs font-semibold transition-colors"
            style={{ color: '#88b04b' }}
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
      </ClayCard>
    </div>
  );
}
