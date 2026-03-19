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

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
  uid: string; today: string; stats: DailyStats; goals: Goals;
  todayMeals: Meal[]; weekStats: DailyStats[]; userName: string;
  streak?: number; tip?: string;
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
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: offset === 0,
    });
  }
  return days;
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

        {/* Center: fire icon placeholder + kcal */}
        <text x={cx} y={cy - 18} textAnchor="middle" fontSize="22" dominantBaseline="middle">🔥</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="26" fontWeight="900" fill="#1C1917"
          fontFamily="Inter, system-ui, sans-serif">
          {left.toLocaleString()}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fill="#9CA3AF"
          fontFamily="Inter, system-ui, sans-serif" fontWeight="600">
          {over ? 'kcal over' : 'Kcal'}
        </text>

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

// ── Meal image card ───────────────────────────────────────────────────────────

const MEAL_IMAGES = [
  { label: 'Colazione', emoji: '🌅', bg: '#FFF7ED', accent: '#FB923C',
    img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=75' },
  { label: 'Pranzo', emoji: '☀️', bg: '#F0FDF4', accent: '#22C55E',
    img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=75' },
  { label: 'Cena', emoji: '🌙', bg: '#EFF6FF', accent: '#3B82F6',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75' },
  { label: 'Spuntini', emoji: '🍎', bg: '#FFF1F2', accent: '#F43F5E',
    img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=75' },
];

function MealImageCard({ item, meals }: { item: typeof MEAL_IMAGES[0]; meals: Meal[] }) {
  const type = item.label.toLowerCase().replace('à', 'a') === 'colazione' ? 'breakfast'
             : item.label.toLowerCase() === 'pranzo' ? 'lunch'
             : item.label.toLowerCase() === 'cena'   ? 'dinner'
             : 'snack';
  const count = meals.filter((m) => (m.mealType ?? '') === type).length;

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
        {/* Food image */}
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
  uid, today, stats, goals, todayMeals, weekStats, userName, streak = 0, tip,
}: Props) {
  const [selectedDay, setSelectedDay] = useState(today);

  const { data: liveStats } = useSWR<DailyStats>(
    `/api/stats?date=${today}`,
    fetcher,
    { fallbackData: stats, refreshInterval: 30_000 },
  );

  const current = liveStats ?? stats;
  const weekDays = buildWeek(today);

  // Format display date
  const displayDate = new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
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
          {weekDays.map((d) => (
            <button
              key={d.date}
              onClick={() => setSelectedDay(d.date)}
              style={{
                flex: '0 0 auto',
                width: 44,
                padding: '8px 4px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                background: d.isToday ? '#F97316' : 'transparent',
                transition: 'all 0.18s',
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
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ padding: '16px 20px', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>

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

        {/* ── Quick actions ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/insights" style={{ flex: 1, textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                background: '#fff', borderRadius: 16, padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex', gap: 10, alignItems: 'center',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'rgba(34,197,94,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                📈
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>Analisi</p>
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>Progressi</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/weight" style={{ flex: 1, textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                background: '#fff', borderRadius: 16, padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex', gap: 10, alignItems: 'center',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'rgba(14,165,233,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                ⚖️
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>Peso</p>
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>Traccia</p>
              </div>
            </motion.div>
          </Link>
        </div>

      </div>

      {/* Bottom tab bar is rendered by the page server component */}
    </div>
  );
}
