'use client';

/**
 * PlanClient.tsx  –  Weekly Meal Plan
 *
 * Features:
 *  • 7-day week strip with day selector
 *  • Meal slots: Colazione, Pranzo, Cena, Spuntini
 *  • Per-slot calorie & macro summary
 *  • Add / remove meal entries (local state demo)
 *  • Nutrition goals progress for selected day
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlanMeal {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

interface MealSlot {
  key: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  time: string;
  meals: PlanMeal[];
}

// ── Week helpers ──────────────────────────────────────────────────────────────

function buildWeek() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1 + i); // Mon–Sun
    return {
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

// ── Suggested meals library ───────────────────────────────────────────────────

const SUGGESTIONS: PlanMeal[] = [
  { id: 's1', name: 'Yogurt greco + frutti rossi', kcal: 140, protein: 12, carbs: 14, fat: 3, portion: '180g' },
  { id: 's2', name: 'Avena con banane',             kcal: 310, protein: 10, carbs: 58, fat: 5, portion: '300g' },
  { id: 's3', name: 'Toast integrale + uova',       kcal: 280, protein: 18, carbs: 26, fat: 10, portion: '2 fette' },
  { id: 's4', name: 'Insalata di pollo',            kcal: 350, protein: 35, carbs: 12, fat: 14, portion: '300g' },
  { id: 's5', name: 'Pasta al pesto',               kcal: 420, protein: 14, carbs: 72, fat: 11, portion: '200g' },
  { id: 's6', name: 'Bowl di salmone',              kcal: 480, protein: 38, carbs: 40, fat: 16, portion: '350g' },
  { id: 's7', name: 'Zuppa di legumi',              kcal: 260, protein: 15, carbs: 38, fat: 5, portion: '350ml' },
  { id: 's8', name: 'Petto di pollo + riso',        kcal: 390, protein: 40, carbs: 45, fat: 6, portion: '300g' },
  { id: 's9', name: 'Mandorle + frutta secca',      kcal: 180, protein: 5, carbs: 10, fat: 14, portion: '40g' },
  { id: 's10', name: 'Frullato proteico',           kcal: 210, protein: 25, carbs: 20, fat: 4, portion: '400ml' },
];

const INIT_SLOTS: Omit<MealSlot, 'meals'>[] = [
  { key: 'colazione',  label: 'Colazione',  emoji: '🌅', color: '#F97316', bgColor: '#FFF7ED', time: '07:30' },
  { key: 'pranzo',     label: 'Pranzo',     emoji: '☀️', color: '#22C55E', bgColor: '#F0FDF4', time: '12:30' },
  { key: 'cena',       label: 'Cena',       emoji: '🌙', color: '#0EA5E9', bgColor: '#F0F9FF', time: '19:30' },
  { key: 'spuntini',   label: 'Spuntini',   emoji: '🍎', color: '#F59E0B', bgColor: '#FFFBEB', time: 'Varie' },
];

// ── Slot card ─────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  onAdd,
  onRemove,
}: {
  slot: MealSlot;
  onAdd: (slotKey: string) => void;
  onRemove: (slotKey: string, mealId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalKcal = slot.meals.reduce((s, m) => s + m.kcal, 0);
  const totalP    = slot.meals.reduce((s, m) => s + m.protein, 0);
  const totalC    = slot.meals.reduce((s, m) => s + m.carbs, 0);
  const totalF    = slot.meals.reduce((s, m) => s + m.fat, 0);

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 16px',
          background: slot.bgColor, border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `${slot.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            {slot.emoji}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917' }}>{slot.label}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF' }}>{slot.time}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalKcal > 0 && (
            <span style={{ fontSize: 14, fontWeight: 800, color: slot.color }}>
              {totalKcal} kcal
            </span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 16px 16px' }}>
              {/* Meals list */}
              {slot.meals.length > 0 && (
                <ul style={{ marginBottom: 12, listStyle: 'none', padding: 0 }}>
                  {slot.meals.map((m) => (
                    <motion.li
                      key={m.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #F3F6F0',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                          {m.kcal} kcal · {m.portion}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemove(slot.key, m.id)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(239,68,68,0.10)',
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginLeft: 8,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}

              {/* Macro summary */}
              {slot.meals.length > 0 && (
                <div style={{
                  display: 'flex', gap: 6, marginBottom: 12,
                  padding: '8px', borderRadius: 12, background: '#F8FAF7',
                }}>
                  {[
                    { l: 'C', v: totalC, c: '#8B5CF6' },
                    { l: 'P', v: totalP, c: '#0EA5E9' },
                    { l: 'F', v: totalF, c: '#F59E0B' },
                  ].map((m) => (
                    <div key={m.l} style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: m.c }}>{m.v}g</p>
                      <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>
                        {m.l === 'C' ? 'Carb' : m.l === 'P' ? 'Prot' : 'Gras'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add button */}
              <button
                onClick={() => onAdd(slot.key)}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 12,
                  border: `1.5px dashed ${slot.color}`,
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: slot.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>+</span>
                Aggiungi alimento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add meal modal ────────────────────────────────────────────────────────────

function AddMealModal({
  onSelect,
  onClose,
}: {
  onSelect: (meal: PlanMeal) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = SUGGESTIONS.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        style={{
          background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '20px 20px 32px', width: '100%',
          maxHeight: '75dvh', display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: '#E5EBE0', borderRadius: 99, margin: '0 auto 20px' }} />
        <p style={{ fontSize: 18, fontWeight: 800, color: '#1C1917', marginBottom: 14 }}>Cerca alimento</p>

        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="es. yogurt, pasta, pollo..."
          className="app-input"
          style={{ padding: '12px 16px', fontSize: 14, width: '100%', marginBottom: 12 }}
        />

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect({ ...s, id: s.id + Date.now() })}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '12px 4px',
                borderBottom: '1px solid #F3F6F0', background: 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{s.name}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  {s.kcal} kcal · {s.portion}
                </p>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#F97316', flexShrink: 0 }}>
                +
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlanClient({ goals }: { goals: { kcal: number; protein: number; carbs: number; fat: number } }) {
  const week = buildWeek();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [addingTo, setAddingTo]       = useState<string | null>(null);

  // Plan data keyed by date
  const [plan, setPlan] = useState<Record<string, MealSlot[]>>(() => {
    const dayPlan: MealSlot[] = INIT_SLOTS.map((s) => ({ ...s, meals: [] }));
    return { [todayStr]: dayPlan };
  });

  function getSlots(): MealSlot[] {
    if (!plan[selectedDay]) {
      const empty: MealSlot[] = INIT_SLOTS.map((s) => ({ ...s, meals: [] }));
      setPlan((p) => ({ ...p, [selectedDay]: empty }));
      return empty;
    }
    return plan[selectedDay];
  }

  function handleAdd(slotKey: string) {
    setAddingTo(slotKey);
  }

  function handleSelect(meal: PlanMeal) {
    if (!addingTo) return;
    setPlan((p) => {
      const slots = p[selectedDay] ?? INIT_SLOTS.map((s) => ({ ...s, meals: [] }));
      return {
        ...p,
        [selectedDay]: slots.map((s) =>
          s.key === addingTo ? { ...s, meals: [...s.meals, meal] } : s,
        ),
      };
    });
    setAddingTo(null);
  }

  function handleRemove(slotKey: string, mealId: string) {
    setPlan((p) => ({
      ...p,
      [selectedDay]: (p[selectedDay] ?? []).map((s) =>
        s.key === slotKey ? { ...s, meals: s.meals.filter((m) => m.id !== mealId) } : s,
      ),
    }));
  }

  const slots   = getSlots();
  const dayKcal = slots.reduce((s, sl) => s + sl.meals.reduce((a, m) => a + m.kcal, 0), 0);
  const dayP    = slots.reduce((s, sl) => s + sl.meals.reduce((a, m) => a + m.protein, 0), 0);
  const dayC    = slots.reduce((s, sl) => s + sl.meals.reduce((a, m) => a + m.carbs, 0), 0);
  const dayF    = slots.reduce((s, sl) => s + sl.meals.reduce((a, m) => a + m.fat, 0), 0);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}>

      {/* ── Header ── */}
      <header className="page-header">
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>Pianificazione</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', fontFamily: 'var(--font-display)' }}>
              Meal Plan
            </h1>
          </div>
          <div style={{
            background: 'rgba(249,115,22,0.10)', border: '1.5px solid rgba(249,115,22,0.25)',
            borderRadius: 12, padding: '8px 12px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#F97316', lineHeight: 1 }}>{dayKcal}</p>
            <p style={{ fontSize: 9, color: '#F97316', fontWeight: 700 }}>/ {goals.kcal} kcal</p>
          </div>
        </div>

        {/* Week strip */}
        <div style={{ display: 'flex', gap: 4, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {week.map((d) => {
            const isSelected = d.date === selectedDay;
            const hasData = plan[d.date]?.some((sl) => sl.meals.length > 0);
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDay(d.date)}
                style={{
                  flex: '0 0 auto', width: 44, padding: '7px 4px',
                  borderRadius: 14, border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  background: isSelected ? '#F97316' : 'transparent',
                  transition: 'all 0.18s',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  color: isSelected ? 'rgba(255,255,255,0.85)' : '#9CA3AF', letterSpacing: '0.05em' }}>
                  {d.day}
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: isSelected ? '#fff' : '#1C1917' }}>
                  {d.num}
                </span>
                {hasData && (
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isSelected ? 'rgba(255,255,255,0.70)' : '#F97316',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="page-content" style={{ padding: '16px 20px' }}>

        {/* Daily macro summary bar */}
        {dayKcal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fff', borderRadius: 18,
              padding: '14px 16px', marginBottom: 14,
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Carboidrati', value: dayC, goal: goals.carbs, color: '#8B5CF6' },
                { label: 'Proteine',    value: dayP, goal: goals.protein, color: '#0EA5E9' },
                { label: 'Grassi',      value: dayF, goal: goals.fat,  color: '#F59E0B' },
              ].map((m) => {
                const pct = Math.min(m.value / Math.max(m.goal, 1), 1);
                return (
                  <div key={m.label} style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{m.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: m.color }}>{m.value}g</span>
                    </div>
                    <div style={{ height: 5, background: '#F3F6F0', borderRadius: 99 }}>
                      <motion.div
                        style={{ height: '100%', background: m.color, borderRadius: 99 }}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Meal slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slots.map((slot, i) => (
            <motion.div
              key={slot.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <SlotCard slot={slot} onAdd={handleAdd} onRemove={handleRemove} />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Add meal modal */}
      <AnimatePresence>
        {addingTo && (
          <AddMealModal
            onSelect={handleSelect}
            onClose={() => setAddingTo(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
