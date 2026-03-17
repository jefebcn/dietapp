/**
 * Meal Repository  –  SERVER-SIDE DATA LAYER
 *
 * Implements the Repository Pattern to fully decouple all Firestore
 * persistence logic from the UI and API route handlers.
 *
 * Firestore schema:
 *   users/{uid}/diary/{dateStr}/meals/{mealId}
 *   └── { id, name, kcal, protein, carbs, fat, qty, unit, source, addedAt }
 *
 *   users/{uid}/diary/{dateStr}
 *   └── { totalKcal, totalProtein, totalCarbs, totalFat, updatedAt }
 *
 * All methods accept a `uid` parameter so the repository remains stateless
 * and can be used from any server context (API routes, Server Actions, etc.)
 *
 * @module lib/repositories/mealRepository
 */

import { getAdminDb } from '@/lib/firebase-admin.config';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// ── Collection path helpers ────────────────────────────────────────────────

/** Root collection reference for a user's diary */
const diaryCol = (uid) => getAdminDb().collection(`users/${uid}/diary`);

/** Document reference for a specific day */
const dayDoc = (uid, dateStr) => diaryCol(uid).doc(dateStr);

/** Meals sub-collection for a specific day */
const mealsCol = (uid, dateStr) => dayDoc(uid, dateStr).collection('meals');

/** Single meal document reference */
const mealDoc = (uid, dateStr, mealId) => mealsCol(uid, dateStr).doc(mealId);

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Converts a Firestore document snapshot to a plain JS object.
 * Timestamps are converted to ISO strings for safe serialisation.
 */
function docToMeal(snap) {
  if (!snap.exists) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    addedAt:
      data.addedAt instanceof Timestamp
        ? data.addedAt.toDate().toISOString()
        : data.addedAt ?? null,
  };
}

/**
 * Recalculates and persists daily nutrition totals for a given date.
 * Called internally after every write operation.
 *
 * @param {string} uid
 * @param {string} dateStr  – YYYY-MM-DD
 * @returns {Promise<DailyStats>}
 */
async function recalculateDayTotals(uid, dateStr) {
  const snapshot = await mealsCol(uid, dateStr).get();

  const totals = snapshot.docs.reduce(
    (acc, doc) => {
      const m = doc.data();
      acc.totalKcal += m.kcal ?? 0;
      acc.totalProtein += m.protein ?? 0;
      acc.totalCarbs += m.carbs ?? 0;
      acc.totalFat += m.fat ?? 0;
      return acc;
    },
    { totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );

  const statsPayload = {
    ...totals,
    mealCount: snapshot.size,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await dayDoc(uid, dateStr).set(statsPayload, { merge: true });

  return { date: dateStr, ...totals, mealCount: snapshot.size };
}

// ── Read Operations ────────────────────────────────────────────────────────

/**
 * Fetches all meals logged for a specific date.
 *
 * @param {string} uid
 * @param {string} dateStr  – YYYY-MM-DD
 * @returns {Promise<Meal[]>}
 */
export async function getMealsByDate(uid, dateStr) {
  const snapshot = await mealsCol(uid, dateStr)
    .orderBy('addedAt', 'asc')
    .get();

  return snapshot.docs.map(docToMeal);
}

/**
 * Fetches the aggregated daily nutrition stats for a date range.
 * Useful for weekly/monthly summaries on the dashboard.
 *
 * @param {string} uid
 * @param {string} fromDate  – YYYY-MM-DD (inclusive)
 * @param {string} toDate    – YYYY-MM-DD (inclusive)
 * @returns {Promise<DailyStats[]>}
 */
export async function getDailyStatsRange(uid, fromDate, toDate) {
  const snapshot = await diaryCol(uid)
    .where(FieldValue.documentId(), '>=', fromDate)
    .where(FieldValue.documentId(), '<=', toDate)
    .orderBy(FieldValue.documentId(), 'asc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      date: doc.id,
      totalKcal: data.totalKcal ?? 0,
      totalProtein: data.totalProtein ?? 0,
      totalCarbs: data.totalCarbs ?? 0,
      totalFat: data.totalFat ?? 0,
      mealCount: data.mealCount ?? 0,
    };
  });
}

/**
 * Fetches a single meal by ID.
 *
 * @param {string} uid
 * @param {string} dateStr
 * @param {string} mealId
 * @returns {Promise<Meal|null>}
 */
export async function getMealById(uid, dateStr, mealId) {
  const snap = await mealDoc(uid, dateStr, mealId).get();
  return docToMeal(snap);
}

/**
 * Fetches the aggregated daily stats for a single date.
 *
 * @param {string} uid
 * @param {string} dateStr
 * @returns {Promise<DailyStats|null>}
 */
export async function getDailyStats(uid, dateStr) {
  const snap = await dayDoc(uid, dateStr).get();
  if (!snap.exists) return null;
  const data = snap.data();
  return {
    date: dateStr,
    totalKcal: data.totalKcal ?? 0,
    totalProtein: data.totalProtein ?? 0,
    totalCarbs: data.totalCarbs ?? 0,
    totalFat: data.totalFat ?? 0,
    mealCount: data.mealCount ?? 0,
  };
}

// ── Write Operations ───────────────────────────────────────────────────────

/**
 * Adds a new meal entry for the given user and date.
 * Automatically recalculates and persists daily totals.
 *
 * @param {string} uid
 * @param {string} dateStr
 * @param {MealInput} mealData
 * @returns {Promise<{ meal: Meal; dailyStats: DailyStats }>}
 */
export async function addMeal(uid, dateStr, mealData) {
  const payload = {
    name: mealData.name,
    kcal: Number(mealData.kcal) || 0,
    protein: Number(mealData.protein) || 0,
    carbs: Number(mealData.carbs) || 0,
    fat: Number(mealData.fat) || 0,
    qty: Number(mealData.qty) || 100,
    unit: mealData.unit ?? 'g',
    source: mealData.source ?? 'manual', // 'manual' | 'barcode' | 'api' | 'photo'
    imageUrl: mealData.imageUrl ?? null,
    addedAt: FieldValue.serverTimestamp(),
  };

  const ref = await mealsCol(uid, dateStr).add(payload);
  const snap = await ref.get();
  const meal = docToMeal(snap);
  const dailyStats = await recalculateDayTotals(uid, dateStr);

  return { meal, dailyStats };
}

/**
 * Updates an existing meal entry (partial update supported).
 * Recalculates daily totals after the update.
 *
 * @param {string} uid
 * @param {string} dateStr
 * @param {string} mealId
 * @param {Partial<MealInput>} updates
 * @returns {Promise<{ meal: Meal; dailyStats: DailyStats }>}
 */
export async function updateMeal(uid, dateStr, mealId, updates) {
  const numericFields = ['kcal', 'protein', 'carbs', 'fat', 'qty'];
  const sanitised = Object.fromEntries(
    Object.entries(updates).map(([k, v]) => [
      k,
      numericFields.includes(k) ? Number(v) || 0 : v,
    ])
  );

  await mealDoc(uid, dateStr, mealId).update({
    ...sanitised,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snap = await mealDoc(uid, dateStr, mealId).get();
  const meal = docToMeal(snap);
  const dailyStats = await recalculateDayTotals(uid, dateStr);

  return { meal, dailyStats };
}

/**
 * Deletes a meal entry and recalculates daily totals.
 *
 * @param {string} uid
 * @param {string} dateStr
 * @param {string} mealId
 * @returns {Promise<DailyStats>}
 */
export async function deleteMeal(uid, dateStr, mealId) {
  await mealDoc(uid, dateStr, mealId).delete();
  return recalculateDayTotals(uid, dateStr);
}

/**
 * Clears all meals for a given date (e.g. "reset day" feature).
 *
 * @param {string} uid
 * @param {string} dateStr
 * @returns {Promise<void>}
 */
export async function clearDayMeals(uid, dateStr) {
  const snapshot = await mealsCol(uid, dateStr).get();
  const batch = getAdminDb().batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  // Reset day totals
  batch.set(dayDoc(uid, dateStr), {
    totalKcal: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}

/**
 * Copies all meals from one date to another (convenient "repeat yesterday" feature).
 *
 * @param {string} uid
 * @param {string} sourceDateStr
 * @param {string} targetDateStr
 * @returns {Promise<DailyStats>}
 */
export async function copyDayMeals(uid, sourceDateStr, targetDateStr) {
  const sourceMeals = await getMealsByDate(uid, sourceDateStr);
  const batch = getAdminDb().batch();

  for (const meal of sourceMeals) {
    const { id, addedAt, ...mealData } = meal;
    const newRef = mealsCol(uid, targetDateStr).doc();
    batch.set(newRef, {
      ...mealData,
      addedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  return recalculateDayTotals(uid, targetDateStr);
}

// ── JSDoc type definitions ─────────────────────────────────────────────────

/**
 * @typedef {Object} Meal
 * @property {string}  id
 * @property {string}  name
 * @property {number}  kcal
 * @property {number}  protein
 * @property {number}  carbs
 * @property {number}  fat
 * @property {number}  qty
 * @property {string}  unit
 * @property {string}  source
 * @property {string|null} imageUrl
 * @property {string}  addedAt  – ISO date string
 */

/**
 * @typedef {Object} MealInput
 * @property {string}  name
 * @property {number}  kcal
 * @property {number}  protein
 * @property {number}  carbs
 * @property {number}  fat
 * @property {number}  [qty]
 * @property {string}  [unit]
 * @property {string}  [source]
 * @property {string}  [imageUrl]
 */

/**
 * @typedef {Object} DailyStats
 * @property {string}  date
 * @property {number}  totalKcal
 * @property {number}  totalProtein
 * @property {number}  totalCarbs
 * @property {number}  totalFat
 * @property {number}  mealCount
 */
