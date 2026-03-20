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

import { useState, useTransition, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '@/components/BottomSheet';
import { addMealAction, deleteMealAction, copyDayMealsAction, searchFoodAction } from '@/lib/actions/mealActions';
import type { FoodSearchResult } from '@/lib/actions/mealActions';

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
  isGuest?: boolean;
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

// ── Food quality indicator ─────────────────────────────────────────────────────
// Returns color + label based on macro composition

function foodQuality(meal: { kcal: number; protein: number; fat: number; carbs: number }): {
  color: string; dot: string; title: string;
} {
  if (meal.kcal < 20) return { color: '#9CA3AF', dot: '○', title: 'N/D' };
  const proteinRatio = (meal.protein * 4) / meal.kcal; // protein % of calories
  const fatRatio = (meal.fat * 9) / meal.kcal;
  if (proteinRatio >= 0.30) return { color: '#22C55E', dot: '●', title: 'Alto in proteine' };
  if (proteinRatio >= 0.20 && fatRatio <= 0.40) return { color: '#86EFAC', dot: '●', title: 'Bilanciato' };
  if (fatRatio >= 0.55) return { color: '#EF4444', dot: '●', title: 'Alto in grassi' };
  if (meal.kcal > 400) return { color: '#F59E0B', dot: '●', title: 'Calorico' };
  return { color: '#94A3B8', dot: '●', title: 'Neutro' };
}

// ── Category Section ───────────────────────────────────────────────────────────

function CategorySection({
  type, meals, onAdd, onDeleteRequest, onDeleteConfirm, confirmDeleteId,
}: {
  type: typeof MEAL_TYPES[number];
  meals: Meal[];
  onAdd: (typeKey: MealTypeKey) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  confirmDeleteId: string | null;
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
                  {meals.map((meal) => {
                    const quality = foodQuality(meal);
                    return (
                    <motion.li
                      key={meal.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: '#F8FAF7', border: `1px solid ${quality.color}30` }}
                    >
                      {/* Quality dot */}
                      <span title={quality.title} style={{ fontSize: 8, color: quality.color, flexShrink: 0, lineHeight: 1 }}>
                        {quality.dot}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#1C1917' }}>{meal.name}</p>
                        {confirmDeleteId === meal.id ? (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => onDeleteConfirm(meal.id)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
                            >
                              Elimina
                            </button>
                            <button
                              onClick={() => onDeleteRequest('')}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                              style={{ background: '#F3F6F0', color: '#6B7280', border: '1px solid #E5EBE0' }}
                            >
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2.5 mt-0.5">
                            <MacroPill value={meal.protein} label="P" color="#0EA5E9"/>
                            <MacroPill value={meal.carbs}   label="C" color="#8B5CF6"/>
                            <MacroPill value={meal.fat}     label="G" color="#F59E0B"/>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold flex-shrink-0"
                        style={{ color: '#F97316' }}>{Math.round(meal.kcal)}</span>
                      {confirmDeleteId !== meal.id && (
                        <motion.button
                          onClick={() => onDeleteRequest(meal.id)}
                          whileTap={{ scale: 0.80 }}
                          className="flex-shrink-0 p-1 rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </motion.button>
                      )}
                    </motion.li>
                  );
                  })}
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

export default function DiaryClient({ today, meals: initialMeals, stats, isGuest = false }: DiaryClientProps) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [activeMealType, setActiveMealType] = useState<MealTypeKey>('colazione');
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const [form, setForm] = useState({
    name: '', kcal: '', protein: '', carbs: '', fat: '', qty: '100', unit: 'g',
  });
  const [error, setError] = useState('');

  // Food search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openAddSheet(typeKey: MealTypeKey) {
    if (isGuest) { window.location.href = '/login?next=/diary'; return; }
    setSelectedMeal(null);
    setActiveMealType(typeKey);
    setForm({ name: '', kcal: '', protein: '', carbs: '', fat: '', qty: '100', unit: 'g' });
    setError('');
    setSearchQuery('');
    setSearchResults([]);
    setSheetOpen(true);
  }

  const handleSearchInput = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      const res = await searchFoodAction(q.trim());
      setSearchLoading(false);
      if (res.success) setSearchResults(res.results);
    }, 500);
  }, []);

  function applySearchResult(food: FoodSearchResult) {
    setForm({
      name: food.name,
      kcal: String(food.nutrients.kcal),
      protein: String(food.nutrients.protein),
      carbs: String(food.nutrients.carbs),
      fat: String(food.nutrients.fat),
      qty: '100',
      unit: 'g',
    });
    setSearchQuery('');
    setSearchResults([]);
  }

  function handleDeleteRequest(mealId: string) {
    setConfirmDeleteId(mealId || null);
  }

  function handleDeleteConfirm(mealId: string) {
    setConfirmDeleteId(null);
    startTransition(async () => {
      const result = await deleteMealAction(today, mealId);
      if (result.success) {
        setMeals((prev) => prev.filter((m) => m.id !== mealId));
      }
    });
  }

  function handleCopyFromYesterday() {
    if (copyStatus === 'loading') return;
    const yesterday = new Date(today + 'T12:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setCopyStatus('loading');
    startTransition(async () => {
      const result = await copyDayMealsAction(yesterdayStr, today);
      if (result.success) {
        setCopyStatus('done');
        // Reload page to show copied meals
        window.location.reload();
      } else {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 3000);
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
        mealType: activeMealType,
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
            onDeleteRequest={handleDeleteRequest}
            onDeleteConfirm={handleDeleteConfirm}
            confirmDeleteId={confirmDeleteId}
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
                    onClick={() => handleDeleteRequest(meal.id)}
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

      {/* ── Copy from yesterday ── */}
      {meals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-4 rounded-2xl flex items-center justify-between gap-3"
          style={{
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            boxShadow: '0 2px 8px rgba(34,197,94,0.06)',
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#15803D', fontFamily: 'var(--font-ui)' }}>
              📋 Copia i pasti di ieri
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: '#4ADE80' }}>
              Nessun pasto oggi – vuoi riutilizzare quelli di ieri?
            </p>
          </div>
          <button
            onClick={handleCopyFromYesterday}
            disabled={copyStatus === 'loading'}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
            style={{
              background: copyStatus === 'done' ? '#22C55E' : copyStatus === 'error' ? '#EF4444' : '#15803D',
              color: '#fff',
              fontFamily: 'var(--font-ui)',
              border: 'none',
              minWidth: 72,
            }}
          >
            {copyStatus === 'loading' ? '...' : copyStatus === 'done' ? '✓ Copiati' : copyStatus === 'error' ? '✗ Errore' : 'Copia'}
          </button>
        </motion.div>
      )}

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

          {/* ── Food Search ── */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
              🔍 Cerca alimento
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="es. pasta, pollo, yogurt..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="app-input w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ fontFamily: 'var(--font-ui)', color: '#1C1917', paddingRight: '2.5rem' }}
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 14, height: 14, border: '2px solid #F97316', borderTopColor: 'transparent', borderRadius: '50%' }}
                  />
                </div>
              )}
            </div>

            {/* Search results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1.5 rounded-xl overflow-hidden"
                  style={{ border: '1px solid #E5EBE0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                >
                  {searchResults.map((food, idx) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => applySearchResult(food)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                      style={{
                        background: '#FFFFFF',
                        borderBottom: idx < searchResults.length - 1 ? '1px solid #F3F6F0' : 'none',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
                          {food.name}
                        </p>
                        {food.brand && (
                          <p className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>{food.brand}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-xs font-bold" style={{ color: '#F97316' }}>{food.nutrients.kcal} kcal</span>
                        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>per 100g</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C9D5C4" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#E5EBE0' }} />
            <span className="text-[10px] font-bold" style={{ color: '#9CA3AF', fontFamily: 'var(--font-ui)' }}>oppure inserisci manualmente</span>
            <div className="flex-1 h-px" style={{ background: '#E5EBE0' }} />
          </div>

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
