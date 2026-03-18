'use client';

/**
 * SettingsClient.tsx  –  Interactive Settings Form
 *
 * Sections:
 *   1. Profile – display name
 *   2. Nutrition Goals – kcal, protein, carbs, fat
 *   3. Account – sign out
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProfileAction, updateGoalsAction } from '@/lib/actions/userActions';

interface Props {
  user: {
    name: string;
    email: string;
    goals: { kcal: number; protein: number; carbs: number; fat: number };
  };
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Field component ──────────────────────────────────────────────────────────

function Field({
  label, type = 'text', value, onChange, placeholder, suffix, min, max, step,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: '#3730A3' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '2px solid #A5B4FC',
            color: '#1E1B4B',
            boxShadow: '0 2px 0 #4338CA, inset 0 2px 6px rgba(0,0,0,0.03)',
            paddingRight: suffix ? '3rem' : '1rem',
          }}
        />
        {suffix && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
            style={{ color: '#6366F1' }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Save button ──────────────────────────────────────────────────────────────

function SaveButton({ status }: { status: SaveStatus }) {
  const labels: Record<SaveStatus, string> = {
    idle: '💾 Salva',
    saving: 'Salvando...',
    saved: '✅ Salvato!',
    error: '❌ Errore',
  };
  const styles: Record<SaveStatus, React.CSSProperties> = {
    idle: {
      background: 'linear-gradient(145deg, #818CF8, #6366F1)',
      border: '2.5px solid #A5B4FC',
      boxShadow: '0 5px 0 #3730A3',
      color: '#fff',
    },
    saving: {
      background: 'linear-gradient(145deg, #C7D2FE, #A5B4FC)',
      border: '2.5px solid #C7D2FE',
      boxShadow: '0 3px 0 #6366F1',
      color: '#3730A3',
    },
    saved: {
      background: 'linear-gradient(145deg, #D1FAE5, #A7F3D0)',
      border: '2.5px solid #6EE7B7',
      boxShadow: '0 5px 0 #059669',
      color: '#065F46',
    },
    error: {
      background: 'linear-gradient(145deg, #FFE4E6, #FECDD3)',
      border: '2.5px solid #FECDD3',
      boxShadow: '0 5px 0 #BE123C',
      color: '#881337',
    },
  };

  return (
    <motion.button
      type="submit"
      disabled={status === 'saving'}
      className="w-full py-3 rounded-2xl text-sm font-extrabold disabled:opacity-70"
      style={{ fontFamily: 'var(--font-ui)', ...styles[status] }}
      whileHover={status === 'idle' ? { scale: 1.02, y: -2 } : {}}
      whileTap={status === 'idle' ? { scale: 0.98, y: 3 } : {}}
    >
      {labels[status]}
    </motion.button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SettingsClient({ user }: Props) {
  // Profile state
  const [name, setName] = useState(user.name);
  const [profileStatus, setProfileStatus] = useState<SaveStatus>('idle');

  // Goals state
  const [kcal, setKcal] = useState(String(user.goals.kcal));
  const [protein, setProtein] = useState(String(user.goals.protein));
  const [carbs, setCarbs] = useState(String(user.goals.carbs));
  const [fat, setFat] = useState(String(user.goals.fat));
  const [goalsStatus, setGoalsStatus] = useState<SaveStatus>('idle');

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileStatus('saving');
    const result = await updateProfileAction({ name });
    setProfileStatus(result.success ? 'saved' : 'error');
    if (result.success) setTimeout(() => setProfileStatus('idle'), 2500);
  };

  const handleGoalsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalsStatus('saving');
    const result = await updateGoalsAction({
      kcal: parseInt(kcal) || 2000,
      protein: parseInt(protein) || 150,
      carbs: parseInt(carbs) || 200,
      fat: parseInt(fat) || 65,
    });
    setGoalsStatus(result.success ? 'saved' : 'error');
    if (result.success) setTimeout(() => setGoalsStatus('idle'), 2500);
  };

  const CARD_BASE = {
    borderRadius: '1.5rem',
    inset: '0 2px 0 rgba(255,255,255,0.70)',
  };

  const CARD_INDIGO = {
    ...CARD_BASE,
    background: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 100%)',
    border: '2.5px solid #A5B4FC',
    boxShadow: '0 6px 0 #4338CA, 0 10px 28px rgba(67,56,202,0.12), inset 0 2px 0 rgba(255,255,255,0.70)',
  };

  const CARD_AMBER = {
    ...CARD_BASE,
    background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
    border: '2.5px solid #FDE68A',
    boxShadow: '0 6px 0 #B45309, 0 10px 28px rgba(180,83,9,0.10), inset 0 2px 0 rgba(255,255,255,0.70)',
  };

  const CARD_ROSE = {
    ...CARD_BASE,
    background: 'linear-gradient(145deg, #FFF1F2 0%, #FFE4E6 100%)',
    border: '2.5px solid #FECDD3',
    boxShadow: '0 6px 0 #BE123C, 0 10px 28px rgba(190,18,60,0.10), inset 0 2px 0 rgba(255,255,255,0.70)',
  };

  return (
    <div className="space-y-4 pb-4">

      {/* ── Profile section ── */}
      <motion.div
        className="p-5"
        style={CARD_INDIGO}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wide mb-4" style={{ color: '#3730A3' }}>
          👤 Profilo
        </h2>

        {/* Email (read-only) */}
        <div className="mb-3">
          <label className="block text-xs font-bold mb-1" style={{ color: '#3730A3' }}>
            Email
          </label>
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '2px solid rgba(165,180,252,0.5)',
              color: '#6366F1',
            }}
          >
            {user.email}
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-3">
          <Field
            label="Nome visualizzato"
            value={name}
            onChange={setName}
            placeholder="Il tuo nome"
          />
          <SaveButton status={profileStatus} />
        </form>
      </motion.div>

      {/* ── Nutrition Goals section ── */}
      <motion.div
        className="p-5"
        style={CARD_AMBER}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wide mb-1" style={{ color: '#92400E' }}>
          🎯 Obiettivi nutrizionali
        </h2>
        <p className="text-xs mb-4" style={{ color: '#B45309', opacity: 0.8 }}>
          Personalizza i tuoi obiettivi giornalieri
        </p>

        <form onSubmit={handleGoalsSave} className="space-y-3">
          <Field
            label="Calorie"
            type="number"
            value={kcal}
            onChange={setKcal}
            placeholder="2000"
            suffix="kcal"
            min={500}
            max={6000}
          />
          <div className="grid grid-cols-3 gap-2">
            <Field
              label="Proteine"
              type="number"
              value={protein}
              onChange={setProtein}
              placeholder="150"
              suffix="g"
              min={0}
              max={500}
            />
            <Field
              label="Carboidrati"
              type="number"
              value={carbs}
              onChange={setCarbs}
              placeholder="200"
              suffix="g"
              min={0}
              max={800}
            />
            <Field
              label="Grassi"
              type="number"
              value={fat}
              onChange={setFat}
              placeholder="65"
              suffix="g"
              min={0}
              max={300}
            />
          </div>

          {/* Macro summary */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid #FDE68A' }}
          >
            <span className="text-xs font-bold" style={{ color: '#92400E' }}>Calorie dai macro</span>
            <span className="text-sm font-extrabold" style={{ color: '#B45309' }}>
              {Math.round(
                (parseInt(protein) || 0) * 4 +
                (parseInt(carbs) || 0) * 4 +
                (parseInt(fat) || 0) * 9
              )} kcal
            </span>
          </div>

          <motion.button
            type="submit"
            disabled={goalsStatus === 'saving'}
            className="w-full py-3 rounded-2xl text-sm font-extrabold disabled:opacity-70"
            style={{
              fontFamily: 'var(--font-ui)',
              background: goalsStatus === 'saved'
                ? 'linear-gradient(145deg, #D1FAE5, #A7F3D0)'
                : 'linear-gradient(145deg, #FDE68A, #FBBF24)',
              color: goalsStatus === 'saved' ? '#065F46' : '#78350F',
              border: goalsStatus === 'saved' ? '2.5px solid #6EE7B7' : '2.5px solid #FDE68A',
              boxShadow: goalsStatus === 'saved' ? '0 5px 0 #059669' : '0 5px 0 #B45309',
            }}
            whileHover={goalsStatus === 'idle' ? { scale: 1.02, y: -2 } : {}}
            whileTap={goalsStatus === 'idle' ? { scale: 0.98, y: 3 } : {}}
          >
            {goalsStatus === 'saving' ? 'Salvando...' : goalsStatus === 'saved' ? '✅ Salvato!' : goalsStatus === 'error' ? '❌ Errore' : '🎯 Salva obiettivi'}
          </motion.button>
        </form>
      </motion.div>

      {/* ── Quick links section ── */}
      <motion.div
        className="p-4"
        style={{
          background: 'linear-gradient(145deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: '2.5px solid #CBD5E1',
          borderRadius: '1.5rem',
          boxShadow: '0 4px 0 #475569, 0 8px 20px rgba(71,85,105,0.10)',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wide mb-3" style={{ color: '#334155' }}>
          🔗 Collegament rapidi
        </h2>
        <div className="space-y-2">
          {[
            { href: '/weight', icon: '⚖️', label: 'Traccia peso', color: '#4338CA' },
            { href: '/leagues', icon: '🏆', label: 'Leghe', color: '#6D28D9' },
            { href: '/profile', icon: '👤', label: 'Profilo & Premi', color: '#1D4ED8' },
            { href: '/diary', icon: '📋', label: 'Diario alimentare', color: '#B45309' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-bold" style={{ color: link.color }}>{link.label}</span>
              <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={link.color} strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          ))}
        </div>
      </motion.div>

      {/* ── Sign Out ── */}
      <motion.div
        className="p-4"
        style={CARD_ROSE}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wide mb-3" style={{ color: '#881337' }}>
          🚪 Account
        </h2>
        <SignOutButton />
      </motion.div>

    </div>
  );
}

// ── Sign out ─────────────────────────────────────────────────────────────────

function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full py-3 rounded-2xl text-sm font-extrabold disabled:opacity-60"
      style={{
        background: 'linear-gradient(145deg, #FB7185, #F43F5E)',
        color: '#fff',
        border: '2.5px solid #FECDD3',
        boxShadow: '0 5px 0 #881337',
        fontFamily: 'var(--font-ui)',
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 3 }}
    >
      {loading ? 'Disconnessione...' : '🚪 Esci dall\'account'}
    </motion.button>
  );
}
