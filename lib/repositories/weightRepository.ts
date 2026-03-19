/**
 * weightRepository.ts  –  Medallion Architecture for Weight Monitoring
 *
 * Three-tier data model inspired by the Medallion / Lakehouse pattern:
 *
 *   🥉 Bronze  – Raw weight logs as entered by the user.
 *                Path: users/{uid}/weight_bronze/{logId}
 *
 *   🥈 Silver  – Normalised & cleansed records (kg, validated range 20–400 kg).
 *                Path: users/{uid}/weight_silver/{date}  (one doc per day)
 *
 *   🥇 Gold    – Aggregated weekly & monthly metrics (avg, min, max, trend).
 *                Path: users/{uid}/weight_gold/{period}  (week_YYYY-WW or month_YYYY-MM)
 *
 * Data flows Bronze → Silver → Gold via server actions / background writes.
 * Client components read Silver (daily granularity) or Gold (charts).
 */

import { getAdminDb } from '@/lib/firebase-admin.config';
import { FieldValue, FieldPath, Timestamp } from 'firebase-admin/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BronzeLog {
  id?: string;
  uid: string;
  rawValue: number;       // As entered by user
  rawUnit: 'kg' | 'lbs';
  notes?: string;
  source: 'manual' | 'scale' | 'import';
  createdAt: string;      // ISO 8601
  timezone: string;       // IANA timezone (e.g. 'Europe/Rome')
}

export interface SilverRecord {
  date: string;           // YYYY-MM-DD
  weightKg: number;       // Normalised to kg, rounded to 2dp
  bmi?: number;
  source: BronzeLog['source'];
  bronzeLogId: string;
  processedAt: string;
}

export interface GoldMetrics {
  period: string;         // 'week_YYYY-WW' or 'month_YYYY-MM'
  type: 'week' | 'month';
  avgKg: number;
  minKg: number;
  maxKg: number;
  /** Positive = gaining, negative = losing (kg/day slope) */
  trend: number;
  sampleCount: number;
  updatedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 400;
const LBS_TO_KG = 0.45359237;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toKg(value: number, unit: 'kg' | 'lbs'): number {
  const kg = unit === 'lbs' ? value * LBS_TO_KG : value;
  return Math.round(kg * 100) / 100;
}

function isoNow(): string {
  return new Date().toISOString();
}

function weekKey(date: Date): string {
  // ISO week: YYYY-WW
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
  );
  return `week_${d.getFullYear()}-${String(weekNum).padStart(2, '0')}`;
}

function monthKey(date: Date): string {
  return `month_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ── 🥉 Bronze Layer ───────────────────────────────────────────────────────────

/**
 * Append a raw weight log to the Bronze collection.
 * No validation here – Bronze stores exactly what the user entered.
 */
export async function addBronzeLog(
  uid: string,
  input: Omit<BronzeLog, 'uid' | 'createdAt'>,
): Promise<string> {
  const db = getAdminDb();
  const ref = db.collection(`users/${uid}/weight_bronze`).doc();
  // Firestore Admin SDK rejects documents that contain `undefined` values.
  // Build the log object explicitly so optional fields (e.g. notes) are
  // omitted entirely when not provided rather than set to undefined.
  const log: Record<string, unknown> = {
    uid,
    rawValue: input.rawValue,
    rawUnit: input.rawUnit,
    source: input.source,
    createdAt: isoNow(),
    timezone: input.timezone ?? 'UTC',
  };
  if (input.notes !== undefined) log.notes = input.notes;
  await ref.set(log);
  return ref.id;
}

/** Fetch the N most recent Bronze logs for a user. */
export async function getRecentBronzeLogs(uid: string, limit = 30): Promise<(BronzeLog & { id: string })[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(`users/${uid}/weight_bronze`)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as BronzeLog) }));
}

// ── 🥈 Silver Layer ───────────────────────────────────────────────────────────

/**
 * Promote a Bronze log to a Silver record:
 *   1. Convert to kg.
 *   2. Validate range.
 *   3. Upsert the Silver document for that date (latest log wins per day).
 */
export async function promoteBronzeToSilver(
  uid: string,
  bronzeLog: BronzeLog & { id: string },
  heightCm?: number,
): Promise<SilverRecord | null> {
  const weightKg = toKg(bronzeLog.rawValue, bronzeLog.rawUnit);
  if (weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
    console.warn(`[Silver] Weight ${weightKg} kg out of range for uid=${uid}`);
    return null;
  }

  const date = bronzeLog.createdAt.split('T')[0];
  let bmi: number | undefined;
  if (heightCm && heightCm > 0) {
    const heightM = heightCm / 100;
    bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }

  const silver: SilverRecord = {
    date,
    weightKg,
    ...(bmi !== undefined && { bmi }),
    source: bronzeLog.source,
    bronzeLogId: bronzeLog.id,
    processedAt: isoNow(),
  };

  const db = getAdminDb();
  await db.doc(`users/${uid}/weight_silver/${date}`).set(silver, { merge: true });
  return silver;
}

/** Fetch Silver records for a date range (inclusive). */
export async function getSilverRange(
  uid: string,
  fromDate: string,
  toDate: string,
): Promise<SilverRecord[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(`users/${uid}/weight_silver`)
    .where('date', '>=', fromDate)
    .where('date', '<=', toDate)
    .orderBy('date', 'asc')
    .get();
  return snap.docs.map((d) => d.data() as SilverRecord);
}

// ── 🥇 Gold Layer ─────────────────────────────────────────────────────────────

/**
 * Recompute Gold aggregates for the week and month containing `date`.
 * Reads from Silver. Should be called after each Silver upsert.
 */
export async function refreshGoldForDate(uid: string, date: string): Promise<void> {
  const d = new Date(date + 'T12:00:00Z');

  await Promise.all([
    _refreshGoldPeriod(uid, d, 'week'),
    _refreshGoldPeriod(uid, d, 'month'),
  ]);
}

async function _refreshGoldPeriod(
  uid: string,
  date: Date,
  type: 'week' | 'month',
): Promise<void> {
  const db = getAdminDb();

  let fromDate: string;
  let toDate: string;
  let period: string;

  if (type === 'week') {
    // Monday to Sunday of the ISO week
    const day = date.getDay() === 0 ? 7 : date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    fromDate = monday.toISOString().split('T')[0];
    toDate = sunday.toISOString().split('T')[0];
    period = weekKey(date);
  } else {
    const year = date.getFullYear();
    const month = date.getMonth();
    fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    toDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    period = monthKey(date);
  }

  const records = await getSilverRange(uid, fromDate, toDate);
  if (records.length === 0) return;

  const weights = records.map((r) => r.weightKg);
  const avgKg = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 100) / 100;
  const minKg = Math.min(...weights);
  const maxKg = Math.max(...weights);

  // Simple linear regression slope (kg/day)
  let trend = 0;
  if (records.length >= 2) {
    const n = records.length;
    const xVals = records.map((_, i) => i);
    const yVals = weights;
    const xMean = (n - 1) / 2;
    const yMean = avgKg;
    const num = xVals.reduce((s, x, i) => s + (x - xMean) * (yVals[i] - yMean), 0);
    const den = xVals.reduce((s, x) => s + (x - xMean) ** 2, 0);
    trend = den > 0 ? Math.round((num / den) * 1000) / 1000 : 0;
  }

  const gold: GoldMetrics = {
    period,
    type,
    avgKg,
    minKg,
    maxKg,
    trend,
    sampleCount: records.length,
    updatedAt: isoNow(),
  };

  await db.doc(`users/${uid}/weight_gold/${period}`).set(gold);
}

/** Fetch Gold metrics for the last N weeks. */
export async function getRecentGoldWeeks(uid: string, count = 8): Promise<GoldMetrics[]> {
  const db = getAdminDb();
  // Document IDs are 'week_YYYY-WW' — filter by prefix on the document ID
  // (same field for range + order → no composite index required)
  const snap = await db
    .collection(`users/${uid}/weight_gold`)
    .where(FieldPath.documentId(), '>=', 'week_')
    .where(FieldPath.documentId(), '<',  'week_z')
    .orderBy(FieldPath.documentId(), 'desc')
    .limit(count)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as GoldMetrics), period: d.id }));
}

/** Fetch Gold metrics for the last N months. */
export async function getRecentGoldMonths(uid: string, count = 6): Promise<GoldMetrics[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(`users/${uid}/weight_gold`)
    .where(FieldPath.documentId(), '>=', 'month_')
    .where(FieldPath.documentId(), '<',  'month_z')
    .orderBy(FieldPath.documentId(), 'desc')
    .limit(count)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as GoldMetrics), period: d.id }));
}
