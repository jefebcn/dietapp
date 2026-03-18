'use client';

/**
 * DashboardClient  –  NutriTrack Premium Dark Glass Dashboard
 *
 * Inspired by top competitors (MyFitnessPal, Yazio, Lifesum):
 *  • Prominent calorie ring center-stage
 *  • Macro progress with modern bars
 *  • Meal categories (Colazione, Pranzo, Cena, Spuntini)
 *  • Water tracker with interactive buttons
 *  • Weekly chart with goal line
 *  • AI daily tip card
 */

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  streak?: number; tip?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Calorie Ring ───────────────────────────────────────────────────────────────

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const r = 68;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circ * (1 - pct);
  const isOver = consumed > goal;
  const remaining = Math.max(goal - consumed, 0);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 172, height: 172 }}>
      <svg width="172" height="172" viewBox="0 0 172 172" aria-hidden="true">
        <defs>
          <filter id="glow-amber">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-rose">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isOver ? '#F87171' : '#F59E0B'}/>
            <stop offset="100%" stopColor={isOver ? '#EF4444' : '#FCD34D'}/>
          </linearGradient>
        </defs>
        {/* Outer decorative ring */}
        <circle cx="86" cy="86" r={r + 10} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        {/* Track */}
        <circle cx="86" cy="86" r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth="14"/>
        {/* Progress */}
        <motion.circle
          cx="86" cy="86" r={r} fill="none"
          stroke="url(#ring-grad)" strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 86 86)"
          filter={isOver ? 'url(#glow-rose)' : 'url(#glow-amber)'}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <motion.span
          className="text-3xl font-black leading-none"
          style={{ color: isOver ? '#F87171' : '#FCD34D', fontFamily: 'var(--font-ui)' }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4, type: 'spring', stiffness: 260 }}
        >
          {consumed.toLocaleString('it-IT')}
        </motion.span>
        <span className="text-[11px] font-semibold" style={{ color: 'rgba(248,250,252,0.45)' }}>
          / {goal.toLocaleString()} kcal
        </span>
        <span
          className="text-[10px] font-bold mt-1 px-2.5 py-0.5 rounded-full"
          style={isOver
            ? { background: 'rgba(248,113,113,0.18)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.35)' }
            : { background: 'rgba(245,158,11,0.18)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.35)' }
          }
        >
          {isOver ? `+${consumed - goal} oltre` : `${remaining} rim.`}
        </span>
      </div>
    </div>
  );
}

// ── Macro Ring (compact circular) ─────────────────────────────────────────────

function MacroRing({ value, goal, label, color, size = 52 }: {
  value: number; goal: number; label: string; color: string; size?: number;
}) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(goal, 1), 1);
  const offset = circ * (1 - pct);
  const cx = size / 2;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
          <motion.circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
            transform={`rotate(-90 ${cx} ${cx})`}
            style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black" style={{ color }}>{Math.round(value)}</span>
        </div>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(248,250,252,0.45)' }}>{label}</span>
    </div>
  );
}

// ── Water Tracker ──────────────────────────────────────────────────────────────

function WaterTracker() {
  const [count, setCount] = useState(0);
  const goal = 8;
  const pct = (count / goal) * 100;
  return (
    <div className="p-4 rounded-2xl" style={{
      background: 'rgba(34,211,238,0.07)',
      border: '1px solid rgba(34,211,238,0.22)',
      backdropFilter: 'blur(16px)',
    }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💧</span>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#22D3EE' }}>Acqua</span>
        </div>
        <span className="text-xs font-bold" style={{ color: 'rgba(34,211,238,0.70)' }}>{count}/{goal} bicchieri</span>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #06B6D4, #22D3EE)', boxShadow: '0 0 10px rgba(34,211,238,0.50)' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      {/* Cups grid */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCount(i < count ? i : i + 1)}
            whileTap={{ scale: 0.75 }}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all"
            style={i < count
              ? { background: 'rgba(34,211,238,0.25)', border: '1px solid rgba(34,211,238,0.60)', boxShadow: '0 0 8px rgba(34,211,238,0.40)' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }
            }
            aria-label={`Bicchiere ${i+1}`}
          >💧</motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Weekly Chart ───────────────────────────────────────────────────────────────

function WeeklyChart({ weekStats, goalKcal }: { weekStats: DailyStats[]; goalKcal: number }) {
  const max = Math.max(goalKcal * 1.3, ...weekStats.map((d) => d.totalKcal), 100);
  const days = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  const today = new Date().toISOString().split('T')[0];
  const goalPct = (goalKcal / max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(248,250,252,0.45)' }}>
          Ultime 7 giornate
        </p>
        <p className="text-[10px] font-semibold" style={{ color: 'rgba(245,158,11,0.70)' }}>
          Target {goalKcal.toLocaleString()} kcal
        </p>
      </div>
      <div className="relative flex items-end gap-1.5 h-20">
        {/* Goal line */}
        <div className="absolute left-0 right-0 border-t border-dashed pointer-events-none"
          style={{ bottom: `${goalPct}%`, borderColor: 'rgba(245,158,11,0.35)' }}/>

        {weekStats.map((day, idx) => {
          const pct = Math.min((day.totalKcal / max) * 100, 100);
          const isToday = day.date === today;
          const isOver = day.totalKcal > goalKcal;
          const d = new Date(day.date + 'T12:00:00');
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
                <motion.div className="w-full rounded-t-lg"
                  style={{
                    background: isToday
                      ? 'linear-gradient(180deg, #FBBF24, #F59E0B)'
                      : isOver ? 'linear-gradient(180deg, #F87171, #EF4444)'
                      : 'rgba(255,255,255,0.12)',
                    boxShadow: isToday ? '0 0 14px rgba(245,158,11,0.55)' : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, day.totalKcal > 0 ? 6 : 2)}%` }}
                  transition={{ duration: 0.7, delay: idx * 0.06, ease: 'easeOut' }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span className="text-[9px] font-bold"
                style={{ color: isToday ? '#FBBF24' : 'rgba(248,250,252,0.35)' }}>
                {days[d.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Meal Row ───────────────────────────────────────────────────────────────────

function MealRow({ meal, onDelete }: { meal: Meal; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [showMacros, setShowMacros] = useState(false);

  return (
    <motion.li layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <button className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
        onClick={() => setShowMacros((v) => !v)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#F8FAFC' }}>{meal.name}</p>
          <p className="text-xs" style={{ color: 'rgba(248,250,252,0.40)' }}>
            {meal.qty}{meal.unit}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.16)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.28)' }}>
            {Math.round(meal.kcal)} kcal
          </span>
          <motion.button
            onClick={async (e) => { e.stopPropagation(); setDeleting(true); await onDelete(meal.id); setDeleting(false); }}
            disabled={deleting}
            className="p-1.5 rounded-xl"
            style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171', border: '1px solid rgba(248,113,113,0.20)' }}
            whileTap={{ scale: 0.82 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </motion.button>
        </div>
      </button>
      <AnimatePresence>
        {showMacros && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 pb-2.5 flex gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {[
              { label: 'Prot', val: meal.protein, color: '#22D3EE' },
              { label: 'Carb', val: meal.carbs, color: '#FB923C' },
              { label: 'Gras', val: meal.fat, color: '#F87171' },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-1 pt-2">
                <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.label}</span>
                <span className="text-[10px]" style={{ color: 'rgba(248,250,252,0.55)' }}>{Math.round(m.val)}g</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DashboardClient({
  uid, today, stats: initialStats, goals, todayMeals: initialMeals, weekStats, userName, streak = 0, tip,
}: Props) {
  const { data: mealsData, mutate } = useSWR(`/api/meals?date=${today}`, fetcher, {
    fallbackData: { meals: initialMeals, stats: initialStats },
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const meals: Meal[] = mealsData?.meals ?? initialMeals;
  const stats: DailyStats = mealsData?.stats ?? initialStats;
  const hitGoal = stats.totalKcal >= goals.kcal * 0.88 && stats.totalKcal <= goals.kcal * 1.05;

  const handleDeleteMeal = async (mealId: string) => {
    await fetch(`/api/meals/${mealId}?date=${today}`, { method: 'DELETE' });
    mutate();
  };

  const G = {
    base: {
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '1.5rem',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
    } as React.CSSProperties,
    amber: {
      background: 'rgba(245,158,11,0.07)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: '1.5rem',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(245,158,11,0.08)',
    } as React.CSSProperties,
  };

  return (
    <div className="space-y-3">

      {/* ── Tip Card ── */}
      {tip && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 items-start px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(139,92,246,0.07)',
            border: '1px solid rgba(139,92,246,0.20)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="text-xs font-medium leading-relaxed pt-0.5" style={{ color: 'rgba(248,250,252,0.72)' }}>{tip}</p>
        </motion.div>
      )}

      {/* ── Row 1: Calorie Ring Hero ── */}
      <motion.div
        className="flex flex-col items-center py-5 px-4 relative overflow-hidden"
        style={G.amber}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Subtle radial bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)' }}/>

        <p className="text-xs font-bold uppercase tracking-widest mb-3 relative"
          style={{ color: 'rgba(252,211,77,0.60)' }}>Calorie Oggi</p>

        <CalorieRing consumed={Math.round(stats.totalKcal)} goal={goals.kcal} />

        {hitGoal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(52,211,153,0.18)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.35)' }}
          >
            ✨ Obiettivo raggiunto!
          </motion.div>
        )}

        {/* Macro rings row */}
        <div className="flex gap-6 mt-4 relative">
          <MacroRing value={stats.totalProtein} goal={goals.protein} label="Prot" color="#22D3EE"/>
          <MacroRing value={stats.totalCarbs}   goal={goals.carbs}   label="Carb" color="#FB923C"/>
          <MacroRing value={stats.totalFat}     goal={goals.fat}     label="Gras" color="#F87171"/>
        </div>
      </motion.div>

      {/* ── Row 2: Weekly Chart + Water ── */}
      {weekStats.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          <motion.div
            className="col-span-3 p-4"
            style={G.base}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            <WeeklyChart weekStats={weekStats} goalKcal={goals.kcal}/>
          </motion.div>
          <motion.div
            className="col-span-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            <WaterTracker/>
          </motion.div>
        </div>
      )}

      {/* ── Row 3: Quick Actions ── */}
      <motion.div
        className="grid grid-cols-4 gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22 }}
      >
        {[
          { label: 'Diario', icon: '📋', href: '/diary',    accent: '245,158,11' },
          { label: 'Insight', icon: '📊', href: '/insights', accent: '52,211,153' },
          { label: 'Leghe',  icon: '🏆', href: '/leagues',  accent: '168,85,247' },
          { label: 'Impost.', icon: '⚙️', href: '/settings', accent: '139,92,246' },
        ].map((action) => (
          <motion.a
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-1.5 py-3 px-1 text-center rounded-2xl"
            style={{
              background: `rgba(${action.accent},0.07)`,
              border: `1px solid rgba(${action.accent},0.20)`,
              backdropFilter: 'blur(14px)',
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
          >
            <motion.span className="text-xl"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
              {action.icon}
            </motion.span>
            <span className="text-[10px] font-bold" style={{ color: 'rgba(248,250,252,0.65)' }}>{action.label}</span>
          </motion.a>
        ))}
      </motion.div>

      {/* ── Row 4: Today's Meals ── */}
      <motion.div
        className="p-4"
        style={G.base}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.28 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: '#F8FAFC' }}>Pasti di oggi</h3>
            {meals.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.16)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.28)' }}>
                {meals.length}
              </span>
            )}
          </div>
          <Link href="/diary">
            <motion.span
              className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
              style={{
                background: 'rgba(139,92,246,0.16)',
                color: '#C4B5FD',
                border: '1px solid rgba(139,92,246,0.32)',
                boxShadow: '0 0 12px rgba(139,92,246,0.20)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              + Aggiungi
            </motion.span>
          </Link>
        </div>

        {meals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              🍽️
            </div>
            <p className="text-sm font-bold mt-2" style={{ color: 'rgba(248,250,252,0.60)' }}>Nessun pasto ancora</p>
            <p className="text-xs" style={{ color: 'rgba(248,250,252,0.35)' }}>Aggiungi il tuo primo pasto!</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <ul className="space-y-2">
              {meals.map((meal) => (
                <MealRow key={meal.id} meal={meal} onDelete={handleDeleteMeal}/>
              ))}
            </ul>
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── Premium Banner (for free users) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
      >
        <Link href="/premium">
          <div className="relative overflow-hidden p-4 rounded-2xl cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(139,92,246,0.12))',
              border: '1px solid rgba(245,158,11,0.28)',
            }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.06))' }}/>
            <div className="relative flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#FCD34D' }}>Prova Premium Gratis</p>
                <p className="text-xs" style={{ color: 'rgba(248,250,252,0.55)' }}>
                  AI illimitata, grafici avanzati e molto altro · €4,99/mese
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(252,211,77,0.60)" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </div>
        </Link>
      </motion.div>

    </div>
  );
}
