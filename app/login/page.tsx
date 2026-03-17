'use client';

/**
 * Login / Register page  –  Disney/Pixar 3D clay-style UI
 *
 * Visual design based on the NutriTrack v2 reference render:
 *  - Warm beige (#f5efe4) background with blurred culinary decorations
 *  - Sprinty the Avocado: 3D rendered, waving pose
 *  - "Bentornato su NutriTrack!" on a wooden-sign badge
 *  - 3D glossy "NutriTrack" title with text-shadow depth
 *  - Neumorphic pill tab switcher
 *  - Clay-smooth input fields with soft inner shadows
 *  - Pill-shaped 3D green "Accedi" button
 */

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
import Sprinty3D from '@/components/Sprinty3D';
import { Apple3D, Olives3D, Spatula3D, Carrot3D, KeyIcon3D } from '@/components/FoodProps3D';

type Tab = 'login' | 'register' | 'forgot';

const ERROR_MAP: Record<string, string> = {
  'auth/invalid-email':           'Indirizzo email non valido.',
  'auth/user-not-found':          'Nessun account trovato con questa email.',
  'auth/wrong-password':          'Password errata. Riprova.',
  'auth/invalid-credential':      'Credenziali non valide. Riprova.',
  'auth/email-already-in-use':    'Questa email è già registrata.',
  'auth/weak-password':           'La password deve avere almeno 6 caratteri.',
  'auth/too-many-requests':       'Troppi tentativi. Attendi qualche minuto.',
  'auth/popup-closed-by-user':    'Accesso annullato.',
  'auth/network-request-failed':  'Errore di rete. Controlla la connessione.',
};

function authError(code: string): string {
  return ERROR_MAP[code] ?? 'Si è verificato un errore. Riprova.';
}

async function exchangeTokenForSession(idToken: string): Promise<void> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('Impossibile creare la sessione.');
}

// ── Particle sparkle component ───────────────────────────────────────────────

function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        y: [0, -20, -36],
      }}
      transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z" fill="#f59e0b" opacity="0.8" />
      </svg>
    </motion.div>
  );
}

// ── Clay input field ─────────────────────────────────────────────────────────

function ClayInput({
  type,
  value,
  onChange,
  placeholder,
  label,
  autoComplete,
  minLength,
  required,
  icon,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        className="block text-sm font-bold mb-2"
        style={{ color: '#5c3d1a', fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </label>
      <div
        className="relative transition-all duration-200"
        style={{
          borderRadius: 16,
          background: focused ? '#fffdf9' : '#faf6f0',
          boxShadow: focused
            ? '0 0 0 2.5px #4ade80, inset 0 3px 8px rgba(90,50,10,0.12), 0 2px 8px rgba(90,50,10,0.08)'
            : 'inset 0 3px 8px rgba(90,50,10,0.12), 0 2px 6px rgba(90,50,10,0.07), inset 0 -1px 0 rgba(255,255,255,0.7)',
          border: focused ? '1.5px solid #4ade80' : '1.5px solid rgba(180,140,90,0.25)',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-4 py-3 text-sm outline-none pr-12"
          style={{ color: '#5c3d1a', borderRadius: 16, caretColor: '#22c55e' }}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Handle Google redirect result on mobile
  useEffect(() => {
    if (!isMobile) return;
    getRedirectResult(getClientAuth()).then(async (result) => {
      if (result?.user) {
        const idToken = await result.user.getIdToken();
        await exchangeTokenForSession(idToken);
        router.push('/dashboard');
      }
    }).catch(() => {});
  }, []);

  const handleSuccess = async (idToken: string) => {
    await exchangeTokenForSession(idToken);
    router.push('/dashboard');
  };

  const doLogin = () =>
    startTransition(async () => {
      setError('');
      try {
        const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
        await handleSuccess(await cred.user.getIdToken());
      } catch (e: any) { setError(authError(e.code)); }
    });

  const doRegister = () =>
    startTransition(async () => {
      setError('');
      try {
        const cred = await createUserWithEmailAndPassword(getClientAuth(), email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: cred.user.uid, email, name, idToken: await cred.user.getIdToken() }),
        });
        await handleSuccess(await cred.user.getIdToken());
      } catch (e: any) { setError(authError(e.code)); }
    });

  const doGoogle = () =>
    startTransition(async () => {
      setError('');
      try {
        if (isMobile) {
          await signInWithRedirect(getClientAuth(), googleProvider);
        } else {
          const cred = await signInWithPopup(getClientAuth(), googleProvider);
          await handleSuccess(await cred.user.getIdToken());
        }
      } catch (e: any) { setError(authError(e.code)); }
    });

  const doForgot = () =>
    startTransition(async () => {
      setError(''); setSuccess('');
      try {
        await sendPasswordResetEmail(getClientAuth(), email);
        setSuccess(`Email di reset inviata a ${email}. Controlla la tua casella.`);
      } catch (e: any) { setError(authError(e.code)); }
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') doLogin();
    else if (tab === 'register') doRegister();
    else doForgot();
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start overflow-x-hidden"
      style={{
        background: 'radial-gradient(ellipse at 40% 20%, #fdf6ec 0%, #f5efe4 55%, #ede4d3 100%)',
        fontFamily: 'var(--font-sans)',
        paddingTop: 24,
        paddingBottom: 40,
      }}
    >

      {/* ── Decorative background food props ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Apple – top-left */}
        <motion.div
          style={{ position: 'absolute', left: -20, top: 60, opacity: 0.75, filter: 'blur(1.5px)' }}
          animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Apple3D size={110} />
        </motion.div>
        {/* Olives – bottom-left */}
        <motion.div
          style={{ position: 'absolute', left: -10, bottom: 80, opacity: 0.7, filter: 'blur(1px)' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <Olives3D size={88} />
        </motion.div>
        {/* Spatula – top-right */}
        <motion.div
          style={{ position: 'absolute', right: -18, top: 30, opacity: 0.65, filter: 'blur(2px)' }}
          animate={{ rotate: [8, 12, 8] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Spatula3D size={70} />
        </motion.div>
        {/* Bread / warm blob – bottom-right */}
        <motion.div
          style={{ position: 'absolute', right: -24, bottom: 60, opacity: 0.55, filter: 'blur(2px)' }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        >
          <svg width="110" height="90" viewBox="0 0 110 90" aria-hidden="true">
            <defs>
              <radialGradient id="bread-g" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="60%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </radialGradient>
            </defs>
            <ellipse cx="55" cy="55" rx="52" ry="36" fill="url(#bread-g)" />
            <ellipse cx="40" cy="38" rx="20" ry="16" fill="rgba(255,255,255,0.2)" />
          </svg>
        </motion.div>
      </div>

      {/* ── Content column ── */}
      <div className="relative z-10 w-full max-w-sm px-4">

        {/* ── Sprinty + welcome badge ── */}
        <div className="flex flex-col items-center mb-2">

          {/* Sparkles around mascot */}
          <div className="relative" style={{ width: 200, height: 270 }}>
            <Sparkle x={10}  y={60}  delay={0}   />
            <Sparkle x={172} y={50}  delay={0.5} />
            <Sparkle x={8}   y={160} delay={1.1} />
            <Sparkle x={180} y={140} delay={0.7} />
            <Sparkle x={90}  y={10}  delay={1.4} />

            <motion.div
              animate={isPending
                ? { x: [0, 3, -3, 3, 0] }
                : { y: [0, -8, 0] }
              }
              transition={isPending
                ? { duration: 0.35, repeat: Infinity }
                : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <Sprinty3D width={200} />
            </motion.div>
          </div>

          {/* Wooden sign badge */}
          <div
            className="relative -mt-2 px-5 py-2 text-center"
            style={{
              background: 'linear-gradient(135deg, #c8a06b 0%, #a0714a 40%, #8b5e38 100%)',
              borderRadius: 14,
              boxShadow: '0 4px 12px rgba(92,48,10,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.2)',
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            {/* Wood grain lines */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 5px)',
            }} />
            <span
              className="relative text-sm font-bold"
              style={{
                color: '#fff9f0',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              Bentornato su NutriTrack!
            </span>
          </div>
        </div>

        {/* ── 3D glossy title ── */}
        <div className="text-center mb-1">
          <h1
            className="font-serif font-black select-none leading-none"
            style={{
              fontSize: 42,
              background: 'linear-gradient(180deg, #6ee7a0 0%, #22c55e 40%, #15803d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              filter: 'drop-shadow(0 3px 0 rgba(21,128,61,0.45)) drop-shadow(0 6px 8px rgba(21,128,61,0.25))',
            }}
          >
            NutriTrack
          </h1>
          <p
            className="text-sm font-semibold mt-0.5"
            style={{ color: '#8b6a3e', letterSpacing: '0.01em' }}
          >
            Il tuo diario nutrizionale
          </p>
        </div>

        {/* ── Tab switcher (neumorphic pill) ── */}
        <div
          className="flex p-1.5 mb-5 mt-5"
          style={{
            borderRadius: 50,
            background: '#ece5d8',
            boxShadow: 'inset 0 3px 8px rgba(90,50,10,0.15), inset 0 -1px 0 rgba(255,255,255,0.7)',
          }}
        >
          {(['login', 'register'] as const).map((t) => (
            <motion.button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className="flex-1 py-2 text-sm font-bold transition-all duration-200 relative"
              style={{
                borderRadius: 40,
                color: tab === t ? '#4a2a08' : '#a08060',
                background: 'transparent',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {tab === t && (
                <motion.div
                  layoutId="tab-pill"
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 40,
                    background: 'linear-gradient(180deg, #fffdf8 0%, #f5ede0 100%)',
                    boxShadow: '0 2px 10px rgba(90,50,10,0.18), 0 1px 2px rgba(90,50,10,0.1)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">
                {t === 'login' ? 'Accedi' : 'Registrati'}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── Form card ── */}
        <div
          style={{
            background: 'linear-gradient(160deg, #fffdf8 0%, #faf4eb 100%)',
            borderRadius: 28,
            boxShadow: '0 8px 32px rgba(90,50,10,0.16), 0 2px 6px rgba(90,50,10,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            border: '1.5px solid rgba(200,160,100,0.2)',
            padding: '24px 20px 20px',
          }}
        >
          {/* Error / success banners */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: '#fff0eb',
                  border: '1.5px solid #fca5a5',
                  color: '#b91c1c',
                  boxShadow: 'inset 0 2px 4px rgba(185,28,28,0.06)',
                }}
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  color: '#15803d',
                }}
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Name (register only) */}
            <AnimatePresence>
              {tab === 'register' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ClayInput
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="Il tuo nome"
                    label="Nome"
                    required
                    autoComplete="name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <ClayInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="nome@esempio.it"
              label="Email"
              required
              autoComplete="email"
              icon={<Carrot3D size={24} />}
            />

            {/* Password */}
            {tab !== 'forgot' && (
              <ClayInput
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={tab === 'register' ? 'Min. 6 caratteri' : '••••••••'}
                label="Password"
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                icon={<KeyIcon3D size={24} />}
              />
            )}

            {/* ── Submit button (3D pill) ── */}
            <motion.button
              type="submit"
              disabled={isPending}
              whileHover={{ scale: 1.025, y: -1 }}
              whileTap={{ scale: 0.97, y: 1 }}
              className="w-full mt-1 py-3.5 text-base font-black tracking-wide relative overflow-hidden"
              style={{
                borderRadius: 50,
                background: isPending
                  ? 'linear-gradient(180deg, #86efac 0%, #4ade80 100%)'
                  : 'linear-gradient(180deg, #4ade80 0%, #22c55e 45%, #16a34a 100%)',
                color: '#fff',
                boxShadow: isPending
                  ? '0 2px 8px rgba(34,197,94,0.3)'
                  : '0 4px 0 #15803d, 0 6px 20px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.35)',
                textShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transition: 'box-shadow 0.15s ease',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {/* Sheen overlay */}
              <span
                style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%', height: '45%',
                  borderRadius: '0 0 50% 50%',
                  background: 'rgba(255,255,255,0.25)',
                  pointerEvents: 'none',
                }}
              />
              <span className="relative z-10">
                {isPending
                  ? 'Attendere...'
                  : tab === 'login'
                  ? 'Accedi'
                  : tab === 'register'
                  ? 'Crea account'
                  : 'Invia link di reset'}
              </span>
            </motion.button>
          </form>

          {/* Forgot / back links */}
          <div className="mt-4 flex justify-center">
            {tab === 'login' ? (
              <button
                type="button"
                onClick={() => { setTab('forgot'); setError(''); }}
                className="text-xs font-semibold underline underline-offset-2 transition-colors"
                style={{ color: '#a08060' }}
              >
                Password dimenticata?
              </button>
            ) : tab === 'forgot' ? (
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                className="text-xs font-semibold underline underline-offset-2 transition-colors"
                style={{ color: '#a08060' }}
              >
                Torna al login
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Google sign-in ── */}
        {tab !== 'forgot' && (
          <div className="mt-4">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(160,120,60,0.25)' }} />
              <span className="text-xs font-semibold" style={{ color: '#a08060' }}>oppure</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(160,120,60,0.25)' }} />
            </div>

            <motion.button
              type="button"
              onClick={doGoogle}
              disabled={isPending}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-3 py-3 text-sm font-bold"
              style={{
                borderRadius: 50,
                background: 'linear-gradient(180deg, #fffdf8 0%, #f0e8d8 100%)',
                boxShadow: '0 3px 0 rgba(90,50,10,0.2), 0 4px 16px rgba(90,50,10,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
                border: '1.5px solid rgba(200,160,100,0.3)',
                color: '#5c3d1a',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continua con Google
            </motion.button>
          </div>
        )}
      </div>
    </main>
  );
}
