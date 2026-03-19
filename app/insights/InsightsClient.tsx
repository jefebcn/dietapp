'use client';

/**
 * InsightsClient.tsx  –  Nutrition Analytics + Weight Tracking
 *
 * Sections:
 *  1. Streak cards (current + longest)
 *  2. 30-day calorie chart
 *  3. Macro distribution pie/bars
 *  4. Weight trend chart
 *  5. Weight logging form
 *  6. Recent weight logs
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logWeightAction } from '@/lib/actions/mealActions';
import type { BronzeLog, GoldMetrics } from '@/lib/repositories/weightRepository';

interface DailyStats {
  date: string; totalKcal: number; totalProtein: number;
  totalCarbs: number; totalFat: number; mealCount: number;
}
interface Goals { kcal: number; protein: number; carbs: number; fat: number; }

interface Props {
  recentLogs: (BronzeLog & { id: string })[];
  weeklyTrend: GoldMetrics[];
  monthStats: DailyStats[];
  goals: Goals;
  streak: number;
  longestStreak: number;
}

// ── Streak Calendar ────────────────────────────────────────────────────────────

function StreakCalendar({ monthStats, goals }: { monthStats: DailyStats[]; goals: Goals }) {
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (27 - i));
    const dateStr = d.toISOString().split('T')[0];
    const stat = monthStats.find((s) => s.date === dateStr);
    const isToday = i === 27;
    const hasData = stat && stat.totalKcal > 0;
    const hitGoal = stat && stat.totalKcal >= goals.kcal * 0.80;
    return { dateStr, stat, isToday, hasData, hitGoal, day: d.getDate() };
  });

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>
        Ultime 4 settimane
      </p>
      <div className="grid grid-cols-7 gap-1">
        {['L','M','M','G','V','S','D'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold pb-1"
            style={{ color: '#9CA3AF' }}>{d}</div>
        ))}
        {days.map((day) => (
          <motion.div
            key={day.dateStr}
            className="aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold"
            style={
              day.isToday
                ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.50)', color: '#8B5CF6' }
                : day.hitGoal
                ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.40)', color: '#22C55E' }
                : day.hasData
                ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)', color: '#F59E0B' }
                : { background: '#F3F6F0', border: '1px solid #E5EBE0', color: '#9CA3AF' }
            }
            title={`${day.dateStr}: ${Math.round(day.stat?.totalKcal ?? 0)} kcal`}
          >
            {day.day}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-4 mt-2.5">
        {[
          { color: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.40)', label: 'Obiettivo raggiunto' },
          { color: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)', label: 'Pasto tracciato' },
          { color: '#F3F6F0', border: '1px solid #E5EBE0', label: 'Nessun dato' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: item.color, border: item.border }}/>
            <span className="text-[9px]" style={{ color: '#9CA3AF' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly Calorie Chart ──────────────────────────────────────────────────────

function MonthChart({ monthStats, goalKcal }: { monthStats: DailyStats[]; goalKcal: number }) {
  const last14 = monthStats.slice(-14);
  const max = Math.max(goalKcal * 1.3, ...last14.map((d) => d.totalKcal), 100);
  const days = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>
          Calorie – ultimi 14 giorni
        </p>
        <p className="text-[10px] font-semibold" style={{ color: '#F59E0B' }}>
          Target {goalKcal.toLocaleString()}
        </p>
      </div>
      <div className="relative flex items-end gap-1 h-24">
        {/* Goal line */}
        <div className="absolute left-0 right-0 border-t border-dashed"
          style={{ bottom: `${(goalKcal / max) * 100}%`, borderColor: 'rgba(245,158,11,0.45)' }}/>
        {last14.map((day, idx) => {
          const pct = Math.min((day.totalKcal / max) * 100, 100);
          const isOver = day.totalKcal > goalKcal;
          const d = new Date(day.date + 'T12:00:00');
          const isToday = idx === last14.length - 1;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                <motion.div
                  className="w-full rounded-t-md"
                  style={{
                    background: isToday ? 'linear-gradient(180deg, #FBBF24, #F59E0B)'
                      : isOver ? 'linear-gradient(180deg, #F87171, #EF4444)'
                      : '#D1D5DB',
                    boxShadow: isToday ? '0 0 10px rgba(245,158,11,0.35)' : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, day.totalKcal > 0 ? 4 : 2)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.04, ease: 'easeOut' }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span className="text-[8px] font-bold"
                style={{ color: isToday ? '#F59E0B' : '#9CA3AF' }}>
                {days[d.getDay()].charAt(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Macro Breakdown ────────────────────────────────────────────────────────────

function MacroBreakdown({ monthStats }: { monthStats: DailyStats[] }) {
  const activeDays = monthStats.filter((d) => d.totalKcal > 0);
  if (activeDays.length === 0) return null;

  const avg = {
    kcal:    activeDays.reduce((s, d) => s + d.totalKcal, 0) / activeDays.length,
    protein: activeDays.reduce((s, d) => s + d.totalProtein, 0) / activeDays.length,
    carbs:   activeDays.reduce((s, d) => s + d.totalCarbs, 0) / activeDays.length,
    fat:     activeDays.reduce((s, d) => s + d.totalFat, 0) / activeDays.length,
  };

  const proteinKcal = avg.protein * 4;
  const carbsKcal   = avg.carbs * 4;
  const fatKcal     = avg.fat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  const macros = [
    { label: 'Proteine', grams: avg.protein, kcal: proteinKcal, pct: (proteinKcal / totalMacroKcal) * 100, color: '#0EA5E9' },
    { label: 'Carboidrati', grams: avg.carbs, kcal: carbsKcal, pct: (carbsKcal / totalMacroKcal) * 100, color: '#8B5CF6' },
    { label: 'Grassi', grams: avg.fat, kcal: fatKcal, pct: (fatKcal / totalMacroKcal) * 100, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>
        Media giornaliera ({activeDays.length} giorni)
      </p>
      <div className="flex items-center gap-2">
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: '#F97316', fontFamily: 'var(--font-ui)' }}>
            {Math.round(avg.kcal)}
          </p>
          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>kcal/giorno</p>
        </div>
        {/* Horizontal bar breakdown */}
        <div className="flex-1">
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {macros.map((m) => (
              <motion.div key={m.label}
                className="rounded-full"
                style={{ background: m.color }}
                initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            {macros.map((m) => (
              <div key={m.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: m.color }}/>
                <span className="text-[9px] font-semibold" style={{ color: '#6B7280' }}>
                  {m.label.slice(0, 4)} {Math.round(m.grams)}g
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weight Line Chart (SVG bezier) ─────────────────────────────────────────────

interface ChartPoint { date: string; kg: number; label: string; }

function WeightLineChart({ points }: { points: ChartPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <span className="text-3xl">📊</span>
        <p className="text-xs font-semibold" style={{ color: '#C9D5C4' }}>
          Registra almeno 2 pesate per il grafico
        </p>
      </div>
    );
  }

  const W = 300, H = 130, pX = 10, pY = 14;
  const plotW = W - pX * 2;
  const plotH = H - pY * 2;

  const weights = points.map((p) => p.kg);
  const minW = Math.min(...weights) - 0.8;
  const maxW = Math.max(...weights) + 0.8;
  const range = maxW - minW || 1;

  const toX = (i: number) => pX + (i / (points.length - 1)) * plotW;
  const toY = (kg: number) => pY + (1 - (kg - minW) / range) * plotH;

  let linePath = `M ${toX(0).toFixed(1)} ${toY(points[0].kg).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const x0 = toX(i - 1), y0 = toY(points[i - 1].kg);
    const x1 = toX(i),     y1 = toY(points[i].kg);
    const cpx = (x0 + x1) / 2;
    linePath += ` C ${cpx.toFixed(1)} ${y0.toFixed(1)} ${cpx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  const lastX = toX(points.length - 1).toFixed(1);
  const fillPath = `${linePath} L ${lastX} ${(H - pY).toFixed(1)} L ${pX} ${(H - pY).toFixed(1)} Z`;

  const delta = points[points.length - 1].kg - points[0].kg;
  const lineColor = delta > 0.05 ? '#EF4444' : delta < -0.05 ? '#22C55E' : '#8B5CF6';
  const lastIdx = points.length - 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>
          Andamento peso
        </p>
        {points.length >= 2 && (
          <span className="text-xs font-bold" style={{ color: delta > 0.05 ? '#EF4444' : delta < -0.05 ? '#22C55E' : '#8B5CF6' }}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)} kg
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible', display: 'block' }}>
        <defs>
          <linearGradient id="insightLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={lineColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.00" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f}
            x1={pX} y1={(pY + f * plotH).toFixed(1)}
            x2={W - pX} y2={(pY + f * plotH).toFixed(1)}
            stroke="#E5EBE0" strokeWidth="1" strokeDasharray="4 4"
          />
        ))}
        <path d={fillPath} fill="url(#insightLineGrad)" />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {[0, lastIdx].map((i) => (
          <g key={i}>
            <circle
              cx={toX(i).toFixed(1)} cy={toY(points[i].kg).toFixed(1)}
              r={i === lastIdx ? 4.5 : 3}
              fill={i === lastIdx ? lineColor : 'rgba(255,255,255,0.5)'}
              stroke={lineColor} strokeWidth="1.5"
            />
            {i === lastIdx && (
              <text x={toX(i).toFixed(1)} y={(toY(points[i].kg) - 8).toFixed(1)}
                fill={lineColor} fontSize="8.5" fontWeight="800" textAnchor="middle"
                fontFamily="Inter, system-ui, sans-serif">
                {points[i].kg}
              </text>
            )}
          </g>
        ))}
        <text x={pX} y={H - 1} fill="#9CA3AF" fontSize="8" textAnchor="start" fontFamily="Inter, system-ui, sans-serif">
          {points[0].label}
        </text>
        <text x={W - pX} y={H - 1} fill="#6B7280" fontSize="8" textAnchor="end" fontFamily="Inter, system-ui, sans-serif">
          {points[lastIdx].label}
        </text>
      </svg>
    </div>
  );
}

// ── Weight Weekly Bar Chart ─────────────────────────────────────────────────────

function WeightWeeklyBars({ data }: { data: GoldMetrics[] }) {
  const sorted = [...data].reverse();
  const weights = sorted.map((d) => d.avgKg);
  const minW = Math.min(...weights) - 0.3;
  const maxW = Math.max(...weights) + 0.3;
  const range = maxW - minW || 1;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#6B7280' }}>
        Media settimanale
      </p>
      <div className="flex items-end gap-1.5 h-14">
        {sorted.map((w, i) => {
          const pct = ((w.avgKg - minW) / range) * 100;
          const isLast = i === sorted.length - 1;
          const arrow = w.trend > 0.01 ? '▲' : w.trend < -0.01 ? '▼' : '–';
          const arrowColor = w.trend > 0.01 ? '#EF4444' : w.trend < -0.01 ? '#22C55E' : '#9CA3AF';
          const weekLabel = w.period.replace('week_', '').split('-')[1] ?? '';
          return (
            <div key={w.period} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[7px] font-bold" style={{ color: isLast ? '#8B5CF6' : '#9CA3AF' }}>
                {w.avgKg}
              </span>
              <div className="w-full flex flex-col justify-end" style={{ height: 40 }}>
                <motion.div
                  className="w-full rounded-t-md"
                  style={{
                    background: isLast ? 'linear-gradient(180deg, #A78BFA, #8B5CF6)' : 'rgba(139,92,246,0.18)',
                    border: `1px solid ${isLast ? 'rgba(139,92,246,0.50)' : 'rgba(139,92,246,0.15)'}`,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 6)}%` }}
                  transition={{ duration: 0.55, delay: i * 0.05, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[7px]" style={{ color: '#C9D5C4' }}>S{weekLabel}</span>
              <span className="text-[7px] font-bold" style={{ color: arrowColor }}>{arrow}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function InsightsClient({
  recentLogs, weeklyTrend, monthStats, goals, streak, longestStreak,
}: Props) {
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ kg: number } | { error: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'analytics' | 'peso'>('analytics');

  const latestWeight = recentLogs[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawValue = parseFloat(value);
    if (!rawValue || rawValue <= 0) return;
    setLoading(true);
    setLastResult(null);
    const result = await logWeightAction({
      rawValue, rawUnit: unit, notes: notes || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
    });
    setLoading(false);
    if (result.success) { setLastResult({ kg: result.weightKg }); setValue(''); setNotes(''); }
    else setLastResult({ error: result.error });
  };

  // Light card styles
  const G = {
    base: { background: '#FFFFFF', border: '1px solid #E5EBE0', borderRadius: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as React.CSSProperties,
    violet: { background: '#FFFFFF', border: '1px solid rgba(139,92,246,0.20)', borderRadius: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as React.CSSProperties,
    emerald: { background: '#FFFFFF', border: '1px solid rgba(34,197,94,0.20)', borderRadius: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as React.CSSProperties,
    amber: { background: '#FFFFFF', border: '1px solid rgba(245,158,11,0.20)', borderRadius: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as React.CSSProperties,
  };

  return (
    <div className="space-y-4 pb-4">

      {/* ── Section tabs ── */}
      <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5EBE0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {[
          { key: 'analytics', label: '📊 Analytics' },
          { key: 'peso', label: '⚖️ Peso' },
        ].map((tab) => (
          <button key={tab.key}
            onClick={() => setActiveSection(tab.key as 'analytics' | 'peso')}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeSection === tab.key ? '#F97316' : 'transparent',
              color: activeSection === tab.key ? '#FFFFFF' : '#6B7280',
              border: activeSection === tab.key ? '1px solid rgba(249,115,22,0.30)' : '1px solid transparent',
              fontFamily: 'var(--font-ui)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'analytics' ? (
          <motion.div key="analytics" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">

            {/* ── Streak Cards ── */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div className="p-4" style={G.amber}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-2xl mb-1">🔥</div>
                <p className="text-3xl font-black" style={{ color: '#F59E0B', fontFamily: 'var(--font-ui)' }}>{streak}</p>
                <p className="text-xs font-bold" style={{ color: '#9CA3AF' }}>Giorni di fila</p>
              </motion.div>
              <motion.div className="p-4" style={G.violet}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                <div className="text-2xl mb-1">⚡</div>
                <p className="text-3xl font-black" style={{ color: '#8B5CF6', fontFamily: 'var(--font-ui)' }}>{longestStreak}</p>
                <p className="text-xs font-bold" style={{ color: '#9CA3AF' }}>Record personale</p>
              </motion.div>
            </div>

            {/* ── Calendar ── */}
            <motion.div className="p-4" style={G.base}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
              <StreakCalendar monthStats={monthStats} goals={goals}/>
            </motion.div>

            {/* ── 14-day chart ── */}
            {monthStats.some((d) => d.totalKcal > 0) && (
              <motion.div className="p-4" style={G.base}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                <MonthChart monthStats={monthStats} goalKcal={goals.kcal}/>
              </motion.div>
            )}

            {/* ── Macro breakdown ── */}
            {monthStats.some((d) => d.totalKcal > 0) && (
              <motion.div className="p-4" style={G.base}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <MacroBreakdown monthStats={monthStats}/>
              </motion.div>
            )}

            {monthStats.every((d) => d.totalKcal === 0) && (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">📊</span>
                <p className="text-base font-bold" style={{ color: '#6B7280' }}>Nessun dato ancora</p>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Inizia a tracciare i pasti per vedere i tuoi progressi!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="peso" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">

            {/* Last weight */}
            {latestWeight && (
              <motion.div className="p-4 flex items-center gap-4" style={G.violet}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}>⚖️</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Ultimo peso</p>
                  <p className="text-3xl font-black" style={{ color: '#1C1917' }}>
                    {latestWeight.rawValue} <span className="text-lg font-semibold" style={{ color: '#6B7280' }}>{latestWeight.rawUnit}</span>
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {new Date(latestWeight.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Weight line chart – day-by-day progression from bronze logs */}
            <motion.div className="p-4" style={G.violet}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <WeightLineChart points={recentLogs
                .slice()
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((l) => ({
                  date: l.createdAt.split('T')[0],
                  kg: l.rawUnit === 'kg' ? l.rawValue : Math.round(l.rawValue * 0.453592 * 10) / 10,
                  label: new Date(l.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
                }))}
              />
            </motion.div>

            {/* Weekly averages bar chart */}
            {weeklyTrend.length >= 2 && (
              <motion.div className="p-4" style={G.base}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <WeightWeeklyBars data={weeklyTrend}/>
              </motion.div>
            )}

            {/* Log form */}
            <motion.div className="p-5" style={G.emerald}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#6B7280' }}>
                📝 Registra peso
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Unit toggle */}
                <div className="flex rounded-xl p-0.5 gap-0.5"
                  style={{ background: '#F3F6F0', border: '1px solid #E5EBE0' }}>
                  {(['kg','lbs'] as const).map((u) => (
                    <button key={u} type="button" onClick={() => setUnit(u)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold"
                      style={{
                        background: unit === u ? '#FFFFFF' : 'transparent',
                        color: unit === u ? '#1C1917' : '#9CA3AF',
                        border: unit === u ? '1px solid #E5EBE0' : '1px solid transparent',
                        fontFamily: 'var(--font-ui)',
                        boxShadow: unit === u ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                      }}>{u}</button>
                  ))}
                </div>
                <input type="number" step="0.1" min="0" max="500" value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={unit === 'kg' ? 'es. 75.5' : 'es. 166'}
                  required
                  className="app-input w-full rounded-xl px-4 py-3 text-lg font-bold outline-none"
                  style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}/>
                <input type="number" step="1" min="100" max="250" value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="Altezza in cm (per BMI)"
                  className="app-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}/>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note opzionali (es. dopo colazione)"
                  maxLength={120}
                  className="app-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}/>
                <AnimatePresence>
                  {lastResult && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-4 py-3 rounded-xl text-sm font-bold"
                      style={'error' in lastResult
                        ? { background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1.5px solid rgba(239,68,68,0.20)' }
                        : { background: 'rgba(34,197,94,0.08)', color: '#16A34A', border: '1.5px solid rgba(34,197,94,0.25)' }
                      }>
                      {'error' in lastResult ? `❌ ${lastResult.error}` : `✅ Salvato: ${lastResult.kg} kg`}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button type="submit" disabled={loading || !value}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(145deg, #22C55E, #16A34A)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-ui)',
                    boxShadow: '0 4px 0 rgba(22,163,74,0.25)',
                  }}>
                  {loading ? 'Salvataggio...' : '⚖️ Salva peso'}
                </button>
              </form>
            </motion.div>

            {/* Recent logs */}
            {recentLogs.length > 0 && (
              <motion.div className="p-4" style={G.amber}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>
                  Ultime registrazioni
                </h3>
                <ul className="space-y-2">
                  {recentLogs.slice(0, 8).map((log, i) => (
                    <motion.li key={log.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: i < Math.min(recentLogs.length, 8) - 1 ? '1px solid #E5EBE0' : 'none' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#1C1917' }}>{log.rawValue} {log.rawUnit}</p>
                        {log.notes && <p className="text-xs" style={{ color: '#6B7280' }}>{log.notes}</p>}
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#9CA3AF' }}>
                        {new Date(log.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {recentLogs.length === 0 && weeklyTrend.length === 0 && (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">⚖️</span>
                <p className="text-sm font-bold" style={{ color: '#6B7280' }}>Nessun peso registrato</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Inizia a tracciare il tuo peso!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
