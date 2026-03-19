'use client';

/**
 * WeightClient.tsx  –  Interactive Weight Logging + History
 *
 * Features:
 *   - Log weight (kg or lbs) via logWeightAction Server Action
 *   - View recent logs list (Bronze layer)
 *   - View weekly trend chart (Gold layer)
 *   - BMI estimation (optional height input)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logWeightAction } from '@/lib/actions/mealActions';
import type { BronzeLog, GoldMetrics } from '@/lib/repositories/weightRepository';

interface Props {
  recentLogs: (BronzeLog & { id: string })[];
  weeklyTrend: GoldMetrics[];
}

// ── Card styles ─────────────────────────────────────────────────────────────

const CARD_INDIGO = {
  background: 'rgba(99,102,241,0.12)',
  border: '1px solid rgba(165,180,252,0.25)',
  borderRadius: '1.5rem',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const CARD_EMERALD = {
  background: 'rgba(16,185,129,0.12)',
  border: '1px solid rgba(110,231,183,0.25)',
  borderRadius: '1.5rem',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const CARD_AMBER = {
  background: 'rgba(245,158,11,0.12)',
  border: '1px solid rgba(253,230,138,0.25)',
  borderRadius: '1.5rem',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

// ── Mini bar chart ───────────────────────────────────────────────────────────

function TrendChart({ data }: { data: GoldMetrics[] }) {
  if (data.length === 0) return null;

  const weights = data.map((d) => d.avgKg);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min;

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,250,252,0.65)' }}>
        Andamento settimanale
      </p>
      <div className="flex items-end gap-1.5 h-20">
        {data.map((w, i) => {
          const pct = range > 0 ? ((w.avgKg - min) / range) * 100 : 50;
          const isLatest = i === data.length - 1;
          return (
            <div key={w.period} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 60 }}>
                <motion.div
                  className="w-full rounded-t-lg"
                  style={{
                    background: isLatest
                      ? 'linear-gradient(180deg, #818CF8 0%, #6366F1 100%)'
                      : 'rgba(165,180,252,0.35)',
                    border: isLatest ? '1.5px solid rgba(165,180,252,0.5)' : '1px solid rgba(165,180,252,0.15)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                  title={`${w.period}: ${w.avgKg} kg avg`}
                />
              </div>
              <span
                className="text-[9px] font-bold text-center leading-tight"
                style={{ color: isLatest ? '#A5B4FC' : 'rgba(165,180,252,0.6)' }}
              >
                {w.avgKg}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'rgba(248,250,252,0.40)' }}>
          {data[0]?.period.replace('week_', 'S')}
        </span>
        <span className="text-[10px] font-bold" style={{ color: 'rgba(248,250,252,0.65)' }}>
          {data[data.length - 1]?.period.replace('week_', 'S')}
        </span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function WeightClient({ recentLogs, weeklyTrend }: Props) {
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ kg: number } | { error: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawValue = parseFloat(value);
    if (!rawValue || rawValue <= 0) return;

    setLoading(true);
    setLastResult(null);

    const result = await logWeightAction({
      rawValue,
      rawUnit: unit,
      notes: notes || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
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

  const latestWeight = recentLogs[0];

  return (
    <div className="space-y-4">

      {/* Last recorded weight */}
      {latestWeight && (
        <motion.div
          className="p-4 flex items-center gap-4"
          style={CARD_INDIGO}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-2xl"
            style={{
              width: 60, height: 60,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.18)',
              fontSize: 28,
            }}
          >
            ⚖️
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: 'rgba(248,250,252,0.40)' }}>
              Ultimo aggiornamento
            </p>
            <p className="text-3xl font-black leading-tight" style={{ color: '#F8FAFC' }}>
              {latestWeight.rawValue} <span className="text-lg font-bold">{latestWeight.rawUnit}</span>
            </p>
            <p className="text-xs" style={{ color: 'rgba(248,250,252,0.65)' }}>
              {new Date(latestWeight.createdAt).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </motion.div>
      )}

      {/* Log form */}
      <motion.div
        className="p-5"
        style={CARD_EMERALD}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wide mb-4" style={{ color: 'rgba(248,250,252,0.65)' }}>
          📝 Registra peso
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Unit toggle */}
          <div
            className="flex rounded-xl p-0.5 gap-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            {(['kg', 'lbs'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: unit === u ? 'rgba(255,255,255,0.14)' : 'transparent',
                  color: unit === u ? '#F8FAFC' : 'rgba(248,250,252,0.40)',
                  border: unit === u ? '1.5px solid rgba(255,255,255,0.18)' : '1.5px solid transparent',
                }}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Weight input */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'rgba(248,250,252,0.65)' }}>
              Peso ({unit})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="500"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={unit === 'kg' ? 'es. 75.5' : 'es. 166'}
              required
              className="glass-input w-full rounded-xl px-4 py-3 text-lg font-bold outline-none transition-all"
              style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}
            />
          </div>

          {/* Height (optional, for BMI) */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'rgba(248,250,252,0.65)' }}>
              Altezza in cm (opzionale, per BMI)
            </label>
            <input
              type="number"
              step="1"
              min="100"
              max="250"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="es. 175"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all"
              style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'rgba(248,250,252,0.65)' }}>
              Note (opzionale)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Dopo colazione"
              maxLength={120}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all"
              style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}
            />
          </div>

          {/* Result feedback */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-3 rounded-xl text-sm font-bold"
                style={
                  'error' in lastResult
                    ? { background: 'rgba(244,63,94,0.15)', color: '#FDA4AF', border: '1.5px solid rgba(244,63,94,0.30)' }
                    : { background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1.5px solid rgba(16,185,129,0.30)' }
                }
              >
                {'error' in lastResult
                  ? `❌ ${lastResult.error}`
                  : `✅ Salvato: ${lastResult.kg} kg`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || !value}
            className="btn btn-emerald w-full py-3.5 disabled:opacity-50"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98, y: 3 }}
          >
            {loading ? 'Salvataggio...' : '⚖️ Salva peso'}
          </motion.button>
        </form>
      </motion.div>

      {/* Weekly trend chart */}
      {weeklyTrend.length > 0 && (
        <motion.div
          className="p-4"
          style={CARD_INDIGO}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <TrendChart data={weeklyTrend} />
        </motion.div>
      )}

      {/* Recent logs list */}
      {recentLogs.length > 0 && (
        <motion.div
          className="p-4"
          style={CARD_AMBER}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <h3 className="text-sm font-extrabold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,250,252,0.65)' }}>
            Ultime registrazioni
          </h3>
          <ul className="space-y-2">
            {recentLogs.map((log, i) => (
              <motion.li
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: i < recentLogs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-extrabold" style={{ color: '#F8FAFC' }}>
                    {log.rawValue} {log.rawUnit}
                  </p>
                  {log.notes && (
                    <p className="text-xs" style={{ color: 'rgba(248,250,252,0.65)' }}>
                      {log.notes}
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold" style={{ color: 'rgba(248,250,252,0.40)' }}>
                  {new Date(log.createdAt).toLocaleDateString('it-IT', {
                    day: 'numeric', month: 'short',
                  })}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {recentLogs.length === 0 && weeklyTrend.length === 0 && (
        <motion.div
          className="py-12 flex flex-col items-center gap-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-5xl">⚖️</span>
          <p className="text-base font-bold" style={{ color: '#4338CA' }}>Nessun peso registrato</p>
          <p className="text-sm" style={{ color: '#6366F1', opacity: 0.8 }}>
            Inizia a tracciare il tuo peso per vedere i progressi!
          </p>
        </motion.div>
      )}
    </div>
  );
}
