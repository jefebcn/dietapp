'use client';

/**
 * WeightClient.tsx  –  Weight Analytics Dashboard
 *
 * Sections:
 *   1. Stats row – current weight, BMI, period delta, weekly avg
 *   2. Line chart – smooth SVG bezier with period selector (7d / 30d / All)
 *   3. BMI gauge  – horizontal gradient bar with animated needle
 *   4. Weekly averages bar chart (from Gold metrics)
 *   5. Log form   – unit toggle, weight + height inputs, notes
 *   6. History table – recent logs with delta vs previous entry
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logWeightAction } from '@/lib/actions/mealActions';
import type { BronzeLog, GoldMetrics } from '@/lib/repositories/weightRepository';

// ── Types & helpers ───────────────────────────────────────────────────────────

interface Props {
  recentLogs: (BronzeLog & { id: string })[];
  weeklyTrend: GoldMetrics[];
}

interface ChartPoint {
  date: string;
  kg: number;
  label: string;
}

function toKg(value: number, unit: 'kg' | 'lbs'): number {
  return unit === 'kg' ? value : Math.round(value * 0.453592 * 10) / 10;
}

function getBmiInfo(bmi: number): { label: string; color: string; gaugePct: number } {
  if (bmi < 18.5) return { label: 'Sottopeso',  color: '#22D3EE', gaugePct: 8  };
  if (bmi < 25)   return { label: 'Normopeso',  color: '#34D399', gaugePct: 36 };
  if (bmi < 30)   return { label: 'Sovrappeso', color: '#FBBF24', gaugePct: 66 };
  return           { label: 'Obeso',            color: '#F87171', gaugePct: 89 };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, unit, color, sub,
}: {
  label: string; value: string; unit?: string; color: string; sub?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '1rem',
      padding: '12px 14px',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'rgba(248,250,252,0.45)', marginBottom: 4,
      }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color }}>
        {value}
        {unit && (
          <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 3, color: 'rgba(248,250,252,0.50)' }}>
            {unit}
          </span>
        )}
      </p>
      {sub && (
        <p style={{ fontSize: 10, marginTop: 4, color: 'rgba(248,250,252,0.40)', fontWeight: 600 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function WeightLineChart({ points }: { points: ChartPoint[] }) {
  if (points.length < 2) {
    return (
      <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 32 }}>📊</span>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(248,250,252,0.35)' }}>
          Registra almeno 2 pesate per il grafico
        </p>
      </div>
    );
  }

  const W = 300, H = 140, pX = 10, pY = 16;
  const plotW = W - pX * 2;
  const plotH = H - pY * 2;

  const weights = points.map((p) => p.kg);
  const minW = Math.min(...weights) - 0.8;
  const maxW = Math.max(...weights) + 0.8;
  const range = maxW - minW || 1;

  const toX = (i: number) => pX + (i / (points.length - 1)) * plotW;
  const toY = (kg: number) => pY + (1 - (kg - minW) / range) * plotH;

  // Smooth cubic bezier path
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
  const lineColor = delta > 0.05 ? '#F87171' : delta < -0.05 ? '#34D399' : '#A78BFA';
  const lastIdx = points.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="wLineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={lineColor} stopOpacity="0.30" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* Dashed grid lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pX} y1={(pY + f * plotH).toFixed(1)}
          x2={W - pX} y2={(pY + f * plotH).toFixed(1)}
          stroke="rgba(255,255,255,0.055)" strokeWidth="1" strokeDasharray="4 4"
        />
      ))}

      {/* Gradient fill under line */}
      <path d={fillPath} fill="url(#wLineGrad)" />

      {/* Line */}
      <path
        d={linePath} fill="none"
        stroke={lineColor} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
      />

      {/* First + last dots */}
      {[0, lastIdx].map((i) => (
        <g key={i}>
          <circle
            cx={toX(i).toFixed(1)} cy={toY(points[i].kg).toFixed(1)}
            r={i === lastIdx ? 5 : 3.5}
            fill={i === lastIdx ? lineColor : 'rgba(255,255,255,0.22)'}
            stroke="rgba(8,11,20,0.85)" strokeWidth="1.5"
          />
          {i === lastIdx && (
            <text
              x={toX(i).toFixed(1)} y={(toY(points[i].kg) - 9).toFixed(1)}
              fill={lineColor} fontSize="9" fontWeight="800" textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {points[i].kg}
            </text>
          )}
        </g>
      ))}

      {/* Date axis labels */}
      <text x={pX} y={H - 1} fill="rgba(248,250,252,0.35)"
        fontSize="8.5" textAnchor="start" fontFamily="Inter, system-ui, sans-serif">
        {points[0].label}
      </text>
      <text x={W - pX} y={H - 1} fill="rgba(248,250,252,0.55)"
        fontSize="8.5" textAnchor="end" fontFamily="Inter, system-ui, sans-serif">
        {points[lastIdx].label}
      </text>
    </svg>
  );
}

// ── BMI Gauge ─────────────────────────────────────────────────────────────────

function BmiGauge({ bmi }: { bmi: number }) {
  const { label, color, gaugePct } = getBmiInfo(bmi);
  const zones = [
    { label: '<18.5', color: '#22D3EE' },
    { label: '18–25', color: '#34D399' },
    { label: '25–30', color: '#FBBF24' },
    { label: '>30',   color: '#F87171' },
  ];

  return (
    <div>
      <div style={{ position: 'relative', height: 6, borderRadius: 999,
        background: 'linear-gradient(90deg, #22D3EE 0%, #34D399 30%, #FBBF24 65%, #F87171 100%)' }}>
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${Math.min(gaugePct, 92)}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 14, height: 14, borderRadius: '50%',
            background: color,
            border: '2.5px solid rgba(8,11,20,0.90)',
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        {zones.map((z) => (
          <span key={z.label} style={{ fontSize: 8, fontWeight: 600, color: z.color }}>{z.label}</span>
        ))}
      </div>
      <p style={{ fontSize: 12, fontWeight: 800, color, textAlign: 'center', marginTop: 5 }}>{label}</p>
    </div>
  );
}

// ── Weekly Averages Bar Chart ─────────────────────────────────────────────────

function WeeklyBars({ data }: { data: GoldMetrics[] }) {
  const sorted = [...data].reverse(); // oldest → newest
  const weights = sorted.map((d) => d.avgKg);
  const minW = Math.min(...weights) - 0.3;
  const maxW = Math.max(...weights) + 0.3;
  const range = maxW - minW || 1;

  return (
    <div>
      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'rgba(248,250,252,0.45)', marginBottom: 12,
      }}>
        Media settimanale (kg)
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72 }}>
        {sorted.map((w, i) => {
          const pct = ((w.avgKg - minW) / range) * 100;
          const isLast = i === sorted.length - 1;
          const trendArrow = w.trend > 0.01 ? '▲' : w.trend < -0.01 ? '▼' : '–';
          const trendColor = w.trend > 0.01 ? '#F87171' : w.trend < -0.01 ? '#34D399' : 'rgba(248,250,252,0.40)';
          const weekLabel = w.period.replace('week_', '').split('-')[1] ?? '';

          return (
            <div key={w.period} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{
                fontSize: 8, fontWeight: 700,
                color: isLast ? '#A78BFA' : 'rgba(248,250,252,0.30)',
              }}>
                {w.avgKg}
              </span>
              <div style={{ width: '100%', height: 52, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <motion.div
                  style={{
                    width: '100%', borderRadius: '5px 5px 3px 3px',
                    background: isLast
                      ? 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 100%)'
                      : 'rgba(139,92,246,0.22)',
                    border: `1px solid ${isLast ? 'rgba(167,139,250,0.45)' : 'rgba(139,92,246,0.15)'}`,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 6)}%` }}
                  transition={{ duration: 0.55, delay: i * 0.05, ease: 'easeOut' }}
                />
              </div>
              <span style={{ fontSize: 7, color: 'rgba(248,250,252,0.30)' }}>S{weekLabel}</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: trendColor }}>{trendArrow}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WeightClient({ recentLogs, weeklyTrend }: Props) {
  const [unit, setUnit]       = useState<'kg' | 'lbs'>('kg');
  const [value, setValue]     = useState('');
  const [notes, setNotes]     = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ kg: number } | { error: string } | null>(null);
  const [period, setPeriod]   = useState<'7d' | '30d' | 'all'>('30d');

  // Derived values
  const latestLog  = recentLogs[0];
  const latestKg   = latestLog ? toKg(latestLog.rawValue, latestLog.rawUnit) : null;
  const h          = parseFloat(heightCm);
  const bmi        = latestKg && h > 0 ? Math.round((latestKg / ((h / 100) ** 2)) * 10) / 10 : null;
  const isEmpty    = recentLogs.length === 0;

  // Chart data filtered by period
  const chartPoints = useMemo<ChartPoint[]>(() => {
    const now    = Date.now();
    const cutoff = period === '7d'  ? now - 7  * 86_400_000
                 : period === '30d' ? now - 30 * 86_400_000
                 : 0;
    return recentLogs
      .filter((l) => new Date(l.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((l) => ({
        date:  l.createdAt.split('T')[0],
        kg:    toKg(l.rawValue, l.rawUnit),
        label: new Date(l.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
      }));
  }, [recentLogs, period]);

  const totalDelta = chartPoints.length >= 2
    ? +(chartPoints[chartPoints.length - 1].kg - chartPoints[0].kg).toFixed(1)
    : null;

  const weekDelta = weeklyTrend.length >= 2
    ? +(weeklyTrend[0].avgKg - weeklyTrend[1].avgKg).toFixed(1)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawValue = parseFloat(value);
    if (!rawValue || rawValue <= 0) return;
    setLoading(true);
    setLastResult(null);
    const result = await logWeightAction({
      rawValue, rawUnit: unit,
      notes: notes || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      heightCm: h > 0 ? h : undefined,
    });
    setLoading(false);
    if (result.success) {
      setLastResult({ kg: result.weightKg });
      setValue('');
      setNotes('');
    } else {
      setLastResult({ error: result.error });
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── 1. Stats Row ── */}
      {!isEmpty && (
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Current weight */}
          <StatCard
            label="Peso attuale"
            value={latestKg?.toFixed(1) ?? '—'}
            unit="kg"
            color="#A78BFA"
            sub={latestLog
              ? new Date(latestLog.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
              : undefined}
          />

          {/* BMI or prompt to add height */}
          {bmi ? (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '1rem', padding: '12px 14px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(248,250,252,0.45)', marginBottom: 4 }}>
                BMI
              </p>
              <p style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: getBmiInfo(bmi).color }}>
                {bmi.toFixed(1)}
              </p>
              <p style={{ fontSize: 10, marginTop: 4, fontWeight: 800, color: getBmiInfo(bmi).color }}>
                {getBmiInfo(bmi).label}
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: '1rem', padding: '12px 14px',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', gap: 5,
            }}>
              <span style={{ fontSize: 22 }}>📏</span>
              <p style={{ fontSize: 10, color: 'rgba(248,250,252,0.40)', fontWeight: 600, textAlign: 'center' }}>
                Aggiungi altezza per il BMI
              </p>
            </div>
          )}

          {/* Period delta */}
          {totalDelta !== null && (
            <StatCard
              label={`Δ ${period === 'all' ? 'totale' : period}`}
              value={`${totalDelta >= 0 ? '+' : ''}${totalDelta}`}
              unit="kg"
              color={totalDelta > 0 ? '#F87171' : totalDelta < 0 ? '#34D399' : '#A78BFA'}
              sub={totalDelta > 0 ? '▲ in aumento' : totalDelta < 0 ? '▼ in calo' : '— stabile'}
            />
          )}

          {/* Weekly avg delta */}
          {weekDelta !== null && (
            <StatCard
              label="Δ sett. scorsa"
              value={`${weekDelta >= 0 ? '+' : ''}${weekDelta}`}
              unit="kg"
              color={weekDelta > 0 ? '#F87171' : weekDelta < 0 ? '#34D399' : '#A78BFA'}
              sub={weeklyTrend[0]?.avgKg ? `Media: ${weeklyTrend[0].avgKg} kg` : undefined}
            />
          )}
        </motion.div>
      )}

      {/* ── 2. Line Chart ── */}
      {!isEmpty && (
        <motion.div
          style={{
            background: 'rgba(139,92,246,0.07)',
            border: '1px solid rgba(139,92,246,0.22)',
            borderRadius: '1.5rem', padding: 16,
            backdropFilter: 'blur(16px)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {/* Header + period selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'rgba(248,250,252,0.55)',
            }}>
              Andamento peso
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['7d', '30d', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8,
                    background: period === p ? 'rgba(139,92,246,0.28)' : 'transparent',
                    color: period === p ? '#C4B5FD' : 'rgba(248,250,252,0.35)',
                    border: `1px solid ${period === p ? 'rgba(139,92,246,0.45)' : 'transparent'}`,
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                >
                  {p === 'all' ? 'Tutto' : p}
                </button>
              ))}
            </div>
          </div>

          <WeightLineChart points={chartPoints} />

          {/* Delta label below chart */}
          {totalDelta !== null && chartPoints.length >= 2 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 10, paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(248,250,252,0.40)' }}>
                Inizio: {chartPoints[0].kg} kg
              </span>
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: totalDelta > 0 ? '#F87171' : totalDelta < 0 ? '#34D399' : '#A78BFA',
              }}>
                {totalDelta >= 0 ? '▲ +' : '▼ '}{Math.abs(totalDelta)} kg nel periodo
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* ── 3. BMI Gauge ── */}
      {bmi && (
        <motion.div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '1.5rem', padding: 16,
            backdropFilter: 'blur(16px)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <p style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(248,250,252,0.55)', marginBottom: 12,
          }}>
            Indice di Massa Corporea
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center', minWidth: 58 }}>
              <p style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: getBmiInfo(bmi).color }}>
                {bmi.toFixed(1)}
              </p>
              <p style={{ fontSize: 11, fontWeight: 800, color: getBmiInfo(bmi).color, marginTop: 3 }}>
                {getBmiInfo(bmi).label}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <BmiGauge bmi={bmi} />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 4. Weekly Bars ── */}
      {weeklyTrend.length > 1 && (
        <motion.div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '1.5rem', padding: 16,
            backdropFilter: 'blur(16px)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <WeeklyBars data={weeklyTrend} />
        </motion.div>
      )}

      {/* ── 5. Log Form ── */}
      <motion.div
        style={{
          background: 'rgba(52,211,153,0.07)',
          border: '1px solid rgba(52,211,153,0.22)',
          borderRadius: '1.5rem', padding: 18,
          backdropFilter: 'blur(16px)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isEmpty ? 0 : 0.22 }}
      >
        <h2 style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'rgba(248,250,252,0.55)', marginBottom: 14,
        }}>
          ⚖️ Registra peso
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Unit toggle */}
          <div style={{
            display: 'flex', gap: 4, padding: 3, borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            {(['kg', 'lbs'] as const).map((u) => (
              <button
                key={u} type="button" onClick={() => setUnit(u)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 9,
                  fontSize: 13, fontWeight: 700,
                  background: unit === u ? 'rgba(255,255,255,0.14)' : 'transparent',
                  color: unit === u ? '#F8FAFC' : 'rgba(248,250,252,0.40)',
                  border: `1.5px solid ${unit === u ? 'rgba(255,255,255,0.18)' : 'transparent'}`,
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Weight + Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.55)', marginBottom: 5 }}>
                Peso ({unit})
              </label>
              <input
                type="number" step="0.1" min="0" max="500"
                value={value} onChange={(e) => setValue(e.target.value)}
                placeholder={unit === 'kg' ? '75.5' : '166'}
                required
                className="glass-input w-full rounded-xl px-3 py-2.5 text-base font-bold outline-none"
                style={{ color: '#F8FAFC' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.55)', marginBottom: 5 }}>
                Altezza (cm)
              </label>
              <input
                type="number" step="1" min="100" max="250"
                value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
                style={{ color: '#F8FAFC' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.55)', marginBottom: 5 }}>
              Note (opzionale)
            </label>
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Dopo colazione"
              maxLength={120}
              className="glass-input w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
              style={{ color: '#F8FAFC' }}
            />
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={
                  'error' in lastResult
                    ? { background: 'rgba(244,63,94,0.12)', color: '#FDA4AF', border: '1.5px solid rgba(244,63,94,0.28)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700 }
                    : { background: 'rgba(16,185,129,0.12)', color: '#6EE7B7', border: '1.5px solid rgba(16,185,129,0.28)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700 }
                }
              >
                {'error' in lastResult ? `❌ ${lastResult.error}` : `✅ Salvato: ${lastResult.kg} kg`}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading || !value}
            className="btn btn-emerald w-full py-3.5 disabled:opacity-50"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98, y: 2 }}
          >
            {loading ? 'Salvataggio...' : '⚖️ Salva peso'}
          </motion.button>
        </form>
      </motion.div>

      {/* ── 6. History Table ── */}
      {recentLogs.length > 0 && (
        <motion.div
          style={{
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.20)',
            borderRadius: '1.5rem', padding: 16,
            backdropFilter: 'blur(16px)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isEmpty ? 0.08 : 0.30 }}
        >
          <h3 style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(248,250,252,0.55)', marginBottom: 12,
          }}>
            Storico pesate
          </h3>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto',
            gap: 8, paddingBottom: 8,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 4,
          }}>
            {['Data', 'Peso', 'Δ'].map((h) => (
              <span key={h} style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'rgba(248,250,252,0.30)',
                textAlign: h !== 'Data' ? 'right' : 'left',
                minWidth: h === 'Δ' ? 38 : undefined,
              }}>
                {h}
              </span>
            ))}
          </div>

          <ul>
            {recentLogs.slice(0, 14).map((log, i) => {
              const prev    = recentLogs[i + 1];
              const currKg  = toKg(log.rawValue, log.rawUnit);
              const prevKg  = prev ? toKg(prev.rawValue, prev.rawUnit) : null;
              const delta   = prevKg !== null ? +(currKg - prevKg).toFixed(1) : null;
              const dColor  = delta === null ? 'transparent'
                            : delta > 0  ? '#F87171'
                            : delta < 0  ? '#34D399'
                            : 'rgba(248,250,252,0.40)';

              return (
                <motion.li
                  key={log.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    gap: 8, padding: '8px 2px', alignItems: 'center',
                    borderBottom: i < Math.min(recentLogs.length, 14) - 1
                      ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>
                      {new Date(log.createdAt).toLocaleDateString('it-IT', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </p>
                    {log.notes && (
                      <p style={{ fontSize: 10, color: 'rgba(248,250,252,0.40)', marginTop: 1 }}>
                        {log.notes}
                      </p>
                    )}
                  </div>

                  <p style={{
                    fontSize: 14, fontWeight: 900, textAlign: 'right',
                    color: i === 0 ? '#A78BFA' : '#F8FAFC',
                  }}>
                    {log.rawValue}
                    <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(248,250,252,0.40)', marginLeft: 2 }}>
                      {log.rawUnit}
                    </span>
                  </p>

                  <p style={{
                    fontSize: 11, fontWeight: 800, textAlign: 'right',
                    minWidth: 38, color: dColor,
                  }}>
                    {delta !== null ? `${delta > 0 ? '+' : ''}${delta}` : '—'}
                  </p>
                </motion.li>
              );
            })}
          </ul>

          {recentLogs.length > 14 && (
            <p style={{ fontSize: 11, color: 'rgba(248,250,252,0.30)', textAlign: 'center', marginTop: 10 }}>
              + altri {recentLogs.length - 14} log
            </p>
          )}
        </motion.div>
      )}

      {/* ── Empty state ── */}
      {isEmpty && (
        <motion.div
          style={{ padding: '56px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{
            width: 72, height: 72,
            background: 'rgba(139,92,246,0.12)',
            border: '1.5px solid rgba(139,92,246,0.28)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
          }}>
            ⚖️
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginBottom: 6 }}>
              Nessun peso registrato
            </p>
            <p style={{ fontSize: 13, color: 'rgba(248,250,252,0.45)', lineHeight: 1.6 }}>
              Inizia a tracciare il tuo peso per<br />visualizzare grafici e analisi completa
            </p>
          </div>
        </motion.div>
      )}

    </div>
  );
}
