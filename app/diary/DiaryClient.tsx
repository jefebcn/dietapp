'use client';

/**
 * DiaryClient.tsx  –  Interactive food diary with BottomSheet entry
 *
 * Shows today's meals and allows adding new entries via a sliding BottomSheet.
 * Each meal entry uses the log-entry-pop Squash-and-Stretch animation.
 */

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '@/components/BottomSheet';
import { addMealAction, deleteMealAction } from '@/lib/actions/mealActions';

interface Meal {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  qty: number;
  unit: string;
}

interface DiaryClientProps {
  uid: string;
  today: string;
  meals: Meal[];
  stats: {
    totalKcal: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  } | null;
}

export default function DiaryClient({ today, meals: initialMeals, stats }: DiaryClientProps) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add meal form state
  const [form, setForm] = useState({
    name: '', kcal: '', protein: '', carbs: '', fat: '', qty: '100', unit: 'g',
  });
  const [error, setError] = useState('');

  function openAddSheet() {
    setSelectedMeal(null);
    setForm({ name: '', kcal: '', protein: '', carbs: '', fat: '', qty: '100', unit: 'g' });
    setError('');
    setSheetOpen(true);
  }

  function openDetailSheet(meal: Meal) {
    setSelectedMeal(meal);
    setSheetOpen(true);
  }

  function handleDelete(mealId: string) {
    startTransition(async () => {
      const result = await deleteMealAction(today, mealId);
      if (result.success) {
        setMeals((prev) => prev.filter((m) => m.id !== mealId));
        setSheetOpen(false);
      }
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const kcal = parseInt(form.kcal, 10);
    if (!form.name.trim() || isNaN(kcal)) {
      setError('Inserisci nome e calorie.');
      return;
    }

    startTransition(async () => {
      const result = await addMealAction(today, {
        name: form.name.trim(),
        kcal,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        qty: parseFloat(form.qty) || 100,
        unit: form.unit,
        source: 'manual',
      });

      if (result.success) {
        const newMeal: Meal = {
          id: result.mealId,
          name: form.name.trim(),
          kcal,
          protein: parseFloat(form.protein) || 0,
          carbs: parseFloat(form.carbs) || 0,
          fat: parseFloat(form.fat) || 0,
          qty: parseFloat(form.qty) || 100,
          unit: form.unit,
        };
        setMeals((prev) => [...prev, newMeal]);
        setSheetOpen(false);
      } else {
        setError(result.error ?? 'Errore sconosciuto');
      }
    });
  }

  return (
    <>
      {/* Daily summary bar */}
      {stats && (
        <div
          className="flex justify-between p-3 rounded-2xl mb-4 glass-amber"
        >
          {[
            { label: 'Kcal', value: stats.totalKcal, color: '#F8FAFC' },
            { label: 'Prot', value: `${stats.totalProtein}g`, color: '#F8FAFC' },
            { label: 'Carb', value: `${stats.totalCarbs}g`, color: '#F8FAFC' },
            { label: 'Gras', value: `${stats.totalFat}g`, color: '#F8FAFC' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p
                className="text-lg font-bold leading-none"
                style={{ fontFamily: 'var(--font-ui)', color: item.color }}
              >
                {item.value}
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-ui)', color: 'rgba(248,250,252,0.65)' }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Meals list */}
      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {meals.map((meal) => (
            <motion.button
              key={meal.id}
              className="w-full text-left log-entry-pop"
              onClick={() => openDetailSheet(meal)}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, x: -40 }}
              layout
            >
              <div
                className="flex items-center justify-between px-4 py-3 rounded-2xl glass"
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ fontFamily: 'var(--font-ui)', color: '#F8FAFC' }}
                  >
                    {meal.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-ui)', color: 'rgba(248,250,252,0.65)' }}
                  >
                    {meal.qty} {meal.unit} · P {meal.protein}g · C {meal.carbs}g · G {meal.fat}g
                  </p>
                </div>
                <span
                  className="ml-3 flex-shrink-0 font-bold"
                  style={{ fontFamily: 'var(--font-ui)', color: '#F8FAFC', fontSize: 15 }}
                >
                  {meal.kcal} kcal
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {meals.length === 0 && (
          <div className="text-center py-8 opacity-60">
            <p className="text-4xl mb-2">🍽️</p>
            <p style={{ fontFamily: 'var(--font-ui)', color: 'rgba(248,250,252,0.65)' }}>
              Nessun pasto registrato oggi
            </p>
          </div>
        )}
      </div>

      {/* FAB Add button */}
      <button
        onClick={openAddSheet}
        className="btn btn-violet w-full"
        style={{ fontSize: 15 }}
      >
        + Aggiungi pasto
      </button>

      {/* Detail sheet */}
      <BottomSheet
        isOpen={sheetOpen && selectedMeal !== null}
        onClose={() => setSheetOpen(false)}
        title={selectedMeal?.name}
        size="auto"
      >
        {selectedMeal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calorie', value: `${selectedMeal.kcal} kcal` },
                { label: 'Porzione', value: `${selectedMeal.qty} ${selectedMeal.unit}` },
                { label: 'Proteine', value: `${selectedMeal.protein}g` },
                { label: 'Carboidrati', value: `${selectedMeal.carbs}g` },
                { label: 'Grassi', value: `${selectedMeal.fat}g` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-xl text-center glass"
                >
                  <p
                    className="text-lg font-bold"
                    style={{ fontFamily: 'var(--font-ui)', color: '#F8FAFC' }}
                  >
                    {item.value}
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-ui)', color: 'rgba(248,250,252,0.65)' }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleDelete(selectedMeal.id)}
              disabled={isPending}
              className="btn btn-rose w-full"
            >
              {isPending ? 'Eliminando...' : 'Elimina pasto'}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Add meal sheet */}
      <BottomSheet
        isOpen={sheetOpen && selectedMeal === null}
        onClose={() => setSheetOpen(false)}
        title="Aggiungi pasto"
        size="auto"
      >
        <form onSubmit={handleAdd} className="space-y-3">
          {error && (
            <p
              className="text-sm px-3 py-2 rounded-xl"
              style={{ fontFamily: 'var(--font-ui)', color: '#FDA4AF', background: 'rgba(244,63,94,0.15)', border: '1.5px solid rgba(244,63,94,0.3)' }}
            >
              {error}
            </p>
          )}
          {[
            { key: 'name', label: 'Nome alimento', type: 'text', required: true },
            { key: 'kcal', label: 'Calorie (kcal)', type: 'number', required: true },
            { key: 'protein', label: 'Proteine (g)', type: 'number', required: false },
            { key: 'carbs', label: 'Carboidrati (g)', type: 'number', required: false },
            { key: 'fat', label: 'Grassi (g)', type: 'number', required: false },
          ].map(({ key, label, type, required }) => (
            <div key={key}>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ fontFamily: 'var(--font-ui)', color: 'rgba(248,250,252,0.65)' }}
              >
                {label}
              </label>
              <input
                type={type}
                required={required}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="glass-input w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  fontFamily: 'var(--font-ui)',
                  color: '#F8FAFC',
                }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-violet w-full"
          >
            {isPending ? 'Salvando...' : 'Aggiungi'}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
