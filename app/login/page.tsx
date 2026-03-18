'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';
import { getClientAuth, googleProvider } from '@/lib/firebase-client.config';

// ── Auth helpers ──────────────────────────────────────────────────────────────
const ERR: Record<string, string> = {
  'auth/invalid-email':          'Indirizzo email non valido.',
  'auth/user-not-found':         'Nessun account trovato.',
  'auth/wrong-password':         'Password errata. Riprova.',
  'auth/invalid-credential':     'Credenziali non valide.',
  'auth/email-already-in-use':   'Email già registrata.',
  'auth/weak-password':          'Password minimo 6 caratteri.',
  'auth/too-many-requests':      'Troppi tentativi. Attendi.',
  'auth/popup-closed-by-user':   'Accesso annullato.',
  'auth/network-request-failed': 'Errore di rete.',
};
const authErr = (code: string) => ERR[code] ?? 'Si è verificato un errore.';

async function mintSession(idToken: string) {
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!r.ok) throw new Error('session-mint-failed');
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({
  id, label, type, value, onChange, placeholder, autoComplete, minLength, required,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
  minLength?: number; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={{
        display: 'block', fontFamily: 'var(--font-ui)', fontWeight: 700,
        fontSize: 14, marginBottom: 7, color: 'var(--indigo-700)',
      }}>
        {label}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        minLength={minLength} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: focused ? '#fff' : 'var(--indigo-50)',
          border: `2.5px solid ${focused ? 'var(--indigo-500)' : 'var(--indigo-200)'}`,
          borderRadius: 14,
          padding: '13px 16px',
          fontFamily: 'var(--font-ui)',
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--indigo-900)',
          outline: 'none',
          transition: 'all 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
          caretColor: 'var(--indigo-500)',
        }}
      />
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#fff', borderRadius: 50,
      padding: '8px 14px',
      border: '2px solid var(--indigo-100)',
      boxShadow: '0 3px 0 var(--indigo-200)',
    }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--indigo-700)' }}>
        {label}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, startTransition] = useTransition();

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (!isMobile) return;
    getRedirectResult(getClientAuth()).then(async (r) => {
      if (r?.user) { await mintSession(await r.user.getIdToken()); router.push('/dashboard'); }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = async (token: string) => { await mintSession(token); router.push('/dashboard'); };

  const doLogin = () => startTransition(async () => {
    setError('');
    try {
      const c = await signInWithEmailAndPassword(getClientAuth(), email, pass);
      await go(await c.user.getIdToken());
    } catch (e: unknown) { setError(authErr((e as { code: string }).code)); }
  });

  const doRegister = () => startTransition(async () => {
    setError('');
    try {
      const c = await createUserWithEmailAndPassword(getClientAuth(), email, pass);
      if (name) await updateProfile(c.user, { displayName: name });
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: c.user.uid, email, name, idToken: await c.user.getIdToken() }),
      });
      await go(await c.user.getIdToken());
    } catch (e: unknown) { setError(authErr((e as { code: string }).code)); }
  });

  const doGoogle = () => startTransition(async () => {
    setError('');
    try {
      if (isMobile) { await signInWithRedirect(getClientAuth(), googleProvider); }
      else { const c = await signInWithPopup(getClientAuth(), googleProvider); await go(await c.user.getIdToken()); }
    } catch (e: unknown) { setError(authErr((e as { code: string }).code)); }
  });

  const doForgot = () => startTransition(async () => {
    setError(''); setSuccess('');
    try {
      await sendPasswordResetEmail(getClientAuth(), email);
      setSuccess(`Link inviato a ${email}`);
    } catch (e: unknown) { setError(authErr((e as { code: string }).code)); }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') doLogin();
    else if (tab === 'register') doRegister();
    else doForgot();
  };

  const switchTab = (t: 'login' | 'register') => { setTab(t); setError(''); setSuccess(''); };

  return (
    <main className="min-h-screen bg-anim flex flex-col items-center justify-center px-4 py-8">
      {/* Dot grid texture */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(99,102,241,0.12) 1.5px, transparent 1.5px)',
        backgroundSize: '26px 26px',
      }} />

      <div className="relative w-full" style={{ maxWidth: 400, zIndex: 10 }}>

        {/* Logo block */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          {/* App icon */}
          <div style={{
            width: 80, height: 80, margin: '0 auto 16px',
            background: 'linear-gradient(145deg, var(--indigo-500), var(--indigo-700))',
            borderRadius: 22,
            border: '3px solid var(--indigo-300)',
            boxShadow: '0 8px 0 var(--indigo-900), 0 14px 32px rgba(67,56,202,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 38,
          }}>
            🥗
          </div>
          <h1 style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: '-0.02em',
            margin: 0, lineHeight: 1.1,
            background: 'linear-gradient(135deg, var(--indigo-700) 0%, var(--purple-500) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            NutriTrack
          </h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, color: 'var(--indigo-500)', margin: '4px 0 0' }}>
            Il tuo coach nutrizionale personale 💪
          </p>
        </motion.div>

        {/* Stats pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}
        >
          <StatPill emoji="🔥" label="Streak daily" />
          <StatPill emoji="🏆" label="Leghe" />
          <StatPill emoji="📊" label="AI nutrition" />
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 26 }}
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 28,
            border: '2.5px solid var(--indigo-100)',
            boxShadow: '0 8px 0 var(--indigo-200), 0 16px 48px rgba(99,102,241,0.18), inset 0 1.5px 0 rgba(255,255,255,0.9)',
            padding: '28px 24px 32px',
          }}
        >
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--indigo-50)', padding: 4,
            borderRadius: 50, border: '2px solid var(--indigo-100)',
            boxShadow: 'inset 0 2px 4px rgba(99,102,241,0.10)',
            marginBottom: 24,
          }}>
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 40, border: 'none',
                  cursor: 'pointer', position: 'relative',
                  fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
                  background: 'transparent',
                  color: (tab === 'forgot' ? 'login' : tab) === t ? 'var(--indigo-700)' : 'var(--indigo-400)',
                  transition: 'color 0.15s',
                }}
              >
                {(tab === 'forgot' ? 'login' : tab) === t && (
                  <motion.span
                    layoutId="tab-pill"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 40,
                      background: '#fff',
                      border: '2px solid var(--indigo-200)',
                      boxShadow: '0 3px 0 var(--indigo-200), inset 0 1px 0 rgba(255,255,255,0.9)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {t === 'login' ? 'Accedi' : 'Registrati'}
                </span>
              </button>
            ))}
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="err"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{
                  marginBottom: 14, padding: '10px 14px', borderRadius: 12,
                  background: 'var(--rose-50)', border: '2px solid var(--rose-200)',
                  color: 'var(--rose-700)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13,
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}
            {success && (
              <motion.div key="ok"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{
                  marginBottom: 14, padding: '10px 14px', borderRadius: 12,
                  background: 'var(--emerald-50)', border: '2px solid var(--emerald-200)',
                  color: 'var(--emerald-700)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13,
                }}
              >
                ✅ {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            onSubmit={submit}
            key={tab}
            initial={{ opacity: 0, x: tab === 'register' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <AnimatePresence>
              {tab === 'register' && (
                <motion.div key="name"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                >
                  <Field id="name" label="Il tuo nome" type="text" value={name} onChange={setName}
                    placeholder="Mario Rossi" autoComplete="name" required />
                </motion.div>
              )}
            </AnimatePresence>

            <Field id="email" label="Email" type="email" value={email} onChange={setEmail}
              placeholder="mario@esempio.it" autoComplete="email" required />

            {tab !== 'forgot' && (
              <Field id="pass" label="Password" type="password" value={pass} onChange={setPass}
                placeholder={tab === 'register' ? 'Min. 6 caratteri' : '••••••••'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                minLength={6} required />
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="btn btn-indigo"
              style={{ width: '100%', fontSize: 16, marginTop: 4 }}
            >
              {pending ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
                    animation: 'spin 0.65s linear infinite', display: 'inline-block',
                  }} />
                  Attendere…
                </span>
              ) : (
                tab === 'login' ? '🚀 Accedi' : tab === 'register' ? '🎉 Crea account' : '📧 Invia link reset'
              )}
            </button>
          </motion.form>

          {/* Extra links */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            {tab === 'login' && (
              <button onClick={() => { setTab('forgot'); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--indigo-500)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Password dimenticata?
              </button>
            )}
            {tab === 'forgot' && (
              <button onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--indigo-500)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                ← Torna al login
              </button>
            )}
          </div>

          {/* Google */}
          {tab !== 'forgot' && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 2, background: 'var(--indigo-100)', borderRadius: 99 }} />
                <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--indigo-400)', whiteSpace: 'nowrap' }}>oppure</span>
                <div style={{ flex: 1, height: 2, background: 'var(--indigo-100)', borderRadius: 99 }} />
              </div>
              <button
                type="button"
                onClick={doGoogle}
                disabled={pending}
                className="btn btn-outline"
                style={{ width: '100%', fontSize: 15 }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continua con Google
              </button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: 'rgba(99,102,241,0.5)' }}>
          nutritrack.it · Versione 4.0
        </p>
      </div>
    </main>
  );
}
