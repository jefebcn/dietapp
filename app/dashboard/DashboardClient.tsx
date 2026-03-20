'use client';

/**
 * DashboardClient  –  Light Healthy Theme Dashboard
 *
 * Layout mirrors the reference design:
 *  • Header: avatar + user name + date + week calendar strip + notification
 *  • Calories Left card: orange arc ring + kcal number + 75% badge
 *  • Macro row: 3 colored cards (Carbs/Protein/Fat) with progress bars
 *  • Meal suggestions grid: 2-column image cards
 *  • Streak + AI tip
 */

import { useState, useTransition, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logWeightAction } from '@/lib/actions/mealActions';
import { WaterWidget } from '@/components/WaterWidget';
import { GuestBanner } from '@/components/GuestBanner';
import type { WaterResult } from '@/lib/actions/mealActions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Meal {
  id: string; name: string; kcal: number;
  protein: number; carbs: number; fat: number;
  qty: number; unit: string; addedAt: string;
  mealType?: string;
}
interface DailyStats {
  date: string; totalKcal: number; totalProtein: number;
  totalCarbs: number; totalFat: number; mealCount: number;
}
interface Goals { kcal: number; protein: number; carbs: number; fat: number; }
interface WeekDay { date: string; dayName: string; dayNum: number; isToday: boolean; }

interface Props {
  uid: string | null; today: string; stats: DailyStats; goals: Goals;
  todayMeals: Meal[]; weekStats: DailyStats[]; userName: string;
  streak?: number; tip?: string; initialWater?: WaterResult;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Week calendar helpers ─────────────────────────────────────────────────────

function buildWeek(todayStr: string): WeekDay[] {
  const today = new Date(todayStr + 'T12:00:00');
  const dayOfWeek = today.getDay(); // 0=Sun
  const days: WeekDay[] = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    days.push({
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('it-IT', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: offset === 0,
    });
  }
  return days;
}

// ── Weight Quick-Log Widget ───────────────────────────────────────────────────

function WeightQuickLog({ isGuest }: { isGuest: boolean }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isGuest) { window.location.href = '/login?next=/dashboard'; return; }
    const raw = parseFloat(value.replace(',', '.'));
    if (isNaN(raw) || raw < 20 || raw > 300) { setStatus('err'); return; }
    startTransition(async () => {
      const result = await logWeightAction({ rawValue: raw, rawUnit: 'kg' });
      if (result.success) {
        setStatus('ok');
        setValue('');
        setTimeout(() => setStatus('idle'), 2500);
      } else {
        setStatus('err');
        setTimeout(() => setStatus('idle'), 2000);
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '14px 16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        marginBottom: 14,
        border: '1.5px solid rgba(14,165,233,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: 'rgba(14,165,233,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
        }}>⚖️</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', lineHeight: 1 }}>Peso di oggi</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Registra il tuo peso giornaliero</p>
        </div>
        <Link href="/weight" style={{ fontSize: 11, fontWeight: 600, color: '#0EA5E9', textDecoration: 'none', flexShrink: 0 }}>
          Storico →
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.1"
            min="20"
            max="300"
            placeholder="0.0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            style={{
              width: '100%',
              padding: '10px 40px 10px 14px',
              borderRadius: 12,
              border: `1.5px solid ${status === 'err' ? '#EF4444' : '#E5EBE0'}`,
              fontSize: 16, fontWeight: 700, color: '#1C1917',
              background: '#F8FAF7',
              outline: 'none',
              appearance: 'textfield',
            }}
          />
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, fontWeight: 600, color: '#9CA3AF',
          }}>kg</span>
        </div>

        <motion.button
          type="submit"
          disabled={isPending || !value}
          whileTap={{ scale: 0.94 }}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: status === 'ok' ? '#22C55E' : status === 'err' ? '#EF4444' : '#0EA5E9',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: isPending || !value ? 0.6 : 1,
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          {isPending ? '…' : status === 'ok' ? '✓' : status === 'err' ? '!' : 'Salva'}
        </motion.button>
      </form>
    </motion.div>
  );
}

// ── Calorie Arc Ring (SVG) ────────────────────────────────────────────────────

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct   = Math.min(consumed / Math.max(goal, 1), 1);
  const left  = Math.max(goal - consumed, 0);
  const over  = consumed > goal;

  // SVG arc parameters
  const R = 70, cx = 90, cy = 95;
  const startAngle = 210; // degrees
  const sweep      = 300; // total arc degrees

  function polarToXY(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  }

  function arcPath(fromDeg: number, toDeg: number) {
    const s = polarToXY(fromDeg);
    const e = polarToXY(toDeg);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  const arcStart = startAngle;
  const arcEnd   = startAngle + sweep;
  const fillEnd  = startAngle + sweep * pct;
  const pctLabel = Math.round(pct * 100);

  // Badge position at 75% of arc
  const badgeAngle = startAngle + sweep * 0.75;
  const badgePos   = polarToXY(badgeAngle);

  return (
    <div style={{ position: 'relative', width: 180, height: 160, margin: '0 auto' }}>
      <svg viewBox="0 0 180 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Background arc */}
        <path
          d={arcPath(arcStart, arcEnd)}
          fill="none"
          stroke="#F3F6F0"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d={arcPath(arcStart, fillEnd)}
          fill="none"
          stroke={over ? '#EF4444' : '#F97316'}
          strokeWidth={14}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Percentage badge */}
        <g>
          <circle cx={badgePos.x} cy={badgePos.y} r="16"
            fill={over ? '#EF4444' : '#F97316'}
            filter="drop-shadow(0 2px 4px rgba(249,115,22,0.40))" />
          <text x={badgePos.x} y={badgePos.y + 1}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fontWeight="800" fill="white"
            fontFamily="Inter, system-ui, sans-serif">
            {pctLabel}%
          </text>
        </g>

        {/* Center: foreignObject avoids emoji/number overlap in SVG text */}
        <foreignObject x={cx - 52} y={cy - 46} width={104} height={92}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 0,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            <span style={{ fontSize: 22, lineHeight: '1', display: 'block' }}>
              {over ? '⚠️' : '🔥'}
            </span>
            <span style={{
              fontSize: 26, fontWeight: 900, color: over ? '#EF4444' : '#1C1917',
              lineHeight: '1.1', display: 'block', marginTop: 4,
            }}>
              {left.toLocaleString()}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#9CA3AF',
              lineHeight: '1', display: 'block', marginTop: 3,
            }}>
              {over ? 'kcal over' : 'Kcal'}
            </span>
          </div>
        </foreignObject>

        {/* Arc labels */}
        <text x={cx - R - 2} y={cy + 38} textAnchor="middle" fontSize="10" fill="#9CA3AF"
          fontFamily="Inter, system-ui, sans-serif">0</text>
        <text x={cx + R + 2} y={cy + 38} textAnchor="middle" fontSize="10" fill="#9CA3AF"
          fontFamily="Inter, system-ui, sans-serif">100</text>
      </svg>
    </div>
  );
}

// ── Macro Card ────────────────────────────────────────────────────────────────

function MacroCard({
  label, value, goal, color, icon,
}: {
  label: string; value: number; goal: number; color: string; icon: string;
}) {
  const pct = Math.min(value / Math.max(goal, 1), 1);
  return (
    <div style={{
      background: color,
      borderRadius: 20,
      padding: '14px 14px 12px',
      flex: 1,
      minWidth: 0,
    }}>
      <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginLeft: 1 }}>
          /{goal}
        </span>
      </p>
      {/* Progress bar */}
      <div style={{
        height: 4, background: 'rgba(255,255,255,0.25)',
        borderRadius: 99, margin: '8px 0 6px', overflow: 'hidden',
      }}>
        <motion.div
          style={{ height: '100%', background: 'rgba(255,255,255,0.85)', borderRadius: 99 }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.90)' }}>{label}</p>
    </div>
  );
}

// ── Daily Challenge card ───────────────────────────────────────────────────────

const CHALLENGES = [
  { icon: '💪', text: 'Raggiungi 150g di proteine oggi', metric: 'protein', target: 150, unit: 'g' },
  { icon: '🚰', text: 'Bevi 8 bicchieri d\'acqua (2 L)', metric: 'water', target: 8, unit: 'bicchieri' },
  { icon: '🥗', text: 'Registra tutti e 3 i pasti principali', metric: 'meals', target: 3, unit: 'pasti' },
  { icon: '🎯', text: 'Rimani entro il tuo obiettivo calorico', metric: 'kcal', target: 100, unit: '%' },
  { icon: '🌿', text: 'Tieni i grassi sotto il 30% delle calorie', metric: 'fat', target: 30, unit: '%' },
];

function DailyChallenge({ stats, goals, todayMeals }: {
  stats: { totalKcal: number; totalProtein: number; totalFat: number };
  goals: { kcal: number; protein: number };
  todayMeals: { mealType?: string }[];
}) {
  // Pick challenge based on day of week
  const dayIdx = new Date().getDay();
  const challenge = CHALLENGES[dayIdx % CHALLENGES.length];

  // Calculate progress
  let progress = 0;
  let current = 0;
  if (challenge.metric === 'protein') {
    current = Math.round(stats.totalProtein);
    progress = Math.min((current / challenge.target) * 100, 100);
  } else if (challenge.metric === 'meals') {
    const types = new Set(todayMeals.map(m => m.mealType));
    current = ['colazione','pranzo','cena'].filter(t => types.has(t)).length;
    progress = Math.min((current / challenge.target) * 100, 100);
  } else if (challenge.metric === 'kcal') {
    progress = goals.kcal > 0 && stats.totalKcal <= goals.kcal ? Math.min((stats.totalKcal / goals.kcal) * 100, 100) : stats.totalKcal > goals.kcal ? 0 : 0;
    current = stats.totalKcal;
  } else if (challenge.metric === 'fat') {
    const fatKcal = stats.totalFat * 9;
    const pct = stats.totalKcal > 0 ? (fatKcal / stats.totalKcal) * 100 : 0;
    progress = pct <= 30 && stats.totalKcal > 0 ? 100 : Math.max(0, 100 - (pct - 30) * 10);
    current = Math.round(pct);
  }
  const done = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      style={{
        background: done
          ? 'linear-gradient(135deg, #22C55E, #16A34A)'
          : 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        borderRadius: 20,
        padding: '14px 16px',
        marginBottom: 14,
        boxShadow: done
          ? '0 4px 16px rgba(34,197,94,0.30)'
          : '0 4px 16px rgba(139,92,246,0.30)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{done ? '✅' : challenge.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.70)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🎯 Sfida del giorno
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginTop: 2 }}>
            {done ? 'Sfida completata! 🎉' : challenge.text}
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 5, background: 'rgba(255,255,255,0.20)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: '#fff', borderRadius: 99 }}
        />
      </div>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 5, textAlign: 'right' }}>
        {Math.round(progress)}% completato
      </p>
    </motion.div>
  );
}

// ── Meal image card ───────────────────────────────────────────────────────────

const MEAL_IMAGES = [
  { label: 'Colazione', emoji: '🌅', accent: '#FB923C', img: '/food/meal-breakfast.jpg' },
  { label: 'Pranzo',    emoji: '☀️',  accent: '#22C55E', img: '/food/meal-lunch.jpg' },
  { label: 'Cena',      emoji: '🌙',  accent: '#3B82F6', img: '/food/meal-dinner.jpg' },
  { label: 'Spuntini',  emoji: '🍎',  accent: '#F43F5E', img: '/food/meal-snack.jpg' },
];

function MealImageCard({ item, meals }: { item: typeof MEAL_IMAGES[0]; meals: Meal[] }) {
  // mealType is stored in Italian in Firestore ('colazione','pranzo','cena','spuntino')
  const typeKey = item.label === 'Spuntini' ? 'spuntino' : item.label.toLowerCase();
  const count = meals.filter((m) => (m.mealType ?? '') === typeKey).length;

  return (
    <Link href="/diary" style={{ textDecoration: 'none', display: 'block' }}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        style={{
          background: '#fff',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}
      >
        {/* Food photo */}
        <div style={{ height: 100, overflow: 'hidden', position: 'relative' }}>
          <img
            src={item.img}
            alt={item.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
          {count > 0 && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: item.accent, color: '#fff',
              fontSize: 10, fontWeight: 800, borderRadius: 99,
              padding: '2px 7px',
            }}>
              {count}
            </div>
          )}
        </div>
        {/* Label */}
        <div style={{ padding: '8px 10px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1917' }}>
            {item.emoji} {item.label}
          </p>
          <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>
            {count === 0 ? 'Aggiungi pasto' : `${count} voce${count > 1 ? 'i' : ''}`}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardClient({
  uid, today, stats, goals, todayMeals, weekStats, userName, streak = 0, tip, initialWater,
}: Props) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(today);

  const { data: liveStats } = useSWR<DailyStats>(
    `/api/stats?date=${today}`,
    fetcher,
    { fallbackData: stats, refreshInterval: 30_000 },
  );

  const current = liveStats ?? stats;
  const weekDays = buildWeek(today);

  // Format display date
  const displayDate = new Date(today + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // First name
  const firstName = userName.split(' ')[0] || userName;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F97316, #FB923C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18, fontWeight: 800,
                boxShadow: '0 2px 10px rgba(249,115,22,0.30)',
              }}>
                {firstName.charAt(0).toUpperCase()}
              </div>
            </Link>
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#1C1917', lineHeight: 1.2 }}>
                {firstName}
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                {displayDate}
              </p>
            </div>
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {streak > 0 && (
              <div className="streak-badge">
                🔥 {streak}
              </div>
            )}
            <Link href="/diary" style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#fff', border: '1.5px solid #E5EBE0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Week calendar strip */}
        <div style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}>
          {weekDays.map((d) => {
            const isSelected = d.date === selectedDay;
            const isFuture = d.date > today;
            return (
              <button
                key={d.date}
                onClick={() => {
                  if (isFuture) return; // can't navigate to future days
                  setSelectedDay(d.date);
                  // Navigate to diary for any day, so user can view/edit
                  router.push(`/diary?date=${d.date}`);
                }}
                title={isFuture ? '' : d.isToday ? 'Oggi' : `Vai al ${d.date}`}
                style={{
                  flex: '0 0 auto',
                  width: 44,
                  padding: '8px 4px',
                  borderRadius: 14,
                  border: 'none',
                  cursor: isFuture ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: d.isToday
                    ? '#F97316'
                    : isSelected
                    ? 'rgba(249,115,22,0.12)'
                    : 'transparent',
                  opacity: isFuture ? 0.35 : 1,
                  transition: 'all 0.18s',
                  outline: isSelected && !d.isToday ? '2px solid rgba(249,115,22,0.40)' : 'none',
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: d.isToday ? 'rgba(255,255,255,0.85)' : '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {d.dayName.slice(0, 3)}
                </span>
                <span style={{
                  fontSize: 15, fontWeight: 800,
                  color: d.isToday ? '#fff' : '#1C1917',
                }}>
                  {d.dayNum}
                </span>
                {!d.isToday && !isFuture && weekStats.find((s) => s.date === d.date && s.mealCount > 0) && (
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#F97316', opacity: 0.7,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ padding: '16px 20px', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>

        {/* ── Guest banner ── */}
        {!uid && <GuestBanner />}

        {/* ── Calories Left card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '18px 20px 16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            marginBottom: 14,
          }}
        >
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917' }}>Calories Left</p>
            <Link href="/insights" style={{
              fontSize: 18, color: '#9CA3AF', textDecoration: 'none', lineHeight: 1,
            }}>···</Link>
          </div>

          {/* Ring */}
          <CalorieRing consumed={current.totalKcal} goal={goals.kcal} />

          {/* Macro cards row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <MacroCard label="Carbos"   value={current.totalCarbs}   goal={goals.carbs}   color="#8B5CF6" icon="🌾" />
            <MacroCard label="Protein"  value={current.totalProtein} goal={goals.protein} color="#0EA5E9" icon="💪" />
            <MacroCard label="Fat"      value={current.totalFat}     goal={goals.fat}     color="#F59E0B" icon="🥑" />
          </div>
        </motion.div>

        {/* ── Daily Challenge ── */}
        <DailyChallenge stats={current} goals={goals} todayMeals={todayMeals} />

        {/* ── AI Tip ── */}
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'rgba(249,115,22,0.07)',
              border: '1.5px solid rgba(249,115,22,0.18)',
              borderRadius: 16,
              padding: '12px 16px',
              marginBottom: 14,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, fontWeight: 500 }}>{tip}</p>
          </motion.div>
        )}

        {/* ── Meal suggestions ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1917' }}>I miei pasti</p>
            <Link href="/diary" style={{ fontSize: 13, fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>
              Vedi tutti →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {MEAL_IMAGES.map((item) => (
              <MealImageCard key={item.label} item={item} meals={todayMeals} />
            ))}
          </div>
        </div>

        {/* ── Weight quick-log ── */}
        <WeightQuickLog isGuest={!uid} />

        {/* ── Water tracking ── */}
        {uid && initialWater && <WaterWidget initial={initialWater} />}

        {/* ── Quick actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { href: '/insights', icon: '📈', label: 'Analisi',  sub: 'Progressi', bg: 'rgba(34,197,94,0.12)'  },
            { href: '/diary',    icon: '📔', label: 'Diario',   sub: 'Pasti',     bg: 'rgba(249,115,22,0.12)' },
            { href: '/scan',     icon: '📷', label: 'Scanner',  sub: 'Scansiona', bg: 'rgba(14,165,233,0.12)' },
          ].map(({ href, icon, label, sub, bg }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                style={{
                  background: '#fff', borderRadius: 16, padding: '12px 10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1917' }}>{label}</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF' }}>{sub}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

      </div>

      {/* Bottom tab bar is rendered by the page server component */}
    </div>
  );
}
