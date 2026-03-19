'use client';

/**
 * DiaryClient.tsx  –  Food Diary with Meal Categories
 *
 * Inspired by top competitors (MyFitnessPal, Yazio, Lose It!):
 *  • Meal categories: Colazione, Pranzo, Cena, Spuntini
 *  • Each category shows its meals + macros
 *  • Quick-add bottom sheet per category
 *  • Daily summary bar with progress rings
 *  • Sticky header with quick stats
 */

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '@/components/BottomSheet';
import { addMealAction, deleteMealAction } from '@/lib/actions/mealActions';

interface Meal {
  id: string; name: string; kcal: number;
  protein: number; carbs: number; fat: number;
  qty: number; unit: string;
  mealType?: string;
}

interface DiaryClientProps {
  uid: string; today: string;
  meals: Meal[];
  stats: { totalKcal: number; totalProtein: number; totalCarbs: number; totalFat: number } | null;
}

// ── Meal categories ────────────────────────────────────────────────────────────

const MEAL_TYPES = [
  { key: 'colazione', label: 'Colazione', icon: '🌅', color: '245,158,11',   time: '07:00–10:00' },
  { key: 'pranzo',    label: 'Pranzo',    icon: '☀️',  color: '14,165,233',  time: '12:00–14:00' },
  { key: 'cena',      label: 'Cena',      icon: '🌙',  color: '139,92,246',  time: '19:00–21:00' },
  { key: 'spuntino',  label: 'Spuntini',  icon: '🍎',  color: '34,197,94',   time: 'Qualsiasi ora' },
] as const;

type MealTypeKey = typeof MEAL_TYPES[number]['key'];

// ── Macro Pill ─────────────────────────────────────────────────────────────────

function MacroPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
      <span className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>{Math.round(value)}g</span>
    </div>
  );
}

// ── Category Section ───────────────────────────────────────────────────────────

function CategorySection({
  type, meals, onAdd, onDelete,
}: {
  type: typeof MEAL_TYPES[number];
  meals: Meal[];
  onAdd: (typeKey: MealTypeKey) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const catKcal = meals.reduce((s, m) => s + m.kcal, 0);
  const catProtein = meals.reduce((s, m) => s + m.protein, 0);
  const catCarbs   = meals.reduce((s, m) => s + m.carbs, 0);
  const catFat     = meals.reduce((s, m) => s + m.fat, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: `1px solid rgba(${type.color},0.20)`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-xl">{type.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
            {type.label}
          </p>
          <p className="text-[10px]" style={{ color: `rgba(${type.color},0.80)` }}>{type.time}</p>
        </div>
        <div className="flex items-center gap-2">
          {catKcal > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `rgba(${type.color},0.12)`,
                color: `rgb(${type.color})`,
                border: `1px solid rgba(${type.color},0.25)`,
              }}>
              {Math.round(catKcal)} kcal
            </span>
          )}
          <motion.svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={`rgba(${type.color},0.70)`} strokeWidth="2.5"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M6 9l6 6 6-6"/>
          </motion.svg>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: `1px solid rgba(${type.color},0.12)` }}
          >
            {/* Meals list */}
            {meals.length > 0 && (
              <ul className="px-3 py-2 space-y-1.5">
                <AnimatePresence>
                  {meals.map((meal) => (
                    <motion.li
                      key={meal.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: '#F8FAF7', border: '1px solid #E5EBE0' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#1C1917' }}>{meal.name}</p>
                        <div className="flex gap-2.5 mt-0.5">
                          <MacroPill value={meal.protein} label="P" color="#0EA5E9"/>
                          <MacroPill value={meal.carbs}   label="C" color="#8B5CF6"/>
                          <MacroPill value={meal.fat}     label="G" color="#F59E0B"/>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold flex-shrink-0"
                        style={{ color: '#F97316' }}>{Math.round(meal.kcal)}</span>
                      <motion.button
                        onClick={() => onDelete(meal.id)}
                        whileTap={{ scale: 0.80 }}
                        className="flex-shrink-0 p-1 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </motion.button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {/* Macro summary for this category */}
            {meals.length > 0 && (
              <div className="px-4 py-2 flex gap-4"
                style={{ borderTop: `1px solid rgba(${type.color},0.10)` }}>
                <MacroPill value={catProtein} label="Prot" color="#0EA5E9"/>
                <MacroPill value={catCarbs}   label="Carb" color="#8B5CF6"/>
                <MacroPill value={catFat}     label="Gras" color="#F59E0B"/>
              </div>
            )}

            {/* Add button */}
            <div className="px-3 py-2.5">
              <button
                onClick={() => onAdd(type.key)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: `rgba(${type.color},0.08)`,
                  border: `1px solid rgba(${type.color},0.22)`,
                  color: `rgb(${type.color})`,
                }}
              >
                <span>+</span>
                <span>Aggiungi a {type.label}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DiaryClient({ today, meals: initialMeals, stats }: DiaryClientProps) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [activeMealType, setActiveMealType] = useState<MealTypeKey>('colazione');
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: '', kcal: '', protein: '', carbs: '', fat: '', qty: '100', unit: 'g',
  });
  const [error, setError] = useState('');

  function openAddSheet(typeKey: MealTypeKey) {
    setSelectedMeal(null);
    setActiveMealType(typeKey);
    setForm({ name: '', kcal: '', protein: '', carbs: '', fat: '', qty: '100', unit: 'g' });
    setError('');
    setSheetOpen(true);
  }

  function handleDelete(mealId: string) {
    startTransition(async () => {
      const result = await deleteMealAction(today, mealId);
      if (result.success) {
        setMeals((prev) => prev.filter((m) => m.id !== mealId));
      }
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const kcal = parseInt(form.kcal, 10);
    if (!form.name.trim() || isNaN(kcal)) { setError('Inserisci nome e calorie.'); return; }

    startTransition(async () => {
      const result = await addMealAction(today, {
        name: form.name.trim(), kcal,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        qty: parseFloat(form.qty) || 100,
        unit: form.unit, source: 'manual',
      });
      if (result.success) {
        const newMeal: Meal = {
          id: result.mealId, name: form.name.trim(), kcal,
          protein: parseFloat(form.protein) || 0,
          carbs: parseFloat(form.carbs) || 0,
          fat: parseFloat(form.fat) || 0,
          qty: parseFloat(form.qty) || 100, unit: form.unit,
          mealType: activeMealType,
        };
        setMeals((prev) => [...prev, newMeal]);
        setSheetOpen(false);
      } else {
        setError(result.error ?? 'Errore sconosciuto');
      }
    });
  }

  // Known meal type keys
  const knownTypes = MEAL_TYPES.map((t) => t.key) as string[];

  // Group meals by type — meals without mealType are put in their own bucket
  const getMealsForType = (typeKey: string) =>
    meals.filter((m) => {
      if (!m.mealType) return false; // handled separately as legacy
      return m.mealType === typeKey;
    });

  // Legacy meals: from the old app, no mealType field
  const legacyMeals = meals.filter((m) => !m.mealType);

  const activeType = MEAL_TYPES.find((t) => t.key === activeMealType)!;

  return (
    <>
      {/* ── Daily Summary ── */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5EBE0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex justify-between items-center">
            {[
              { label: 'Calorie', value: `${Math.round(stats.totalKcal)}`, color: '#F97316' },
              { label: 'Proteine', value: `${Math.round(stats.totalProtein)}g`, color: '#0EA5E9' },
              { label: 'Carboidrati', value: `${Math.round(stats.totalCarbs)}g`, color: '#8B5CF6' },
              { label: 'Grassi', value: `${Math.round(stats.totalFat)}g`, color: '#F59E0B' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-lg font-black leading-none" style={{ color: item.color, fontFamily: 'var(--font-ui)' }}>
                  {item.value}
                </p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#9CA3AF' }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Meal Categories ── */}
      <div className="space-y-3 mb-4">
        {MEAL_TYPES.map((type) => (
          <CategorySection
            key={type.key}
            type={type}
            meals={getMealsForType(type.key)}
            onAdd={openAddSheet}
            onDelete={handleDelete}
          />
        ))}

        {/* Legacy meals from old app (no mealType field) */}
        {legacyMeals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E5EBE0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">📦</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#1C1917' }}>Pasti importati</p>
                <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Dalla versione precedente dell&apos;app</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#F3F6F0', color: '#6B7280', border: '1px solid #E5EBE0' }}>
                {Math.round(legacyMeals.reduce((s, m) => s + m.kcal, 0))} kcal
              </span>
            </div>
            <ul className="px-3 pb-3 space-y-1.5" style={{ borderTop: '1px solid #F3F6F0' }}>
              {legacyMeals.map((meal) => (
                <motion.li
                  key={meal.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl mt-1.5"
                  style={{ background: '#F8FAF7', border: '1px solid #E5EBE0' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1C1917' }}>{meal.name}</p>
                    <div className="flex gap-2.5 mt-0.5">
                      <MacroPill value={meal.protein} label="P" color="#0EA5E9"/>
                      <MacroPill value={meal.carbs}   label="C" color="#8B5CF6"/>
                      <MacroPill value={meal.fat}     label="G" color="#F59E0B"/>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold flex-shrink-0" style={{ color: '#F97316' }}>
                    {Math.round(meal.kcal)}
                  </span>
                  <motion.button
                    onClick={() => handleDelete(meal.id)}
                    whileTap={{ scale: 0.80 }}
                    className="flex-shrink-0 p-1 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* ── Global Add FAB ── */}
      <motion.button
        onClick={() => openAddSheet('spuntino')}
        className="w-full py-3.5 rounded-2xl text-sm font-bold"
        style={{
          background: 'linear-gradient(145deg, #F97316, #EA6C0A)',
          color: '#fff',
          fontFamily: 'var(--font-ui)',
          border: '1px solid rgba(249,115,22,0.30)',
          boxShadow: '0 4px 0 rgba(234,108,10,0.30), 0 8px 24px rgba(249,115,22,0.18)',
        }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98, y: 3 }}
      >
        + Aggiungi pasto
      </motion.button>

      {/* ── Add Meal Sheet ── */}
      <BottomSheet
        isOpen={sheetOpen && selectedMeal === null}
        onClose={() => setSheetOpen(false)}
        title={`Aggiungi a ${activeType.label} ${activeType.icon}`}
        size="auto"
      >
        <form onSubmit={handleAdd} className="space-y-3">
          {error && (
            <p className="text-sm px-3 py-2 rounded-xl"
              style={{ color: '#DC2626', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.20)', fontFamily: 'var(--font-ui)' }}>
              {error}
            </p>
          )}
          {/* Meal type selector */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
              Tipo di pasto
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {MEAL_TYPES.map((t) => (
                <button
                  key={t.key} type="button"
                  onClick={() => setActiveMealType(t.key)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all"
                  style={{
                    background: activeMealType === t.key ? `rgba(${t.color},0.12)` : '#F8FAF7',
                    border: activeMealType === t.key ? `1px solid rgba(${t.color},0.35)` : '1px solid #E5EBE0',
                    color: activeMealType === t.key ? `rgb(${t.color})` : '#9CA3AF',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  <span className="text-base">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: 'name', label: 'Nome alimento', type: 'text', required: true, placeholder: 'es. Pasta al pomodoro' },
            { key: 'kcal', label: 'Calorie (kcal)', type: 'number', required: true, placeholder: '350' },
            { key: 'protein', label: 'Proteine (g)', type: 'number', required: false, placeholder: '15' },
            { key: 'carbs', label: 'Carboidrati (g)', type: 'number', required: false, placeholder: '45' },
            { key: 'fat', label: 'Grassi (g)', type: 'number', required: false, placeholder: '8' },
          ].map(({ key, label, type, required, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold mb-1.5"
                style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
                {label}
              </label>
              <input
                type={type} required={required} placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="app-input w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ fontFamily: 'var(--font-ui)', color: '#1C1917' }}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5"
                style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
                Quantità
              </label>
              <input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                className="app-input w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ fontFamily: 'var(--font-ui)', color: '#1C1917' }}/>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5"
                style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
                Unità
              </label>
              <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="app-input w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ fontFamily: 'var(--font-ui)', color: '#1C1917', background: '#F8FAF7' }}>
                <option value="g">grammi (g)</option>
                <option value="ml">millilitri (ml)</option>
                <option value="porz">porzione</option>
                <option value="pz">pezzo</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isPending}
            className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-55"
            style={{
              background: `linear-gradient(145deg, rgb(${activeType.color}), rgba(${activeType.color},0.85))`,
              color: '#fff', fontFamily: 'var(--font-ui)',
              boxShadow: `0 4px 0 rgba(${activeType.color},0.25)`,
            }}>
            {isPending ? 'Salvataggio...' : `${activeType.icon} Aggiungi a ${activeType.label}`}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
