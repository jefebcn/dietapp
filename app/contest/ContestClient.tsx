'use client';

/**
 * ContestClient.tsx  –  Challenge & Contest Arena
 *
 * Tabs:
 *   1. Esplora   – browse available challenges, join/leave
 *   2. I Miei    – enrolled challenges with live progress
 *   3. Classifica – leaderboard for the current week's top challenge
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

type Difficulty = 'Facile' | 'Medio' | 'Difficile';
type ContestType = 'calorie' | 'protein' | 'streak' | 'weight' | 'detox' | 'macro';
type Tab = 'esplora' | 'i-miei' | 'classifica';

interface Contest {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  type: ContestType;
  duration: number;       // days
  target: string;
  difficulty: Difficulty;
  xp: number;
  participants: number;
  color: string;
  badgeColor: string;
}

interface UserProgress {
  enrolledAt: string;     // ISO
  progressPct: number;    // 0–100 computed from user stats
  daysLeft: number;
  rank: number;
}

// ── Static contest catalogue ──────────────────────────────────────────────────

const CONTESTS: Contest[] = [
  {
    id: 'calorie-week',
    emoji: '🎯',
    title: 'Sfida Calorie 7 Giorni',
    subtitle: 'Rispetta l\'obiettivo calorico ogni giorno per una settimana',
    type: 'calorie',
    duration: 7,
    target: 'Entro l\'obiettivo calorico ogni giorno',
    difficulty: 'Facile',
    xp: 500,
    participants: 1247,
    color: '#F97316',
    badgeColor: 'rgba(249,115,22,0.12)',
  },
  {
    id: 'protein-champ',
    emoji: '💪',
    title: 'Protein Champion',
    subtitle: 'Raggiungi l\'obiettivo proteico per 14 giorni di fila',
    type: 'protein',
    duration: 14,
    target: '≥ obiettivo proteico ogni giorno',
    difficulty: 'Medio',
    xp: 1000,
    participants: 834,
    color: '#0EA5E9',
    badgeColor: 'rgba(14,165,233,0.12)',
  },
  {
    id: 'streak-30',
    emoji: '🔥',
    title: 'Streak Master',
    subtitle: 'Registra i pasti per 30 giorni consecutivi',
    type: 'streak',
    duration: 30,
    target: '30 giorni di tracciamento ininterrotto',
    difficulty: 'Difficile',
    xp: 3000,
    participants: 456,
    color: '#8B5CF6',
    badgeColor: 'rgba(139,92,246,0.12)',
  },
  {
    id: 'weight-month',
    emoji: '⚖️',
    title: 'Perdita Peso Mensile',
    subtitle: 'Registra il peso ogni settimana e mostra miglioramento',
    type: 'weight',
    duration: 30,
    target: 'Peso inferiore rispetto all\'inizio del mese',
    difficulty: 'Medio',
    xp: 2000,
    participants: 623,
    color: '#22C55E',
    badgeColor: 'rgba(34,197,94,0.12)',
  },
  {
    id: 'detox-5',
    emoji: '🥗',
    title: 'Sfida Detox',
    subtitle: 'Rimani sotto 1500 kcal giornaliere per 5 giorni',
    type: 'detox',
    duration: 5,
    target: '< 1500 kcal al giorno',
    difficulty: 'Difficile',
    xp: 800,
    participants: 392,
    color: '#06B6D4',
    badgeColor: 'rgba(6,182,212,0.12)',
  },
  {
    id: 'macro-balance',
    emoji: '⚡',
    title: 'Macro Balance',
    subtitle: 'Raggiungi tutti e tre i macro obiettivi ogni giorno per 7 giorni',
    type: 'macro',
    duration: 7,
    target: 'Proteine + Carboidrati + Grassi in target',
    difficulty: 'Difficile',
    xp: 1200,
    participants: 287,
    color: '#F59E0B',
    badgeColor: 'rgba(245,158,11,0.12)',
  },
];

// ── Mock leaderboard ──────────────────────────────────────────────────────────

const LEADERBOARD_MOCK = [
  { rank: 1, name: 'Marco R.',    xp: 4850, streak: 28, avatar: '🥇' },
  { rank: 2, name: 'Sofia B.',    xp: 4210, streak: 21, avatar: '🥈' },
  { rank: 3, name: 'Luca M.',     xp: 3990, streak: 19, avatar: '🥉' },
  { rank: 4, name: 'Chiara P.',   xp: 3540, streak: 14, avatar: '👤' },
  { rank: 5, name: 'Andrea V.',   xp: 3120, streak: 12, avatar: '👤' },
  { rank: 6, name: 'Giulia F.',   xp: 2880, streak: 11, avatar: '👤' },
  { rank: 7, name: 'Matteo C.',   xp: 2650, streak: 9,  avatar: '👤' },
  { rank: 8, name: 'Elena T.',    xp: 2400, streak: 8,  avatar: '👤' },
  { rank: 9, name: 'Davide S.',   xp: 2100, streak: 7,  avatar: '👤' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const ENROLLED_KEY = 'nt_enrolled_contests';

function loadEnrolled(): Record<string, UserProgress> {
  try {
    return JSON.parse(localStorage.getItem(ENROLLED_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveEnrolled(data: Record<string, UserProgress>) {
  localStorage.setItem(ENROLLED_KEY, JSON.stringify(data));
}

function difficultyColor(d: Difficulty): string {
  return d === 'Facile' ? '#22C55E' : d === 'Medio' ? '#F59E0B' : '#EF4444';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function XpBadge({ xp, color }: { xp: number; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      +{xp.toLocaleString()} XP
    </span>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: '#F3F6F0', overflow: 'hidden' }}>
      <motion.div
        style={{ height: '100%', borderRadius: 99, background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

// Contest card shown in "Esplora" tab
function ContestCard({
  contest, enrolled, onJoin, onLeave,
}: {
  contest: Contest;
  enrolled: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${contest.color}28`,
        borderRadius: '1.5rem',
        padding: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: contest.badgeColor,
          border: `1px solid ${contest.color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {contest.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1C1917', marginBottom: 2 }}>
            {contest.title}
          </p>
          <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{contest.subtitle}</p>
        </div>
      </div>

      {/* Details chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
          background: '#F3F6F0', color: '#6B7280', border: '1px solid #E5EBE0',
        }}>
          ⏱ {contest.duration} giorni
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
          background: `${difficultyColor(contest.difficulty)}14`,
          color: difficultyColor(contest.difficulty),
          border: `1px solid ${difficultyColor(contest.difficulty)}28`,
        }}>
          {contest.difficulty}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
          background: '#F3F6F0', color: '#9CA3AF', border: '1px solid #E5EBE0',
        }}>
          👥 {contest.participants.toLocaleString()}
        </span>
        <XpBadge xp={contest.xp} color={contest.color} />
      </div>

      {/* Target */}
      <p style={{
        fontSize: 11, color: '#6B7280', background: '#F8FAF7',
        border: '1px solid #E5EBE0', borderRadius: 10,
        padding: '7px 10px', marginBottom: 12, lineHeight: 1.4,
      }}>
        🎯 {contest.target}
      </p>

      {/* Action button */}
      <motion.button
        onClick={() => enrolled ? onLeave(contest.id) : onJoin(contest.id)}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97, y: 1 }}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 14,
          border: enrolled ? `1.5px solid ${contest.color}40` : 'none',
          background: enrolled ? contest.badgeColor : `linear-gradient(145deg, ${contest.color}EE, ${contest.color})`,
          color: enrolled ? contest.color : '#fff',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: enrolled ? 'none' : `0 4px 14px ${contest.color}40`,
        }}
      >
        {enrolled ? '✓ Iscritto — Abbandona' : '🚀 Partecipa'}
      </motion.button>
    </motion.div>
  );
}

// My-contest card shown in "I Miei" tab
function MyContestCard({ contest, progress }: { contest: Contest; progress: UserProgress }) {
  const enrolledDate = new Date(progress.enrolledAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${contest.color}28`,
        borderRadius: '1.5rem',
        padding: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: contest.badgeColor, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {contest.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1C1917' }}>{contest.title}</p>
          <p style={{ fontSize: 10, color: '#9CA3AF' }}>Iniziato il {enrolledDate} · {progress.daysLeft} giorni rimasti</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: contest.color, lineHeight: 1 }}>
            #{progress.rank}
          </p>
          <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>Ranking</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF' }}>Progresso</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: contest.color }}>
            {Math.round(progress.progressPct)}%
          </span>
        </div>
        <ProgressBar pct={progress.progressPct} color={contest.color} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <XpBadge xp={Math.round(contest.xp * (progress.progressPct / 100))} color={contest.color} />
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#9CA3AF',
          background: '#F3F6F0', border: '1px solid #E5EBE0',
          padding: '3px 8px', borderRadius: 99,
        }}>
          obiettivo: {contest.target.split(' ').slice(0, 4).join(' ')}…
        </span>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  streak: number;
  userName: string;
}

export default function ContestClient({ streak, userName }: Props) {
  const [tab, setTab] = useState<Tab>('esplora');
  const [enrolled, setEnrolled] = useState<Record<string, UserProgress>>({});
  const firstName = userName.split(' ')[0] || 'Tu';

  // Load persisted enrolments from localStorage on mount
  useEffect(() => {
    setEnrolled(loadEnrolled());
  }, []);

  function joinContest(id: string) {
    const contest = CONTESTS.find((c) => c.id === id)!;
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + contest.duration);

    const progress: UserProgress = {
      enrolledAt: now.toISOString(),
      // Seed a plausible progress based on the user's streak
      progressPct: Math.min(Math.round((streak / contest.duration) * 100), 35),
      daysLeft: contest.duration,
      rank: Math.floor(Math.random() * 80) + 20, // 20–99
    };

    const updated = { ...enrolled, [id]: progress };
    setEnrolled(updated);
    saveEnrolled(updated);
    setTab('i-miei');
  }

  function leaveContest(id: string) {
    const updated = { ...enrolled };
    delete updated[id];
    setEnrolled(updated);
    saveEnrolled(updated);
  }

  const myContests = useMemo(
    () => CONTESTS.filter((c) => enrolled[c.id]),
    [enrolled],
  );

  // My user position in leaderboard (dynamic based on XP from enrolled contests)
  const myXp = useMemo(
    () => Object.entries(enrolled).reduce((sum, [id, p]) => {
      const c = CONTESTS.find((x) => x.id === id);
      return sum + Math.round((c?.xp ?? 0) * (p.progressPct / 100));
    }, 0),
    [enrolled],
  );

  const myRank = myXp > 0
    ? LEADERBOARD_MOCK.filter((u) => u.xp > myXp).length + 1
    : null;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-4">

      {/* ── Banner: total XP ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
          borderRadius: '1.5rem',
          padding: '16px 18px',
          boxShadow: '0 4px 18px rgba(249,115,22,0.30)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              La tua arena, {firstName}
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 2 }}>
              🏆 {myXp.toLocaleString()} XP
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.80)', marginTop: 2 }}>
              {myContests.length} sfide attive · {streak} giorni streak
            </p>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.20)',
            border: '2px solid rgba(255,255,255,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            {myRank && myRank <= 3 ? ['🥇','🥈','🥉'][myRank - 1] : '🎖️'}
          </div>
        </div>
        {myRank && (
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 10, padding: '6px 12px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
              #{myRank} in classifica globale
            </span>
          </div>
        )}
      </motion.div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 6, padding: 4, borderRadius: '1.2rem',
        background: '#FFFFFF', border: '1px solid #E5EBE0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {([
          { key: 'esplora',    label: '🔍 Esplora' },
          { key: 'i-miei',    label: `⭐ I Miei${myContests.length > 0 ? ` (${myContests.length})` : ''}` },
          { key: 'classifica', label: '🏆 Classifica' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '0.9rem',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: tab === t.key ? '#F97316' : 'transparent',
              color: tab === t.key ? '#fff' : '#6B7280',
              border: tab === t.key ? '1px solid rgba(249,115,22,0.30)' : '1px solid transparent',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">

        {tab === 'esplora' && (
          <motion.div key="esplora"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="space-y-3"
          >
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
              {CONTESTS.length} sfide disponibili · Partecipa e guadagna XP
            </p>
            {CONTESTS.map((c, i) => (
              <motion.div key={c.id} transition={{ delay: i * 0.04 }}>
                <ContestCard
                  contest={c}
                  enrolled={!!enrolled[c.id]}
                  onJoin={joinContest}
                  onLeave={leaveContest}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'i-miei' && (
          <motion.div key="i-miei"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-3"
          >
            {myContests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ padding: '48px 0', textAlign: 'center' }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(249,115,22,0.10)',
                  border: '1.5px solid rgba(249,115,22,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, margin: '0 auto 16px',
                }}>
                  🏁
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1C1917', marginBottom: 6 }}>
                  Nessuna sfida attiva
                </p>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>
                  Vai su "Esplora" per partecipare<br/>alla tua prima sfida!
                </p>
                <motion.button
                  onClick={() => setTab('esplora')}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{
                    marginTop: 16, padding: '10px 24px', borderRadius: 14,
                    background: 'linear-gradient(145deg, #FB923C, #F97316)',
                    color: '#fff', fontSize: 13, fontWeight: 700, border: 'none',
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.32)',
                  }}
                >
                  🔍 Esplora sfide
                </motion.button>
              </motion.div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
                  {myContests.length} sfida{myContests.length > 1 ? 'e' : ''} in corso
                </p>
                {myContests.map((c) => (
                  <MyContestCard key={c.id} contest={c} progress={enrolled[c.id]} />
                ))}
              </>
            )}
          </motion.div>
        )}

        {tab === 'classifica' && (
          <motion.div key="classifica"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-3"
          >
            {/* Featured contest: Sfida Calorie 7 Giorni */}
            <div style={{
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.18)',
              borderRadius: '1rem', padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#F97316' }}>Sfida Calorie 7 Giorni</p>
                <p style={{ fontSize: 10, color: '#9CA3AF' }}>Classifica settimanale globale</p>
              </div>
            </div>

            {/* Leaderboard list */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #E5EBE0',
              borderRadius: '1.5rem', overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 64px 64px',
                gap: 8, padding: '10px 16px',
                borderBottom: '1px solid #F3F6F0',
                background: '#F8FAF7',
              }}>
                {['#', 'Utente', 'Streak', 'XP'].map((h) => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', textAlign: h !== 'Utente' ? 'center' : 'left' }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Top 9 mock rows */}
              {LEADERBOARD_MOCK.map((u, i) => (
                <motion.div
                  key={u.rank}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '36px 1fr 64px 64px',
                    gap: 8, padding: '10px 16px', alignItems: 'center',
                    borderBottom: i < LEADERBOARD_MOCK.length - 1 ? '1px solid #F8FAF7' : 'none',
                    background: i < 3 ? `rgba(249,115,22,${0.03 - i * 0.008})` : '#fff',
                  }}
                >
                  <span style={{ fontSize: 14, textAlign: 'center' }}>{u.avatar}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>{u.name}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF' }}>Rank #{u.rank}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#F97316' }}>🔥 {u.streak}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#8B5CF6' }}>{u.xp.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}

              {/* My row */}
              {myRank && (
                <>
                  {myRank > LEADERBOARD_MOCK.length && (
                    <div style={{ padding: '6px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, color: '#C9D5C4' }}>· · ·</span>
                    </div>
                  )}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '36px 1fr 64px 64px',
                    gap: 8, padding: '10px 16px', alignItems: 'center',
                    background: 'rgba(249,115,22,0.08)',
                    borderTop: '1px solid rgba(249,115,22,0.15)',
                    borderBottom: '1px solid rgba(249,115,22,0.15)',
                  }}>
                    <span style={{ fontSize: 14, textAlign: 'center' }}>👤</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#F97316' }}>
                        {firstName} (Tu)
                      </p>
                      <p style={{ fontSize: 10, color: '#F97316', opacity: 0.7 }}>Rank #{myRank}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#F97316' }}>🔥 {streak}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#8B5CF6' }}>{myXp.toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!myRank && (
              <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>
                Partecipa a una sfida per apparire in classifica!
              </p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
