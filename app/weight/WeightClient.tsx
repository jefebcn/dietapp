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
  background: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 100%)',
  border: '2.5px solid #A5B4FC',
  borderRadius: '1.5rem',
  boxShadow: '0 6px 0 #4338CA, 0 10px 28px rgba(67,56,202,0.15), inset 0 2px 0 rgba(255,255,255,0.70)',
};

const CARD_EMERALD = {
  background: 'linear-gradient(145deg, #ECFDF5 0%, #D1FAE5 100%)',
  border: '2.5px solid #6EE7B7',
  borderRadius: '1.5rem',
  boxShadow: '0 6px 0 #059669, 0 10px 28px rgba(5,150,105,0.12), inset 0 2px 0 rgba(255,255,255,0.70)',
};

const CARD_AMBER = {
  background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
  border: '2.5px solid #FDE68A',
  borderRadius: '1.5rem',
  boxShadow: '0 6px 0 #B45309, 0 10px 28px rgba(180,83,9,0.12), inset 0 2px 0 rgba(255,255,255,0.70)',
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
      <p className="text-xs font-extrabold uppercase tracking-wide mb-3" style={{ color: '#3730A3' }}>
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
                      : 'linear-gradient(180deg, #C7D2FE 0%, #A5B4FC 100%)',
                    boxShadow: isLatest ? '0 2px 0 #4338CA' : undefined,
                    border: isLatest ? '1.5px solid #818CF8' : '1px solid rgba(99,102,241,0.2)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                  title={`${w.period}: ${w.avgKg} kg avg`}
                />
              </div>
              <span
                className="text-[9px] font-bold text-center leading-tight"
                style={{ color: isLatest ? '#4338CA' : '#6366F1', opacity: isLatest ? 1 : 0.6 }}
              >
                {w.avgKg}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: '#6366F1', opacity: 0.6 }}>
          {data[0]?.period.replace('week_', 'S')}
        </span>
        <span className="text-[10px] font-bold" style={{ color: '#4338CA' }}>
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
              background: 'linear-gradient(145deg, #E0E7FF, #C7D2FE)',
              border: '3px solid #A5B4FC',
              boxShadow: '0 4px 0 #4338CA',
              fontSize: 28,
            }}
          >
            ⚖️
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#4338CA' }}>
              Ultimo aggiornamento
            </p>
            <p className="text-3xl font-black leading-tight" style={{ color: '#1E1B4B' }}>
              {latestWeight.rawValue} <span className="text-lg font-bold">{latestWeight.rawUnit}</span>
            </p>
            <p className="text-xs" style={{ color: '#6366F1', opacity: 0.8 }}>
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
        <h2 className="text-sm font-extrabold uppercase tracking-wide mb-4" style={{ color: '#065F46' }}>
          📝 Registra peso
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Unit toggle */}
          <div
            className="flex rounded-xl p-0.5 gap-0.5"
            style={{ background: 'rgba(255,255,255,0.6)', border: '2px solid #6EE7B7' }}
          >
            {(['kg', 'lbs'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: unit === u ? 'linear-gradient(145deg, #D1FAE5, #A7F3D0)' : 'transparent',
                  color: unit === u ? '#065F46' : '#6B7280',
                  boxShadow: unit === u ? '0 2px 0 #059669' : 'none',
                  border: unit === u ? '1.5px solid #6EE7B7' : '1.5px solid transparent',
                }}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Weight input */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#065F46' }}>
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
              className="w-full rounded-xl px-4 py-3 text-lg font-bold outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '2px solid #6EE7B7',
                color: '#1E1B4B',
                boxShadow: '0 2px 0 #059669, inset 0 2px 6px rgba(0,0,0,0.04)',
              }}
            />
          </div>

          {/* Height (optional, for BMI) */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#065F46' }}>
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
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '2px solid #6EE7B7',
                color: '#1E1B4B',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#065F46' }}>
              Note (opzionale)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Dopo colazione"
              maxLength={120}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '2px solid #6EE7B7',
                color: '#1E1B4B',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
              }}
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
                    ? { background: '#FFE4E6', color: '#BE123C', border: '2px solid #FECDD3' }
                    : { background: '#D1FAE5', color: '#065F46', border: '2px solid #6EE7B7' }
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
            className="w-full py-3.5 rounded-2xl text-base font-extrabold disabled:opacity-50"
            style={{
              background: 'linear-gradient(145deg, #34D399, #10B981)',
              color: '#fff',
              border: '2.5px solid #6EE7B7',
              boxShadow: '0 5px 0 #065F46',
              fontFamily: 'var(--font-ui)',
            }}
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
          <h3 className="text-sm font-extrabold uppercase tracking-wide mb-3" style={{ color: '#92400E' }}>
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
                style={{ borderBottom: i < recentLogs.length - 1 ? '2px solid rgba(180,83,9,0.10)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-extrabold" style={{ color: '#1E1B4B' }}>
                    {log.rawValue} {log.rawUnit}
                  </p>
                  {log.notes && (
                    <p className="text-xs" style={{ color: '#92400E', opacity: 0.75 }}>
                      {log.notes}
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold" style={{ color: '#B45309' }}>
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
