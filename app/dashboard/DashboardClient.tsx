'use client';

/**
 * DashboardClient  –  Interactive dashboard shell
 *
 * Receives server-fetched data as props and adds:
 *  - Real-time meal list updates via SWR
 *  - Calorie ring progress visualisation
 *  - Macro progress bars
 *  - Quick-add meal shortcut
 *  - 7-day weekly trend mini-chart
 */

import { useState } from 'react';
import useSWR from 'swr';
import SprintyAssistant from '@/components/SprintyAssistant';

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── SWR fetcher ────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Sub-components ─────────────────────────────────────────────────────────

/** Circular SVG calorie progress ring */
function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circumference * (1 - pct);
  const isOver = consumed > goal;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#ede4d3" strokeWidth="12"/>
        {/* Progress */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={isOver ? '#d4622a' : '#3a6b27'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono text-[#2c1f0e] leading-none">
          {consumed.toLocaleString('it-IT')}
        </span>
        <span className="text-xs text-[#8a7868] mt-0.5">/ {goal.toLocaleString('it-IT')} kcal</span>
        <span
          className={[
            'text-xs font-semibold mt-1 px-2 py-0.5 rounded-full',
            isOver
              ? 'bg-[#fff0e8] text-[#d4622a]'
              : 'bg-[#e8f3e2] text-[#3a6b27]',
          ].join(' ')}
        >
          {isOver ? `+${(consumed - goal).toLocaleString('it-IT')}` : `${(goal - consumed).toLocaleString('it-IT')} rimaste`}
        </span>
      </div>
    </div>
  );
}

/** Single macro progress bar */
function MacroBar({
  label,
  value,
  goal,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  bgColor: string;
}) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold text-[#8a7868] uppercase tracking-wide">{label}</span>
        <span className="text-xs font-mono text-[#2c1f0e]">
          {Math.round(value)}g <span className="text-[#8a7868]">/ {goal}g</span>
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, backgroundColor: color, background: color }}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemax={goal}
          aria-label={label}
        />
      </div>
    </div>
  );
}

/** Single meal row */
function MealRow({
  meal,
  onDelete,
}: {
  meal: Meal;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(meal.id);
    setDeleting(false);
  };

  return (
    <li className="flex items-center gap-3 py-2 border-b border-[#f5efe4] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2c1f0e] truncate">{meal.name}</p>
        <p className="text-xs text-[#8a7868]">
          {meal.qty}{meal.unit} · P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · G {Math.round(meal.fat)}g
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold font-mono text-[#2c1f0e]">
          {Math.round(meal.kcal)} kcal
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Elimina ${meal.name}`}
          className="p-1.5 rounded-lg text-[#8a7868] hover:bg-[#fff0e8] hover:text-[#d4622a] transition-colors disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>
    </li>
  );
}

/** 7-day kcal mini bar chart */
function WeeklyChart({ weekStats, goalKcal }: { weekStats: DailyStats[]; goalKcal: number }) {
  const max = Math.max(goalKcal * 1.2, ...weekStats.map((d) => d.totalKcal), 100);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[#2c1f0e] mb-3">Andamento settimanale</h3>
      <div className="flex items-end gap-2 h-20">
        {weekStats.map((day) => {
          const pct = Math.min((day.totalKcal / max) * 100, 100);
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const isOver = day.totalKcal > goalKcal;
          const d = new Date(day.date + 'T12:00:00');

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(pct, day.totalKcal > 0 ? 8 : 2)}%`,
                    backgroundColor: isToday
                      ? '#3a6b27'
                      : isOver
                      ? '#d4622a'
                      : '#7db560',
                    opacity: isToday ? 1 : 0.7,
                  }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span className={`text-[10px] ${isToday ? 'font-bold text-[#3a6b27]' : 'text-[#8a7868]'}`}>
                {days[d.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
      {/* Goal line label */}
      <p className="text-xs text-[#8a7868] mt-2">
        Obiettivo: {goalKcal.toLocaleString('it-IT')} kcal/giorno
      </p>
    </div>
  );
}

// ── Main Client Component ──────────────────────────────────────────────────

export default function DashboardClient({
  uid,
  today,
  stats: initialStats,
  goals,
  todayMeals: initialMeals,
  weekStats,
  userName,
}: Props) {
  // SWR for real-time meal updates (revalidates on focus, every 30s)
  const { data: mealsData, mutate: mutateMeals } = useSWR(
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

  const handleDeleteMeal = async (mealId: string) => {
    await fetch(`/api/meals/${mealId}?date=${today}`, { method: 'DELETE' });
    mutateMeals();
  };

  return (
    <div className="space-y-4">
      {/* Calorie summary card */}
      <div className="card">
        <div className="flex items-center gap-6">
          <CalorieRing consumed={Math.round(stats.totalKcal)} goal={goals.kcal} />
          <div className="flex-1 space-y-3 min-w-0">
            <MacroBar label="Proteine" value={stats.totalProtein} goal={goals.protein} color="#3a6b27" bgColor="#e8f3e2"/>
            <MacroBar label="Carboidrati" value={stats.totalCarbs} goal={goals.carbs} color="#c8861a" bgColor="#fffbeb"/>
            <MacroBar label="Grassi" value={stats.totalFat} goal={goals.fat} color="#d4622a" bgColor="#fff0e8"/>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Cerca cibo', icon: '🔍', href: '/diary' },
          { label: 'Scansiona', icon: '📷', href: '/diary?scan=1' },
          { label: 'Peso', icon: '⚖️', href: '/weight' },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="card-sm flex flex-col items-center gap-1.5 hover:bg-[#e8f3e2] hover:border-[#7db560] transition-colors text-center"
          >
            <span className="text-2xl" aria-hidden="true">{action.icon}</span>
            <span className="text-xs font-medium text-[#2c1f0e]">{action.label}</span>
          </a>
        ))}
      </div>

      {/* Weekly chart */}
      {weekStats.length > 0 && (
        <WeeklyChart weekStats={weekStats} goalKcal={goals.kcal} />
      )}

      {/* Today's meals */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2c1f0e]">
            Pasti di oggi
            {meals.length > 0 && (
              <span className="ml-2 text-xs font-normal text-[#8a7868]">
                ({meals.length})
              </span>
            )}
          </h3>
          <a href="/diary" className="text-xs text-[#3a6b27] font-semibold hover:underline">
            + Aggiungi
          </a>
        </div>

        {meals.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-3">
            <SprintyAssistant
              mood="idle"
              size="sm"
              message="Nessun pasto registrato oggi. Inizia ad aggiungere!"
            />
          </div>
        ) : (
          <ul>
            {meals.map((meal) => (
              <MealRow key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
