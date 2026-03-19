'use client';

/**
 * /app/login/page.tsx  –  Dark Glass Login
 * Full-screen dark background (orbs from layout.tsx).
 * Frosted glass card with NutriTrack identity.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

// ── Session helper ─────────────────────────────────────────────────────────

async function persistSession(idToken: string) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('Session creation failed');
}

// ── Field ──────────────────────────────────────────────────────────────────

function Field({
  label, type = 'text', value, onChange, placeholder,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(248,250,252,0.50)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : undefined}
        className="glass-input w-full px-4 py-3 text-sm font-medium rounded-xl"
        style={{ fontFamily: 'var(--font-ui)' }}
      />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = getAuth(getApp());
      let cred;
      if (mode === 'login') {
        cred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        cred = await createUserWithEmailAndPassword(auth, email, password);
        const regToken = await cred.user.getIdToken();
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: cred.user.uid, email, name: name.trim() || email.split('@')[0], idToken: regToken }),
        });
      }
      const idToken = await cred.user.getIdToken();
      await persistSession(idToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Errore';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
        setError('Email o password non corretti.');
      else if (msg.includes('email-already-in-use'))
        setError('Questa email è già registrata.');
      else if (msg.includes('weak-password'))
        setError('Password troppo debole (min. 6 caratteri).');
      else setError(msg);
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      const auth = getAuth(getApp());
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const isNew = (cred as unknown as { _tokenResponse?: { isNewUser?: boolean } })._tokenResponse?.isNewUser;
      const idToken = await cred.user.getIdToken();
      if (isNew) {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName, idToken }),
        });
      }
      await persistSession(idToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Errore Google');
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(145deg, #0F0A1E 0%, #1A0D2E 50%, #0D1520 100%)' }}
    >

      {/* ── Logo ── */}
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-3xl text-4xl"
          style={{
            width: 80, height: 80,
            background: 'linear-gradient(145deg, rgba(139,92,246,0.28), rgba(109,40,217,0.48))',
            border: '1px solid rgba(167,139,250,0.38)',
            boxShadow: '0 0 48px rgba(139,92,246,0.50), 0 8px 32px rgba(0,0,0,0.50)',
          }}
        >
          🥗
        </div>
        <h1
          className="text-4xl"
          style={{
            fontFamily: 'var(--font-display)',
            color: '#F8FAFC',
            textShadow: '0 0 32px rgba(139,92,246,0.65)',
          }}
        >
          NutriTrack
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(248,250,252,0.42)', fontFamily: 'var(--font-ui)' }}>
          Il tuo diario nutrizionale intelligente
        </p>
      </motion.div>

      {/* ── Glass Card ── */}
      <motion.div
        className="w-full max-w-sm"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: '1.75rem',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.09)',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      >
        {/* Mode tabs */}
        <div className="flex p-2 gap-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold relative overflow-hidden"
              style={{ fontFamily: 'var(--font-ui)', color: mode === m ? '#F8FAFC' : 'rgba(248,250,252,0.35)' }}
            >
              {mode === m && (
                <motion.span
                  layoutId="login-tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'rgba(139,92,246,0.22)',
                    border: '1px solid rgba(139,92,246,0.38)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative z-10">{m === 'login' ? 'Accedi' : 'Registrati'}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {mode === 'register' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Field label="Nome" value={name} onChange={setName} placeholder="Il tuo nome" />
              </motion.div>
            )}
          </AnimatePresence>

          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="email@esempio.it" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium px-3 py-2 rounded-xl"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.25)' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-55"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)',
              color: '#fff',
              border: '1px solid rgba(196,181,253,0.28)',
              boxShadow: '0 4px 0 rgba(91,33,182,0.70), 0 8px 28px rgba(139,92,246,0.35)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98, y: 3 }}
          >
            {loading ? 'Caricamento…' : mode === 'login' ? '🚀 Accedi' : '✨ Crea account'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: 'rgba(248,250,252,0.32)' }}>oppure</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Google */}
        <div className="px-6 pb-6">
          <motion.button
            onClick={handleGoogle}
            disabled={loading}
            type="button"
            className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 disabled:opacity-55"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(248,250,252,0.78)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continua con Google
          </motion.button>
        </div>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        className="mt-8 flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {['🔥 Streak giornaliero', '🏆 Leghe & premi', '📊 Analisi macro', '⚖️ Traccia peso'].map((f) => (
          <span
            key={f}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(248,250,252,0.48)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {f}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
