'use client';

/**
 * SettingsClient.tsx  –  Dark Glass Settings
 *
 * Redesigned to match the dark glass theme of the rest of the app.
 * Sections:
 *   1. Profile – display name + email
 *   2. Nutrition Goals – kcal, protein, carbs, fat
 *   3. Premium – upgrade CTA
 *   4. Account – sign out
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

// ── Glass Input ─────────────────────────────────────────────────────────────

function GlassField({
  label, type = 'text', value, onChange, placeholder, suffix, min, max, step, readOnly,
}: {
  label: string; type?: string; value: string;
  onChange?: (v: string) => void; placeholder?: string;
  suffix?: string; min?: number; max?: number; step?: number; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type} value={value} readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder} min={min} max={max} step={step}
          className="glass-input w-full px-4 py-3 text-sm font-medium rounded-xl outline-none"
          style={{
            color: readOnly ? 'rgba(248,250,252,0.45)' : '#F8FAFC',
            fontFamily: 'var(--font-ui)',
            paddingRight: suffix ? '3.5rem' : undefined,
            cursor: readOnly ? 'not-allowed' : undefined,
          }}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold"
            style={{ color: 'rgba(248,250,252,0.40)' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SettingsClient({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [profileStatus, setProfileStatus] = useState<SaveStatus>('idle');

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

  const macroCalories = Math.round(
    (parseInt(protein) || 0) * 4 +
    (parseInt(carbs) || 0) * 4 +
    (parseInt(fat) || 0) * 9
  );

  function SaveBtn({ status, label }: { status: SaveStatus; label: string }) {
    const cfg: Record<SaveStatus, { bg: string; color: string; text: string }> = {
      idle:  { bg: 'linear-gradient(145deg, #8B5CF6, #7C3AED)', color: '#fff', text: label },
      saving:{ bg: 'rgba(139,92,246,0.40)', color: 'rgba(248,250,252,0.70)', text: 'Salvando...' },
      saved: { bg: 'rgba(52,211,153,0.25)', color: '#34D399', text: '✅ Salvato!' },
      error: { bg: 'rgba(248,113,113,0.20)', color: '#F87171', text: '❌ Errore' },
    };
    return (
      <motion.button type="submit" disabled={status === 'saving'}
        className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-60"
        style={{ fontFamily: 'var(--font-ui)', background: cfg[status].bg, color: cfg[status].color,
          border: status === 'idle' ? '1px solid rgba(196,181,253,0.25)' : '1px solid transparent',
          boxShadow: status === 'idle' ? '0 4px 0 rgba(91,33,182,0.60)' : undefined }}
        whileHover={status === 'idle' ? { scale: 1.02, y: -1 } : {}}
        whileTap={status === 'idle' ? { scale: 0.98, y: 2 } : {}}>
        {cfg[status].text}
      </motion.button>
    );
  }

  return (
    <div className="space-y-3 pb-4">

      {/* ── Profile ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-4 rounded-2xl"
          style={{
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.18)',
            backdropFilter: 'blur(18px)',
          }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'rgba(34,211,238,0.70)', fontFamily: 'var(--font-ui)' }}>
            👤 Profilo
          </p>
          <GlassField label="Email" value={user.email} readOnly/>
          <div className="mt-3">
            <form onSubmit={handleProfileSave} className="space-y-3">
              <GlassField label="Nome visualizzato" value={name} onChange={setName} placeholder="Il tuo nome"/>
              <SaveBtn status={profileStatus} label="💾 Salva profilo"/>
            </form>
          </div>
        </div>
      </motion.div>

      {/* ── Nutrition Goals ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <div className="p-4 rounded-2xl"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.20)',
            backdropFilter: 'blur(18px)',
          }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'rgba(245,158,11,0.70)', fontFamily: 'var(--font-ui)' }}>
            🎯 Obiettivi nutrizionali
          </p>
          <p className="text-xs mb-4" style={{ color: 'rgba(248,250,252,0.40)', fontFamily: 'var(--font-ui)' }}>
            Personalizza i tuoi obiettivi giornalieri
          </p>
          <form onSubmit={handleGoalsSave} className="space-y-3">
            <GlassField label="Calorie" type="number" value={kcal} onChange={setKcal}
              placeholder="2000" suffix="kcal" min={500} max={6000}/>
            <div className="grid grid-cols-3 gap-2">
              <GlassField label="Proteine" type="number" value={protein} onChange={setProtein}
                placeholder="150" suffix="g" min={0} max={500}/>
              <GlassField label="Carboidrati" type="number" value={carbs} onChange={setCarbs}
                placeholder="200" suffix="g" min={0} max={800}/>
              <GlassField label="Grassi" type="number" value={fat} onChange={setFat}
                placeholder="65" suffix="g" min={0} max={300}/>
            </div>
            {/* Macro calc summary */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
              <span className="text-xs font-semibold" style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>
                Calorie dai macro
              </span>
              <span className="text-sm font-black" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>
                {macroCalories} kcal
              </span>
            </div>
            <SaveBtn status={goalsStatus} label="🎯 Salva obiettivi"/>
          </form>
        </div>
      </motion.div>

      {/* ── Quick Links ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <div className="p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(18px)' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,250,252,0.40)', fontFamily: 'var(--font-ui)' }}>
            🔗 Navigazione rapida
          </p>
          <div className="space-y-2">
            {[
              { href: '/insights', icon: '📊', label: 'Insights & Peso', accent: '52,211,153' },
              { href: '/leagues', icon: '🏆', label: 'Leghe', accent: '168,85,247' },
              { href: '/profile', icon: '👤', label: 'Profilo & Premi', accent: '34,211,238' },
              { href: '/diary', icon: '📋', label: 'Diario alimentare', accent: '245,158,11' },
              { href: '/premium', icon: '✨', label: 'Premium', accent: '245,158,11' },
            ].map((link) => (
              <a key={link.href} href={link.href}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                <span className="text-base">{link.icon}</span>
                <span className="flex-1 text-sm font-semibold"
                  style={{ color: 'rgba(248,250,252,0.75)', fontFamily: 'var(--font-ui)' }}>
                  {link.label}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(248,250,252,0.30)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Premium CTA ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <a href="/premium" className="block relative overflow-hidden p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(139,92,246,0.10))',
            border: '1px solid rgba(245,158,11,0.28)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(245,158,11,0.20)', border: '1px solid rgba(245,158,11,0.35)' }}>✨</div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>
                Prova Premium Gratis
              </p>
              <p className="text-xs" style={{ color: 'rgba(248,250,252,0.45)', fontFamily: 'var(--font-ui)' }}>
                7 giorni di prova · poi €4,99/mese
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(252,211,77,0.55)" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </a>
      </motion.div>

      {/* ── Account / Sign Out ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <div className="p-4 rounded-2xl"
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.18)',
            backdropFilter: 'blur(18px)',
          }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,113,113,0.70)', fontFamily: 'var(--font-ui)' }}>
            🚪 Account
          </p>
          <SignOutButton/>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sign Out Button ────────────────────────────────────────────────────────────

function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      window.location.href = '/login';
    } catch { setLoading(false); }
  };

  return (
    <motion.button
      onClick={handleSignOut} disabled={loading}
      className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-60"
      style={{
        background: 'linear-gradient(145deg, #F87171, #EF4444)',
        color: '#fff', fontFamily: 'var(--font-ui)',
        border: '1px solid rgba(252,165,165,0.25)',
        boxShadow: '0 4px 0 rgba(153,27,27,0.60)',
      }}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98, y: 2 }}
    >
      {loading ? 'Disconnessione...' : '🚪 Esci dall\'account'}
    </motion.button>
  );
}
