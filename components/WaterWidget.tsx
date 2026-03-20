'use client';

/**
 * WaterWidget.tsx – Daily hydration tracker
 *
 * Shows 8 droplet icons (each = 250 ml).
 * Quick-add buttons: +250, +500, +750 ml.
 * Calls logWaterAction server action optimistically.
 */

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logWaterAction } from '@/lib/actions/mealActions';
import type { WaterResult } from '@/lib/actions/mealActions';

const GLASS_ML = 250;
const QUICK_OPTIONS = [
  { label: '🥛 1 bicchiere', ml: 250 },
  { label: '🍶 500 ml', ml: 500 },
  { label: '🧴 750 ml', ml: 750 },
];

interface Props {
  initial: WaterResult;
}

export function WaterWidget({ initial }: Props) {
  const [water, setWater] = useState<WaterResult>(initial);
  const [isPending, startTransition] = useTransition();
  const [lastAdded, setLastAdded] = useState<number | null>(null);

  function handleAdd(ml: number) {
    // Optimistic update
    const optimisticTotal = Math.min(water.totalMl + ml, water.goalMl * 1.5);
    setWater((prev) => ({
      ...prev,
      totalMl: optimisticTotal,
      glasses: Math.floor(optimisticTotal / GLASS_ML),
      pct: Math.min(Math.round((optimisticTotal / prev.goalMl) * 100), 100),
    }));
    setLastAdded(ml);
    setTimeout(() => setLastAdded(null), 1800);

    startTransition(async () => {
      const res = await logWaterAction(ml);
      if (res.success) {
        setWater(res);
      }
    });
  }

  const filled = Math.min(water.glasses, water.goalGlasses);
  const total = water.goalGlasses; // 8

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      style={{
        background: '#EFF6FF',
        border: '1.5px solid #BFDBFE',
        borderRadius: 20,
        padding: '14px 16px',
        marginBottom: 14,
        boxShadow: '0 2px 10px rgba(59,130,246,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(59,130,246,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
          }}>💧</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', lineHeight: 1 }}>Idratazione</p>
            <p style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Obiettivo: 2 L / giorno</p>
          </div>
        </div>

        {/* Counter */}
        <div style={{ textAlign: 'right' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={water.totalMl}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              style={{ fontSize: 18, fontWeight: 900, color: water.pct >= 100 ? '#22C55E' : '#3B82F6', lineHeight: 1 }}
            >
              {water.totalMl >= 1000
                ? `${(water.totalMl / 1000).toFixed(1).replace('.0', '')} L`
                : `${water.totalMl} ml`}
            </motion.p>
          </AnimatePresence>
          <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
            {water.pct}% · {water.goalMl / 1000} L goal
          </p>
        </div>
      </div>

      {/* Glass dots */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < filled;
          const isJustAdded = lastAdded !== null && i >= filled - Math.floor(lastAdded / GLASS_ML) && i < filled;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: isJustAdded ? [1, 1.25, 1] : 1,
                background: isFilled ? '#3B82F6' : '#DBEAFE',
              }}
              transition={{ duration: 0.35 }}
              style={{
                flex: 1, height: 28, borderRadius: 8,
                border: `1.5px solid ${isFilled ? 'rgba(59,130,246,0.40)' : '#BFDBFE'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11,
              }}
            >
              {isFilled ? '💧' : ''}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{
        height: 5, background: '#DBEAFE', borderRadius: 99,
        overflow: 'hidden', marginBottom: 12,
      }}>
        <motion.div
          animate={{ width: `${water.pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: water.pct >= 100
              ? 'linear-gradient(90deg, #22C55E, #16A34A)'
              : 'linear-gradient(90deg, #60A5FA, #3B82F6)',
            borderRadius: 99,
          }}
        />
      </div>

      {/* Quick-add buttons */}
      {water.pct < 100 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {QUICK_OPTIONS.map(({ label, ml }) => (
            <motion.button
              key={ml}
              onClick={() => handleAdd(ml)}
              disabled={isPending}
              whileTap={{ scale: 0.93 }}
              style={{
                flex: 1,
                padding: '7px 2px',
                borderRadius: 11,
                border: '1.5px solid rgba(59,130,246,0.25)',
                background: '#fff',
                fontSize: 10,
                fontWeight: 700,
                color: '#3B82F6',
                cursor: 'pointer',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Goal reached */}
      {water.pct >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '6px 0',
            fontSize: 13,
            fontWeight: 700,
            color: '#16A34A',
          }}
        >
          ✅ Obiettivo idratazione raggiunto!
        </motion.div>
      )}
    </motion.div>
  );
}
