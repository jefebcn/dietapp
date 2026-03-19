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
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'rgba(248,250,252,0.45)' }}>
        Ultime 4 settimane
      </p>
      <div className="grid grid-cols-7 gap-1">
        {['L','M','M','G','V','S','D'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold pb-1"
            style={{ color: 'rgba(248,250,252,0.30)' }}>{d}</div>
        ))}
        {days.map((day) => (
          <motion.div
            key={day.dateStr}
            className="aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold"
            style={
              day.isToday
                ? { background: 'rgba(139,92,246,0.45)', border: '1px solid rgba(139,92,246,0.70)', color: '#C4B5FD' }
                : day.hitGoal
                ? { background: 'rgba(52,211,153,0.25)', border: '1px solid rgba(52,211,153,0.45)', color: '#34D399' }
                : day.hasData
                ? { background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', color: '#FCD34D' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,250,252,0.25)' }
            }
            title={`${day.dateStr}: ${Math.round(day.stat?.totalKcal ?? 0)} kcal`}
          >
            {day.day}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-4 mt-2.5">
        {[
          { color: 'rgba(52,211,153,0.25)', border: '1px solid rgba(52,211,153,0.45)', label: 'Obiettivo raggiunto' },
          { color: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', label: 'Pasto tracciato' },
          { color: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', label: 'Nessun dato' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: item.color, border: item.border }}/>
            <span className="text-[9px]" style={{ color: 'rgba(248,250,252,0.40)' }}>{item.label}</span>
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
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(248,250,252,0.45)' }}>
          Calorie – ultimi 14 giorni
        </p>
        <p className="text-[10px] font-semibold" style={{ color: 'rgba(245,158,11,0.65)' }}>
          Target {goalKcal.toLocaleString()}
        </p>
      </div>
      <div className="relative flex items-end gap-1 h-24">
        {/* Goal line */}
        <div className="absolute left-0 right-0 border-t border-dashed"
          style={{ bottom: `${(goalKcal / max) * 100}%`, borderColor: 'rgba(245,158,11,0.35)' }}/>
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
                      : 'rgba(255,255,255,0.14)',
                    boxShadow: isToday ? '0 0 10px rgba(245,158,11,0.50)' : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, day.totalKcal > 0 ? 4 : 2)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.04, ease: 'easeOut' }}
                  title={`${day.date}: ${Math.round(day.totalKcal)} kcal`}
                />
              </div>
              <span className="text-[8px] font-bold"
                style={{ color: isToday ? '#FBBF24' : 'rgba(248,250,252,0.28)' }}>
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
    { label: 'Proteine', grams: avg.protein, kcal: proteinKcal, pct: (proteinKcal / totalMacroKcal) * 100, color: '#22D3EE' },
    { label: 'Carboidrati', grams: avg.carbs, kcal: carbsKcal, pct: (carbsKcal / totalMacroKcal) * 100, color: '#FB923C' },
    { label: 'Grassi', grams: avg.fat, kcal: fatKcal, pct: (fatKcal / totalMacroKcal) * 100, color: '#F87171' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(248,250,252,0.45)' }}>
        Media giornaliera ({activeDays.length} giorni)
      </p>
      <div className="flex items-center gap-2">
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>
            {Math.round(avg.kcal)}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(248,250,252,0.40)' }}>kcal/giorno</p>
        </div>
        {/* Horizontal bar breakdown */}
        <div className="flex-1">
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {macros.map((m) => (
              <motion.div key={m.label}
                className="rounded-full"
                style={{ background: m.color, boxShadow: `0 0 8px ${m.color}66` }}
                initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            {macros.map((m) => (
              <div key={m.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: m.color }}/>
                <span className="text-[9px] font-semibold" style={{ color: 'rgba(248,250,252,0.55)' }}>
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

// ── Weight Trend Chart ─────────────────────────────────────────────────────────

function WeightChart({ data }: { data: GoldMetrics[] }) {
  if (data.length < 2) return null;
  const weights = data.map((d) => d.avgKg);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,250,252,0.45)' }}>
        Andamento peso
      </p>
      <div className="flex items-end gap-2 h-20">
        {data.map((w, i) => {
          const pct = range > 0 ? ((w.avgKg - min) / range) * 100 : 50;
          const isLatest = i === data.length - 1;
          const trend = i > 0 ? w.avgKg - data[i-1].avgKg : 0;
          return (
            <div key={w.period} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 60 }}>
                <motion.div className="w-full rounded-t-lg"
                  style={{
                    background: isLatest ? 'linear-gradient(180deg, #A78BFA, #8B5CF6)' : 'rgba(167,139,250,0.28)',
                    border: isLatest ? '1px solid rgba(167,139,250,0.50)' : '1px solid rgba(167,139,250,0.15)',
                    boxShadow: isLatest ? '0 0 12px rgba(139,92,246,0.45)' : undefined,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                  title={`${w.period}: ${w.avgKg} kg`}
                />
              </div>
              <span className="text-[9px] font-bold" style={{ color: isLatest ? '#A78BFA' : 'rgba(167,139,250,0.50)' }}>
                {w.avgKg}
              </span>
              {trend !== 0 && isLatest && (
                <span className="text-[8px] font-bold" style={{ color: trend < 0 ? '#34D399' : '#F87171' }}>
                  {trend < 0 ? '↓' : '↑'}{Math.abs(trend).toFixed(1)}
                </span>
              )}
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

  const G = {
    base: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
    violet: { background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
    emerald: { background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
    amber: { background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: '1.5rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as React.CSSProperties,
  };

  return (
    <div className="space-y-4 pb-4">

      {/* ── Section tabs ── */}
      <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { key: 'analytics', label: '📊 Analytics' },
          { key: 'peso', label: '⚖️ Peso' },
        ].map((tab) => (
          <button key={tab.key}
            onClick={() => setActiveSection(tab.key as 'analytics' | 'peso')}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeSection === tab.key ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: activeSection === tab.key ? '#F8FAFC' : 'rgba(248,250,252,0.40)',
              border: activeSection === tab.key ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
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
                <p className="text-3xl font-black" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>{streak}</p>
                <p className="text-xs font-bold" style={{ color: 'rgba(252,211,77,0.60)' }}>Giorni di fila</p>
              </motion.div>
              <motion.div className="p-4" style={G.violet}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                <div className="text-2xl mb-1">⚡</div>
                <p className="text-3xl font-black" style={{ color: '#A78BFA', fontFamily: 'var(--font-ui)' }}>{longestStreak}</p>
                <p className="text-xs font-bold" style={{ color: 'rgba(167,139,250,0.60)' }}>Record personale</p>
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
                <p className="text-base font-bold" style={{ color: 'rgba(248,250,252,0.55)' }}>Nessun dato ancora</p>
                <p className="text-sm" style={{ color: 'rgba(248,250,252,0.35)' }}>Inizia a tracciare i pasti per vedere i tuoi progressi!</p>
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
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>⚖️</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(248,250,252,0.40)' }}>Ultimo peso</p>
                  <p className="text-3xl font-black" style={{ color: '#F8FAFC' }}>
                    {latestWeight.rawValue} <span className="text-lg font-semibold">{latestWeight.rawUnit}</span>
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(248,250,252,0.50)' }}>
                    {new Date(latestWeight.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Weight trend chart */}
            {weeklyTrend.length >= 2 && (
              <motion.div className="p-4" style={G.base}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <WeightChart data={weeklyTrend}/>
              </motion.div>
            )}

            {/* Log form */}
            <motion.div className="p-5" style={G.emerald}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'rgba(248,250,252,0.60)' }}>
                📝 Registra peso
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Unit toggle */}
                <div className="flex rounded-xl p-0.5 gap-0.5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {(['kg','lbs'] as const).map((u) => (
                    <button key={u} type="button" onClick={() => setUnit(u)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold"
                      style={{
                        background: unit === u ? 'rgba(255,255,255,0.14)' : 'transparent',
                        color: unit === u ? '#F8FAFC' : 'rgba(248,250,252,0.40)',
                        border: unit === u ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                        fontFamily: 'var(--font-ui)',
                      }}>{u}</button>
                  ))}
                </div>
                <input type="number" step="0.1" min="0" max="500" value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={unit === 'kg' ? 'es. 75.5' : 'es. 166'}
                  required
                  className="glass-input w-full rounded-xl px-4 py-3 text-lg font-bold outline-none"
                  style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}/>
                <input type="number" step="1" min="100" max="250" value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="Altezza in cm (per BMI)"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}/>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note opzionali (es. dopo colazione)"
                  maxLength={120}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}/>
                <AnimatePresence>
                  {lastResult && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-4 py-3 rounded-xl text-sm font-bold"
                      style={'error' in lastResult
                        ? { background: 'rgba(244,63,94,0.15)', color: '#FDA4AF', border: '1.5px solid rgba(244,63,94,0.30)' }
                        : { background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1.5px solid rgba(16,185,129,0.30)' }
                      }>
                      {'error' in lastResult ? `❌ ${lastResult.error}` : `✅ Salvato: ${lastResult.kg} kg`}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button type="submit" disabled={loading || !value}
                  className="btn btn-emerald w-full py-3.5 disabled:opacity-50">
                  {loading ? 'Salvataggio...' : '⚖️ Salva peso'}
                </button>
              </form>
            </motion.div>

            {/* Recent logs */}
            {recentLogs.length > 0 && (
              <motion.div className="p-4" style={G.amber}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,250,252,0.50)' }}>
                  Ultime registrazioni
                </h3>
                <ul className="space-y-2">
                  {recentLogs.slice(0, 8).map((log, i) => (
                    <motion.li key={log.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: i < Math.min(recentLogs.length, 8) - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#F8FAFC' }}>{log.rawValue} {log.rawUnit}</p>
                        {log.notes && <p className="text-xs" style={{ color: 'rgba(248,250,252,0.55)' }}>{log.notes}</p>}
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'rgba(248,250,252,0.40)' }}>
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
                <p className="text-sm font-bold" style={{ color: 'rgba(248,250,252,0.55)' }}>Nessun peso registrato</p>
                <p className="text-xs" style={{ color: 'rgba(248,250,252,0.35)' }}>Inizia a tracciare il tuo peso!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
