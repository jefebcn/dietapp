'use client';

/**
 * Login – Puffy UI / Claymorphic · Full spec implementation
 *
 * Visual tokens:
 *   Page bg          : animated linear-gradient from #f7f3e9 (cream) → soft blush
 *   Card bg          : rgba(255,255,255,0.60) — bg-white/60 equivalent
 *   Card blur        : backdrop-blur-xl (24px)
 *   Card shadow      : 34px outer drop shadow (68px blur) + dark bottom-right inner
 *                      + light top-left inner glow
 *   Card radius      : rounded-[50px]
 *   Food props       : next/image + blur-[1.5px] + opacity-90 (floating)
 *   Mascot           : sprinty.png on top of pedestal.png, anchored above card
 *   Interactive els  : CSS translateY floating keyframes
 *
 * Auth persistence:
 *   POST /api/login → 7-day HttpOnly __session cookie (firebase-admin)
 *   AuthProvider    → onIdTokenChanged keeps cookie fresh every hour
 *   proxy.ts        → Edge session guard (re-exported as middleware.ts)
 */

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
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
  'auth/user-not-found':         'Nessun account trovato con questa email.',
  'auth/wrong-password':         'Password errata. Riprova.',
  'auth/invalid-credential':     'Credenziali non valide. Riprova.',
  'auth/email-already-in-use':   'Questa email è già registrata.',
  'auth/weak-password':          'La password deve avere almeno 6 caratteri.',
  'auth/too-many-requests':      'Troppi tentativi. Attendi qualche minuto.',
  'auth/popup-closed-by-user':   'Accesso annullato.',
  'auth/network-request-failed': 'Errore di rete. Controlla la connessione.',
};
const authErr = (code: string) => ERR[code] ?? 'Si è verificato un errore. Riprova.';

async function mintSession(idToken: string) {
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!r.ok) throw new Error('session-mint-failed');
}

// ── Disney Cartoon Design tokens ─────────────────────────────────────────────

/**
 * Cartoon card: vibrant white with colorful shadow stack.
 * The "3D stamp" bottom shadow gives the card a raised, playful feel.
 */
const CARD_SHADOW = [
  '0 8px 0 rgba(21,128,61,0.60)',               // thick 3D stamp bottom
  '0 14px 40px rgba(21,128,61,0.20)',           // ambient green glow
  '-20px -20px 50px rgba(255,255,255,0.95)',    // top-left light reflection
  'inset 0 2px 0 rgba(255,255,255,0.90)',       // top highlight
].join(', ');

const FIELD_SHADOW =
  'inset 2px 2px 6px rgba(21,128,61,0.10), inset -2px -2px 4px rgba(255,255,255,0.80)';

const FIELD_SHADOW_FOCUS =
  'inset 2px 2px 6px rgba(21,128,61,0.10), inset -2px -2px 4px rgba(255,255,255,0.80), 0 0 0 3px rgba(34,197,94,0.45)';

// ── Framer variants ───────────────────────────────────────────────────────────

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.065, delayChildren: 0.04 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 360, damping: 28 } },
};

// ── FloatProp ─────────────────────────────────────────────────────────────────

function FloatProp({
  src, width, height, top, right, bottom, left, rotate = 0, delay = 0, yAmt = 13,
}: {
  src: string; width: number; height: number;
  top?: number | string; right?: number | string; bottom?: number | string; left?: number | string;
  rotate?: number; delay?: number; yAmt?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 1,
        top, right, bottom, left,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <motion.div
        className="blur-[1.5px] opacity-90"
        animate={{ y: [0, -yAmt, 0] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        <Image
          src={src} alt="" width={width} height={height}
          className="block object-contain"
          priority={false}
          unoptimized
        />
      </motion.div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function Tabs({ tab, onChange }: { tab: string; onChange: (t: 'login' | 'register') => void }) {
  return (
    <div
      style={{
        display: 'flex', padding: 5, borderRadius: 50,
        background: 'linear-gradient(145deg, #DCFCE7 0%, #BBF7D0 100%)',
        boxShadow: '0 3px 0 #16A34A, inset 0 1px 0 rgba(255,255,255,0.70)',
        border: '2px solid #86EFAC',
      }}
    >
      {(['login', 'register'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            flex: 1, padding: '11px 0', borderRadius: 40, border: 'none',
            background: 'transparent', cursor: 'pointer', position: 'relative',
            fontWeight: 900, fontSize: 14.5, letterSpacing: '0.005em',
            color: tab === t ? '#14532D' : '#166534',
            transition: 'color 0.15s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {tab === t && (
            <motion.span
              layoutId="tab-pill"
              style={{
                position: 'absolute', inset: 0, borderRadius: 40,
                background: 'linear-gradient(145deg, #FFFFFF 0%, #F0FDF4 100%)',
                boxShadow: '0 3px 0 #16A34A, inset 0 1px 0 rgba(255,255,255,0.90)',
                border: '1.5px solid #86EFAC',
              }}
              transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>
            {t === 'login' ? 'Accedi' : 'Registrati'}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── ClayField ─────────────────────────────────────────────────────────────────

function ClayField({
  id, label, type, value, onChange, placeholder, autoComplete, minLength, required, icon,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
  minLength?: number; required?: boolean; icon?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 14, fontWeight: 900, marginBottom: 8, color: '#14532D' }}
      >
        {label}
      </label>
      <div
        style={{
          position: 'relative', borderRadius: 18,
          background: 'linear-gradient(155deg, #F0FDF4 0%, #DCFCE7 100%)',
          boxShadow: focused ? FIELD_SHADOW_FOCUS : FIELD_SHADOW,
          border: `2px solid ${focused ? '#22C55E' : '#86EFAC'}`,
          transition: 'box-shadow 0.17s, border-color 0.17s',
        }}
      >
        <input
          id={id} type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          minLength={minLength} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: 'transparent',
            padding: icon ? '13px 48px 13px 16px' : '13px 16px',
            fontSize: 14.5, fontWeight: 700, color: '#14532D', outline: 'none',
            borderRadius: 18, caretColor: '#22C55E',
          }}
        />
        {icon && (
          <span
            aria-hidden
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

// ── ClayButton ────────────────────────────────────────────────────────────────

function ClayButton({
  children, onClick, type = 'button', disabled, loading, variant = 'primary', fullWidth,
}: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit';
  disabled?: boolean; loading?: boolean; variant?: 'primary' | 'secondary'; fullWidth?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <motion.button
      type={type} onClick={onClick} disabled={disabled || loading}
      style={{
        width: fullWidth ? '100%' : undefined,
        borderRadius: 50, padding: '15px 28px',
        fontWeight: 900, fontSize: 15.5, letterSpacing: '0.02em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
        border: primary ? 'none' : '2px solid #86EFAC',
        position: 'relative', overflow: 'hidden',
        background: primary
          ? 'linear-gradient(180deg, #4ADE80 0%, #22C55E 45%, #16A34A 100%)'
          : 'linear-gradient(145deg, #FFFFFF 0%, #F0FDF4 100%)',
        color: primary ? '#fff' : '#14532D',
        boxShadow: primary
          ? '0 7px 0 #14532D, 0 10px 28px rgba(20,83,45,0.35), inset 0 2px 0 rgba(255,255,255,0.30)'
          : '0 5px 0 #86EFAC, 0 8px 20px rgba(134,239,172,0.25)',
        textShadow: primary ? '0 1.5px 3px rgba(0,0,0,0.22)' : 'none',
        fontFamily: 'var(--font-sans)',
        backdropFilter: !primary ? 'blur(8px)' : undefined,
      }}
      whileHover={!disabled && !loading ? { scale: 1.015, y: -1.5 } : {}}
      whileTap={!disabled && !loading ? {
        scale: 0.97, y: primary ? 5 : 2,
        boxShadow: primary
          ? '0 2px 0 #14532D, 0 4px 14px rgba(20,83,45,0.25), inset 0 2px 0 rgba(255,255,255,0.30)'
          : '0 2px 0 #86EFAC, 0 4px 8px rgba(134,239,172,0.15)',
      } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Glass sheen – primary only */}
      {primary && (
        <span
          aria-hidden
          style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '44%',
            borderRadius: '0 0 50% 50%',
            background: 'rgba(255,255,255,0.24)',
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <span
              style={{
                width: 17, height: 17, borderRadius: '50%', display: 'inline-block',
                border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
                animation: 'spin 0.65s linear infinite',
              }}
            />
            Attendere…
          </span>
        ) : children}
      </span>
    </motion.button>
  );
}

// ── Sparkle decorations ───────────────────────────────────────────────────────

function Sparkle({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 8" width="20" height="8" aria-hidden="true" style={style}>
      <line x1="0" y1="4" x2="6"  y2="4" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="0" x2="9"  y2="8" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="4" x2="20" y2="4" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router         = useRouter();
  const prefersReduced = useReducedMotion();

  const [tab,       setTab]       = useState<'login' | 'register' | 'forgot'>('login');
  const [email,     setEmail]     = useState('');
  const [pass,      setPass]      = useState('');
  const [name,      setName]      = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [pending, startTransition] = useTransition();

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Handle Google redirect result on mobile
  useEffect(() => {
    if (!isMobile) return;
    getRedirectResult(getClientAuth()).then(async (r) => {
      if (r?.user) { await mintSession(await r.user.getIdToken()); router.push('/dashboard'); }
    }).catch(() => {});
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const go = async (token: string) => {
    await mintSession(token);
    router.push('/dashboard');
  };

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
      setSuccess(`Email di reset inviata a ${email}.`);
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
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rainbow-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-interactive {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .float-interactive {
          animation: float-interactive 3s ease-in-out infinite;
        }
      `}</style>

      {/*
        ── ROOT ─────────────────────────────────────────────────────────────
        Animated cream → blush gradient background
      */}
      <main
        className="min-h-screen overflow-x-hidden"
        style={{
          background: 'linear-gradient(-45deg, #FFFDE7, #E8F5E9, #E3F2FD, #F3E5F5, #FFF8E1)',
          backgroundSize: '400% 400%',
          animation: 'rainbow-shift 14s ease infinite',
          fontFamily: 'var(--font-sans)',
        }}
      >

        {/* ── Subtle dot-grid texture ── */}
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            backgroundImage: 'radial-gradient(rgba(34,197,94,0.10) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/*
          ── FLOATING FOOD PROPS ──────────────────────────────────────────
          position:fixed → pinned to viewport corners
          Tailwind blur-[1.5px] + opacity-90 → depth-of-field per spec
        */}

        {/* Apple – top-left */}
        <FloatProp
          src="/apple.png" width={148} height={160}
          top={80} left={-24}
          delay={0} yAmt={14}
        />

        {/* Olives – bottom-left */}
        <FloatProp
          src="/olives.png" width={118} height={96}
          bottom={90} left={-14}
          delay={0.9} yAmt={11}
        />

        {/* Spatula – top-right, tilted */}
        <FloatProp
          src="/spatula.png" width={80} height={180}
          top={20} right={-16}
          rotate={18} delay={0.45} yAmt={15}
        />

        {/* Spatula – bottom-right */}
        <FloatProp
          src="/spatula.png" width={100} height={140}
          bottom={60} right={-20}
          rotate={-30} delay={1.2} yAmt={10}
        />

        {/*
          ── CONTENT COLUMN ────────────────────────────────────────────────
        */}
        <div
          className="relative flex flex-col items-center"
          style={{ zIndex: 10, minHeight: '100vh', paddingBottom: 60, paddingTop: 16 }}
        >

          {/*
            ── CARD + MASCOT WRAPPER ─────────────────────────────────────────
            marginTop = height of the mascot group above the card.
            Mascot is position:absolute, bottom:100%, so its bottom edge
            aligns with the card's top border.
          */}
          <motion.div
            className="relative w-full"
            style={{ maxWidth: 420, padding: '0 18px', marginTop: 300 }}
            variants={stagger}
            initial="hidden"
            animate="show"
          >

            {/*
              ── MASCOT GROUP ──────────────────────────────────────────────
              Claymorphic pedestal effect: sprinty.png (character) sits on
              pedestal.png (wooden banner) with -22px overlap.
            */}
            <div
              aria-label="Sprinty, la mascotte di NutriTrack"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              {/* Pedestal shadow (Claymorphic base effect) */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 200,
                  height: 24,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(90,58,20,0.22) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                  zIndex: -1,
                }}
              />

              {/* Sprinty – breathing animation, shakes while loading */}
              <motion.div
                animate={
                  prefersReduced ? {} :
                  pending
                    ? { x: [0, 6, -6, 6, -6, 0], transition: { duration: 0.5, repeat: Infinity } }
                    : { scale: [1, 1.025, 1], transition: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' } }
                }
              >
                <Image
                  src="/sprinty.png"
                  alt="Sprinty"
                  width={210}
                  height={252}
                  className="block object-contain drop-shadow-[0_12px_28px_rgba(60,90,14,0.22)]"
                  priority
                  unoptimized
                />
              </motion.div>

              {/* Pedestal / wooden banner */}
              <div style={{ marginTop: -22 }}>
                <Image
                  src="/pedestal.png"
                  alt="Bentornato su NutriTrack!"
                  width={260}
                  height={80}
                  className="block object-contain drop-shadow-[0_4px_12px_rgba(90,58,20,0.18)]"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/*
              ── PUFFY CLAYMORPHIC CARD ────────────────────────────────────
              bg-white/60 equivalent (rgba(255,255,255,0.60))
              backdrop-blur-xl (24px blur)
              Multi-layered shadow per spec:
                - Outer: 34px offset, 68px blur drop shadow
                - Dark bottom-right inner shadow
                - Light top-left inner glow
              Border radius: 50px (rounded-[50px])
            */}
            <div
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 50,
                boxShadow: CARD_SHADOW,
                border: '3px solid #86EFAC',
                padding: '32px 26px 36px',
                position: 'relative',
                zIndex: 10,
              }}
            >

              {/* ── "NutriTrack" heading ── */}
              <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 2 }}>
                <h1
                  className="font-serif float-interactive"
                  style={{
                    fontWeight: 900, fontSize: 48, lineHeight: 1.05, margin: 0,
                    userSelect: 'none',
                    background: 'linear-gradient(180deg, #4ADE80 0%, #22C55E 40%, #14532D 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter:
                      'drop-shadow(0 4px 0 rgba(20,83,45,0.55)) ' +
                      'drop-shadow(0 7px 16px rgba(20,83,45,0.20))',
                  }}
                >
                  NutriTrack
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 800, color: '#166534' }}>
                  Il tuo diario nutrizionale 🌿
                </p>
              </motion.div>

              {/* ── Decorative gold sparkles ── */}
              <motion.div
                variants={fadeUp}
                style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '14px 0 18px' }}
              >
                <Sparkle style={{ transform: 'rotate(180deg)' }} />
                <Sparkle />
              </motion.div>

              {/* ── Tab switcher ── */}
              <motion.div variants={fadeUp} style={{ marginBottom: 22 }}>
                <Tabs tab={tab === 'forgot' ? 'login' : tab} onChange={switchTab} />
              </motion.div>

              {/* ── Error / success alerts ── */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div key="err"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginBottom: 14, padding: '10px 14px', borderRadius: 16, overflow: 'hidden',
                      background: 'rgba(255,240,235,0.85)', border: '1.5px solid #fca5a5',
                      color: '#b91c1c', fontSize: 13, fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div key="ok"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginBottom: 14, padding: '10px 14px', borderRadius: 16, overflow: 'hidden',
                      background: 'rgba(240,253,244,0.85)', border: '1.5px solid #86efac',
                      color: '#15803d', fontSize: 13, fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Form ── */}
              <motion.form
                onSubmit={submit}
                variants={stagger}
                initial="hidden"
                animate="show"
                key={tab}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Name – register only */}
                <AnimatePresence>
                  {tab === 'register' && (
                    <motion.div
                      key="name"
                      variants={fadeUp}
                      initial="hidden" animate="show" exit={{ opacity: 0, height: 0 }}
                    >
                      <ClayField
                        id="name" label="Nome" type="text" value={name} onChange={setName}
                        placeholder="Il tuo nome" autoComplete="name" required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <motion.div variants={fadeUp}>
                  <ClayField
                    id="email" label="Email" type="email" value={email} onChange={setEmail}
                    placeholder="nome@esempio.it" autoComplete="email" required
                    icon="🥕"
                  />
                </motion.div>

                {/* Password – not shown on forgot */}
                {tab !== 'forgot' && (
                  <motion.div variants={fadeUp}>
                    <ClayField
                      id="pass" label="Password" type="password" value={pass} onChange={setPass}
                      placeholder={tab === 'register' ? 'Min. 6 caratteri' : '••••••••'}
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      minLength={6} required
                      icon="🔑"
                    />
                  </motion.div>
                )}

                {/* Submit – floating interactive animation */}
                <motion.div variants={fadeUp} className="float-interactive">
                  <ClayButton type="submit" variant="primary" fullWidth loading={pending} disabled={pending}>
                    {tab === 'login'     ? 'Accedi'
                     : tab === 'register' ? 'Crea account'
                     :                      'Invia link di reset'}
                  </ClayButton>
                </motion.div>
              </motion.form>

              {/* ── Forgot / back links ── */}
              <div style={{ marginTop: 14, textAlign: 'center' }}>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setError(''); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 800, color: '#16A34A',
                      textDecoration: 'underline', textUnderlineOffset: 3,
                    }}
                  >
                    Password dimenticata?
                  </button>
                )}
                {tab === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 800, color: '#16A34A',
                      textDecoration: 'underline', textUnderlineOffset: 3,
                    }}
                  >
                    ← Torna al login
                  </button>
                )}
              </div>

              {/* ── Google sign-in ── */}
              {tab !== 'forgot' && (
                <motion.div variants={fadeUp} style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 2, background: '#BBF7D0', borderRadius: 99 }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#16A34A', whiteSpace: 'nowrap' }}>
                      oppure continua con
                    </span>
                    <div style={{ flex: 1, height: 2, background: '#BBF7D0', borderRadius: 99 }} />
                  </div>

                  <div className="float-interactive">
                    <ClayButton variant="secondary" fullWidth disabled={pending} onClick={doGoogle}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        {/* Google "G" logo */}
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </span>
                    </ClayButton>
                  </div>
                </motion.div>
              )}

            </div>{/* /card */}
          </motion.div>{/* /card+mascot wrapper */}
        </div>{/* /content column */}
      </main>
    </>
  );
}
