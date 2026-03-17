'use client';

/**
 * Login / Register page  –  Claymorphic 3D Soft-UI
 *
 * Design system:
 *  - bg-[#f7f3e9] warm-cream background with subtle dot grid
 *  - ClayCard for every surface (multi-layer box-shadow, rounded-[2rem])
 *  - Avocado-green gradient buttons (#a3c45a → #88b04b → #6b8e23)
 *  - Framer Motion staggered entrance + floating food props
 *  - Sprinty3D: breathing animation (scale [1, 1.02, 1]) on a wooden plank
 *
 * Auth architecture (already live):
 *  - POST /api/login  → 7-day HttpOnly __session cookie
 *  - AuthProvider     → onIdTokenChanged keeps cookie in sync
 *  - middleware.ts    → Edge JWT-expiry check, redirects on every request
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
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
import { ClayCard, ClayInput, ClayButton } from '@/components/ClayCard';

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'login' | 'register' | 'forgot';

// ── Error messages ───────────────────────────────────────────────────────────

const ERROR_MAP: Record<string, string> = {
  'auth/invalid-email':          'Indirizzo email non valido.',
  'auth/user-not-found':         'Nessun account trovato con questa email.',
  'auth/wrong-password':         'Password errata. Riprova.',
  'auth/invalid-credential':     'Credenziali non valide. Riprova.',
  'auth/email-already-in-use':   'Questa email è già registrata.',
  'auth/weak-password':          'La password deve avere almeno 6 caratteri.',
  'auth/too-many-requests':      'Troppi tentativi. Attendi qualche minuto.',
  'auth/popup-closed-by-user':   'Accesso annullato.',
  'auth/network-request-failed': 'Errore di rete. Controlla la connessione.',
};
function authError(code: string) {
  return ERROR_MAP[code] ?? 'Si è verificato un errore. Riprova.';
}

async function exchangeTokenForSession(idToken: string) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('Impossibile creare la sessione.');
}

// ── Animation variants ───────────────────────────────────────────────────────

const pageVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 340, damping: 26 },
  },
};

// ── Floating sparkle ─────────────────────────────────────────────────────────

function Sparkle({ x, y, delay, size = 10 }: { x: number; y: number; delay: number; size?: number }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -22, -38] }}
      transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 12 12">
        <path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z"
          fill="#f59e0b" />
      </svg>
    </motion.div>
  );
}

// ── Wooden plank (Sprinty's base) ─────────────────────────────────────────────

function WoodenPlank({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col items-center">
      {children}
      {/* Plank */}
      <div
        style={{
          width: 190,
          height: 36,
          marginTop: -8,
          borderRadius: 10,
          background: 'linear-gradient(180deg, #c8935a 0%, #a0704a 40%, #8b5e38 100%)',
          boxShadow: [
            '0 6px 16px rgba(92,48,10,0.38)',
            'inset 0 2px 0 rgba(255,255,255,0.28)',
            'inset 0 -3px 0 rgba(0,0,0,0.18)',
          ].join(', '),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Wood grain lines */}
        {[8, 16, 24].map((y) => (
          <div key={y} style={{
            position: 'absolute', left: 0, right: 0, top: y, height: 1,
            background: 'rgba(0,0,0,0.07)',
          }} />
        ))}
        {/* Knot detail */}
        <div style={{
          position: 'absolute', left: 30, top: 8, width: 18, height: 12,
          borderRadius: '50%', border: '2px solid rgba(0,0,0,0.12)',
        }} />
        {/* Screw dots */}
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }} />
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }} />
      </div>
      {/* Plank cast shadow on page */}
      <div style={{
        width: 150, height: 10, marginTop: 2,
        background: 'rgba(92,48,10,0.18)',
        borderRadius: '50%',
        filter: 'blur(4px)',
      }} />
    </div>
  );
}

// ── Tab switcher ─────────────────────────────────────────────────────────────

function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      className="flex p-1.5"
      style={{
        borderRadius: 50,
        background: 'linear-gradient(180deg, #ede5d4 0%, #e4d9c4 100%)',
        boxShadow: [
          'inset 0 3px 8px rgba(90,58,20,0.18)',
          'inset 0 -1px 0 rgba(255,255,255,0.65)',
        ].join(', '),
      }}
    >
      {(['login', 'register'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className="flex-1 py-2 text-sm font-bold relative transition-colors duration-200"
          style={{
            borderRadius: 40,
            color: tab === t ? '#3d2208' : '#9a7350',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {tab === t && (
            <motion.div
              layoutId="clay-tab-pill"
              style={{
                position: 'absolute', inset: 0, borderRadius: 40,
                background: 'linear-gradient(180deg, #fffdf8 0%, #f5ede0 100%)',
                boxShadow: [
                  '0 3px 10px rgba(90,58,20,0.20)',
                  '0 1px 3px rgba(90,58,20,0.12)',
                  'inset 0 1px 0 rgba(255,255,255,0.9)',
                ].join(', '),
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          )}
          <span className="relative z-10">{t === 'login' ? 'Accedi' : 'Registrati'}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router      = useRouter();
  const prefersRed  = useReducedMotion();

  const [tab,     setTab]     = useState<Tab>('login');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [name,    setName]    = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (!isMobile) return;
    getRedirectResult(getClientAuth())
      .then(async (r) => {
        if (r?.user) {
          await exchangeTokenForSession(await r.user.getIdToken());
          router.push('/dashboard');
        }
      })
      .catch(() => {});
  }, []);

  const goToDashboard = async (idToken: string) => {
    await exchangeTokenForSession(idToken);
    router.push('/dashboard');
  };

  const doLogin = () =>
    startTransition(async () => {
      setError('');
      try {
        const c = await signInWithEmailAndPassword(getClientAuth(), email, pass);
        await goToDashboard(await c.user.getIdToken());
      } catch (e: any) { setError(authError(e.code)); }
    });

  const doRegister = () =>
    startTransition(async () => {
      setError('');
      try {
        const c = await createUserWithEmailAndPassword(getClientAuth(), email, pass);
        if (name) await updateProfile(c.user, { displayName: name });
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: c.user.uid, email, name, idToken: await c.user.getIdToken() }),
        });
        await goToDashboard(await c.user.getIdToken());
      } catch (e: any) { setError(authError(e.code)); }
    });

  const doGoogle = () =>
    startTransition(async () => {
      setError('');
      try {
        if (isMobile) {
          await signInWithRedirect(getClientAuth(), googleProvider);
        } else {
          const c = await signInWithPopup(getClientAuth(), googleProvider);
          await goToDashboard(await c.user.getIdToken());
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
    if (tab === 'login')    doLogin();
    else if (tab === 'register') doRegister();
    else                    doForgot();
  };

  const changeTab = (t: Tab) => { setTab(t); setError(''); setSuccess(''); };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start overflow-x-hidden relative"
      style={{
        background: '#f7f3e9',
        paddingTop: 24,
        paddingBottom: 48,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Subtle dot-grid texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(160,120,60,0.13) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Depth-of-field food decorations ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ zIndex: 1 }}>

        {/* Apple – far left, most blurred (deepest layer) */}
        <motion.div
          style={{ position: 'absolute', left: -28, top: 55, filter: 'blur(3px)', opacity: 0.65 }}
          animate={prefersRed ? {} : { y: [0, -10, 0], rotate: [-4, 2, -4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Apple3D size={118} />
        </motion.div>

        {/* Olives – bottom-left, medium blur (mid layer) */}
        <motion.div
          style={{ position: 'absolute', left: -8, bottom: 72, filter: 'blur(1.5px)', opacity: 0.72 }}
          animate={prefersRed ? {} : { y: [0, -7, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
        >
          <Olives3D size={92} />
        </motion.div>

        {/* Spatula – top-right, sharp (closest layer) */}
        <motion.div
          style={{ position: 'absolute', right: -14, top: 24, filter: 'blur(0.5px)', opacity: 0.70 }}
          animate={prefersRed ? {} : { rotate: [7, 12, 7] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Spatula3D size={72} />
        </motion.div>

        {/* Bread/warm blob – bottom-right, blurred */}
        <motion.div
          style={{ position: 'absolute', right: -22, bottom: 55, filter: 'blur(2px)', opacity: 0.55 }}
          animate={prefersRed ? {} : { y: [0, -10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        >
          <svg width="112" height="88" viewBox="0 0 112 88" aria-hidden="true">
            <defs>
              <radialGradient id="bread-grad" cx="35%" cy="30%" r="65%">
                <stop offset="0%"   stopColor="#fde68a"/>
                <stop offset="60%"  stopColor="#d97706"/>
                <stop offset="100%" stopColor="#92400e"/>
              </radialGradient>
            </defs>
            <ellipse cx="56" cy="54" rx="52" ry="34" fill="url(#bread-grad)"/>
            <ellipse cx="40" cy="36" rx="18" ry="14" fill="rgba(255,255,255,0.22)"/>
          </svg>
        </motion.div>
      </div>

      {/* ── Content column ── */}
      <motion.div
        className="relative w-full max-w-sm px-4"
        style={{ zIndex: 10 }}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >

        {/* ── Mascot hero ── */}
        <motion.div
          className="flex flex-col items-center mb-3"
          variants={itemVariants}
        >
          {/* Sparkle particles */}
          <div className="relative" style={{ width: 200, height: 250 }}>
            {!prefersRed && (
              <>
                <Sparkle x={6}   y={70}  delay={0}    size={11} />
                <Sparkle x={175} y={55}  delay={0.55} size={9}  />
                <Sparkle x={10}  y={170} delay={1.15} size={8}  />
                <Sparkle x={178} y={150} delay={0.75} size={10} />
                <Sparkle x={88}  y={8}   delay={1.5}  size={12} />
                <Sparkle x={140} y={200} delay={0.35} size={7}  />
              </>
            )}

            {/* Sprinty with breathing animation */}
            <motion.div
              animate={prefersRed ? {} : {
                scale: isPending ? [1, 1, 1] : [1, 1.022, 1],
                rotate: isPending ? [-1.5, 1.5, -1.5] : [0, 0, 0],
              }}
              transition={isPending
                ? { duration: 0.35, repeat: Infinity, ease: 'linear' }
                : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <Sprinty3D width={200} />
            </motion.div>
          </div>

          {/* Sprinty stands on a wooden plank */}
          <WoodenPlank>
            {/* Invisible spacer – plank appears directly under the mascot above */}
            <div style={{ height: 0 }} />
          </WoodenPlank>

          {/* Welcome badge */}
          <motion.div
            className="mt-4 px-5 py-2 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #c8a06b 0%, #a07048 40%, #8a5e34 100%)',
              borderRadius: 14,
              boxShadow: [
                '0 4px 14px rgba(92,48,10,0.38)',
                'inset 0 1.5px 0 rgba(255,255,255,0.28)',
                'inset 0 -2px 4px rgba(0,0,0,0.18)',
              ].join(', '),
              border: '2px solid rgba(255,255,255,0.14)',
            }}
          >
            {/* Wood-grain texture */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.04) 5px, rgba(0,0,0,0.04) 6px)',
            }} />
            <span
              className="relative text-sm font-black"
              style={{
                color: '#fff9f0',
                textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                fontFamily: 'var(--font-serif)',
                letterSpacing: '0.01em',
              }}
            >
              Bentornato su NutriTrack!
            </span>
          </motion.div>
        </motion.div>

        {/* ── 3D glossy title ── */}
        <motion.div className="text-center mb-2" variants={itemVariants}>
          <h1
            className="font-serif font-black leading-none select-none"
            style={{
              fontSize: 44,
              background: 'linear-gradient(180deg, #a3c45a 0%, #88b04b 35%, #5a7a1e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: [
                'drop-shadow(0 3px 0 rgba(74,101,22,0.55))',
                'drop-shadow(0 6px 10px rgba(74,101,22,0.22))',
              ].join(' '),
            }}
          >
            NutriTrack
          </h1>
          <p className="text-sm font-semibold mt-1" style={{ color: '#8b6a3e' }}>
            Il tuo diario nutrizionale
          </p>
        </motion.div>

        {/* ── Tab switcher ── */}
        <motion.div variants={itemVariants} className="mb-5 mt-4">
          <TabSwitcher tab={tab} onChange={changeTab} />
        </motion.div>

        {/* ── Form card ── */}
        <motion.div variants={itemVariants}>
          <ClayCard elevated className="p-6">

            {/* Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="px-3 py-2 rounded-2xl text-sm font-semibold"
                  style={{
                    background: '#fff0eb',
                    border: '1.5px solid #fca5a5',
                    color: '#b91c1c',
                    boxShadow: 'inset 0 2px 5px rgba(185,28,28,0.07)',
                  }}
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="px-3 py-2 rounded-2xl text-sm font-semibold"
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

            {/* Staggered form fields */}
            <motion.form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              key={tab}              // re-run stagger when tab changes
            >
              {/* Name – register only */}
              <AnimatePresence>
                {tab === 'register' && (
                  <motion.div
                    key="name-field"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  >
                    <ClayInput
                      id="reg-name"
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
              <motion.div variants={itemVariants}>
                <ClayInput
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="nome@esempio.it"
                  label="Email"
                  required
                  autoComplete="email"
                  icon={<Carrot3D size={24} />}
                />
              </motion.div>

              {/* Password */}
              {tab !== 'forgot' && (
                <motion.div variants={itemVariants}>
                  <ClayInput
                    id="auth-pass"
                    type="password"
                    value={pass}
                    onChange={setPass}
                    placeholder={tab === 'register' ? 'Min. 6 caratteri' : '••••••••'}
                    label="Password"
                    required
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    minLength={6}
                    icon={<KeyIcon3D size={24} />}
                  />
                </motion.div>
              )}

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <ClayButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isPending}
                  disabled={isPending}
                >
                  {tab === 'login'
                    ? 'Accedi'
                    : tab === 'register'
                    ? 'Crea account'
                    : 'Invia link di reset'}
                </ClayButton>
              </motion.div>
            </motion.form>

            {/* Forgot / back link */}
            <div className="mt-4 flex justify-center">
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => changeTab('forgot')}
                  className="text-xs font-semibold underline underline-offset-2 transition-colors hover:opacity-80"
                  style={{ color: '#a08060', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Password dimenticata?
                </button>
              )}
              {tab === 'forgot' && (
                <button
                  type="button"
                  onClick={() => changeTab('login')}
                  className="text-xs font-semibold underline underline-offset-2 transition-colors hover:opacity-80"
                  style={{ color: '#a08060', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Torna al login
                </button>
              )}
            </div>
          </ClayCard>
        </motion.div>

        {/* ── Google sign-in ── */}
        {tab !== 'forgot' && (
          <motion.div variants={itemVariants} className="mt-5">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(160,120,60,0.22)' }} />
              <span className="text-xs font-semibold" style={{ color: '#b09070' }}>oppure</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(160,120,60,0.22)' }} />
            </div>
            <ClayButton
              type="button"
              variant="secondary"
              fullWidth
              disabled={isPending}
              onClick={doGoogle}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ marginRight: 6 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continua con Google
            </ClayButton>
          </motion.div>
        )}

      </motion.div>
    </main>
  );
}
