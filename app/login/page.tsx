'use client';

/**
 * Login / Register  –  Claymorphic 3D Soft-UI
 *
 * Visual spec ("Image 2"):
 *   • Background: #f7f3e9 with subtle dot-grid texture
 *   • Mascot: sprinty.png centered on pedestal.png, anchored to
 *     the TOP BORDER of the login card via absolute positioning
 *   • Card: bg #f0ede4, border-radius 2.5rem, exact neumorphic shadow
 *       box-shadow: 20px 20px 60px #d9d6ce, -20px -20px 60px #ffffff,
 *                   inset 6px 6px 12px rgba(255,255,255,0.8)
 *   • Floating food props: apple / olives / spatula in corners,
 *       filter: blur(1.5px), opacity: 0.9, Framer Motion y-float
 *
 * Auth flow:
 *   POST /api/login  →  7-day HttpOnly __session cookie (firebase-admin)
 *   AuthProvider     →  onIdTokenChanged keeps cookie fresh hourly
 *   middleware.ts    →  Edge JWT-expiry guard on every protected route
 */

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
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

// ── Error map ─────────────────────────────────────────────────────────────────

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
const authError = (code: string) => ERR[code] ?? 'Si è verificato un errore. Riprova.';

async function mintSession(idToken: string) {
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!r.ok) throw new Error('Session error');
}

// ── Design tokens ─────────────────────────────────────────────────────────────

/** Exact neumorphic clay shadow per Image 2 spec */
const CARD_SHADOW =
  '20px 20px 60px #d9d6ce, ' +
  '-20px -20px 60px #ffffff, ' +
  'inset 6px 6px 12px rgba(255,255,255,0.8)';

const FIELD_SHADOW_IDLE =
  'inset 4px 4px 8px rgba(180,150,100,0.14), ' +
  'inset -3px -3px 6px rgba(255,255,255,0.72)';
const FIELD_SHADOW_FOCUS =
  'inset 4px 4px 8px rgba(180,150,100,0.14), ' +
  'inset -3px -3px 6px rgba(255,255,255,0.72), ' +
  '0 0 0 2.5px #88b04b';

const BTN_SHADOW_IDLE =
  '0 6px 0 #4d6618, 0 9px 24px rgba(107,142,35,0.38), ' +
  'inset 0 1.5px 0 rgba(255,255,255,0.30)';
const BTN_SHADOW_PRESS =
  '0 2px 0 #4d6618, 0 3px 12px rgba(107,142,35,0.28), ' +
  'inset 0 1.5px 0 rgba(255,255,255,0.30)';

// ── Framer Motion variants ─────────────────────────────────────────────────────

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show:   {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 340, damping: 26 },
  },
};

// ── FloatProp ─────────────────────────────────────────────────────────────────
// Floating food decoration using the real PNG from /public.
// Outer div: fixed position + rotation (non-animated to avoid transform conflict).
// Inner motion.div: handles the y-float animation.

function FloatProp({
  src,
  alt = '',
  width,
  height,
  posStyle,
  delay = 0,
  yAmt = 14,
  rotate = 0,
}: {
  src: string;
  alt?: string;
  width: number;
  height: number;
  posStyle: React.CSSProperties;
  delay?: number;
  yAmt?: number;
  rotate?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...posStyle,
      }}
    >
      <motion.div
        style={{ filter: 'blur(1.5px)', opacity: 0.9 }}
        animate={{ y: [0, -yAmt, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ display: 'block', objectFit: 'contain' }}
          priority={false}
          unoptimized
        />
      </motion.div>
    </div>
  );
}

// ── ClayField ─────────────────────────────────────────────────────────────────

function ClayField({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required,
  icon,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#5c3d1a' }}
      >
        {label}
      </label>
      <div
        style={{
          position: 'relative',
          borderRadius: '1rem',
          background: 'linear-gradient(145deg, #fdfaf4 0%, #f5efe0 100%)',
          boxShadow: focused ? FIELD_SHADOW_FOCUS : FIELD_SHADOW_IDLE,
          border: focused ? '1.5px solid rgba(136,176,75,0.45)' : '1.5px solid rgba(190,155,95,0.22)',
          transition: 'box-shadow 0.18s, border-color 0.18s',
        }}
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            background: 'transparent',
            padding: icon ? '12px 44px 12px 16px' : '12px 16px',
            fontSize: 14,
            color: '#4a2e0a',
            outline: 'none',
            borderRadius: '1rem',
            caretColor: '#88b04b',
          }}
        />
        {icon && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 18 }}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

// ── ClayButton ─────────────────────────────────────────────────────────────────

function ClayButton({
  children,
  onClick,
  type = 'button',
  disabled,
  loading,
  variant = 'primary',
  fullWidth,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}) {
  const primary = variant === 'primary';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: fullWidth ? '100%' : undefined,
        borderRadius: 50,
        padding: '14px 28px',
        fontWeight: 900,
        fontSize: 15,
        letterSpacing: '0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        background: primary
          ? 'linear-gradient(180deg, #aac85e 0%, #88b04b 48%, #6b8e23 100%)'
          : 'linear-gradient(180deg, #fdfaf4 0%, #ede4d0 100%)',
        color: primary ? '#fff' : '#5c3d1a',
        boxShadow: primary
          ? BTN_SHADOW_IDLE
          : '6px 6px 14px #d9d6ce, -6px -6px 14px #ffffff',
        textShadow: primary ? '0 1px 2px rgba(0,0,0,0.25)' : 'none',
      }}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.97, y: primary ? 4 : 2,
        boxShadow: primary ? BTN_SHADOW_PRESS : '3px 3px 8px #d9d6ce, -3px -3px 8px #ffffff',
      } : {}}
      transition={{ type: 'spring', stiffness: 480, damping: 28 }}
    >
      {/* Glass sheen for primary */}
      {primary && (
        <span aria-hidden style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: '46%',
          borderRadius: '0 0 50% 50%',
          background: 'rgba(255,255,255,0.22)',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{
              width: 16, height: 16,
              border: '2.5px solid rgba(255,255,255,0.35)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Attendere…
          </span>
        ) : children}
      </span>
    </motion.button>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function Tabs({ tab, onChange }: { tab: string; onChange: (t: 'login' | 'register') => void }) {
  return (
    <div style={{
      display: 'flex', padding: 5, borderRadius: 50,
      background: 'linear-gradient(145deg, #e4ddd0 0%, #d8d0c0 100%)',
      boxShadow: 'inset 4px 4px 10px rgba(100,70,20,0.16), inset -3px -3px 6px rgba(255,255,255,0.55)',
    }}>
      {(['login', 'register'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 40, border: 'none',
            background: 'transparent', cursor: 'pointer', position: 'relative',
            fontWeight: 700, fontSize: 14,
            color: tab === t ? '#3d2208' : '#9a7350',
            transition: 'color 0.15s',
          }}
        >
          {tab === t && (
            <motion.span
              layoutId="tab-active"
              style={{
                position: 'absolute', inset: 0, borderRadius: 40,
                background: 'linear-gradient(145deg, #fdfaf6 0%, #f0e8d5 100%)',
                boxShadow: '4px 4px 12px rgba(100,70,20,0.18), -3px -3px 8px rgba(255,255,255,0.80)',
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router         = useRouter();
  const prefersReduced = useReducedMotion();

  const [tab,     setTab]     = useState<'login' | 'register' | 'forgot'>('login');
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
    getRedirectResult(getClientAuth()).then(async (r) => {
      if (r?.user) { await mintSession(await r.user.getIdToken()); router.push('/dashboard'); }
    }).catch(() => {});
  }, []);

  const go = async (token: string) => { await mintSession(token); router.push('/dashboard'); };

  const doLogin = () => startTransition(async () => {
    setError('');
    try { const c = await signInWithEmailAndPassword(getClientAuth(), email, pass); await go(await c.user.getIdToken()); }
    catch (e: any) { setError(authError(e.code)); }
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
    } catch (e: any) { setError(authError(e.code)); }
  });

  const doGoogle = () => startTransition(async () => {
    setError('');
    try {
      if (isMobile) { await signInWithRedirect(getClientAuth(), googleProvider); }
      else { const c = await signInWithPopup(getClientAuth(), googleProvider); await go(await c.user.getIdToken()); }
    } catch (e: any) { setError(authError(e.code)); }
  });

  const doForgot = () => startTransition(async () => {
    setError(''); setSuccess('');
    try { await sendPasswordResetEmail(getClientAuth(), email); setSuccess(`Email inviata a ${email}.`); }
    catch (e: any) { setError(authError(e.code)); }
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main
        style={{
          minHeight: '100vh',
          background: '#f7f3e9',
          position: 'relative',
          overflowX: 'hidden',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* ── Dot-grid texture ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'radial-gradient(rgba(170,130,70,0.09) 1.5px, transparent 1.5px)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* ── Floating food props (fixed, corners) ── */}

        {/* Apple – top-left */}
        <FloatProp
          src="/apple.png" width={130} height={140}
          posStyle={{ top: 60, left: -18 }}
          delay={0} yAmt={14}
        />

        {/* Olives – bottom-left */}
        <FloatProp
          src="/olives.png" width={110} height={90}
          posStyle={{ bottom: 80, left: -8 }}
          delay={0.9} yAmt={12}
        />

        {/* Spatula – top-right, rotated */}
        <FloatProp
          src="/spatula.png" width={88} height={170}
          posStyle={{ top: 28, right: -8 }}
          delay={0.45} yAmt={14}
          rotate={-15}
        />

        {/* ── Content column ── */}
        <div
          style={{
            position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minHeight: '100vh',
            paddingBottom: 56,
            // Top padding creates visual space between viewport top and mascot
            paddingTop: 24,
          }}
        >

          {/*
            ── Card + Mascot wrapper ──
            position: relative so the mascot's `bottom: 100%` is relative to this div.
            The wrapper's top padding (~290px) reserves visual space for the mascot
            that floats above the card via `bottom: 100%` absolute positioning.
          */}
          <motion.div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 400,
              padding: '0 18px',
              paddingTop: 290,   // height reserved for sprinty (220) + pedestal (88) – overlap (22) + buffer
            }}
            variants={stagger}
            initial="hidden"
            animate="show"
          >

            {/* ── Mascot + Pedestal anchored to card's top border ── */}
            <div
              style={{
                position: 'absolute',
                // bottom: 100% means: the GROUP's bottom edge = the card's top border
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // We shift down by paddingTop so the pedestal bottom aligns with card top
                marginBottom: -290,
                paddingBottom: 290,
                zIndex: 20,
                pointerEvents: 'none',
              }}
            >
              {/* Sprinty – breathing + shake-on-loading */}
              <motion.div
                animate={
                  prefersReduced ? {} : isPending
                    ? { x: [0, 5, -5, 5, -5, 0], transition: { duration: 0.45, repeat: Infinity } }
                    : { scale: [1, 1.022, 1], transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } }
                }
              >
                <Image
                  src="/sprinty.png"
                  alt="Sprinty, la mascotte avocado di NutriTrack"
                  width={200}
                  height={240}
                  style={{ display: 'block', objectFit: 'contain' }}
                  priority
                  unoptimized
                />
              </motion.div>

              {/* Pedestal – overlaps Sprinty's feet, bottom edge = card top */}
              <div style={{ marginTop: -22 }}>
                <Image
                  src="/pedestal.png"
                  alt=""
                  width={240}
                  height={90}
                  style={{ display: 'block', objectFit: 'contain' }}
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* ── Claymorphic card ── */}
            <div
              style={{
                background: '#f0ede4',
                borderRadius: '2.5rem',         // 40px
                boxShadow: CARD_SHADOW,
                border: '1.5px solid rgba(215,200,170,0.30)',
                padding: '28px 24px 28px',
                position: 'relative',
                zIndex: 10,
              }}
            >

              {/* NutriTrack heading */}
              <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 4 }}>
                <h1 style={{
                  fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 40,
                  lineHeight: 1, margin: 0, userSelect: 'none',
                  background: 'linear-gradient(180deg, #b4d06a 0%, #88b04b 38%, #5a7a1e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 3px 0 rgba(60,90,14,0.40)) drop-shadow(0 5px 12px rgba(60,90,14,0.15))',
                }}>
                  NutriTrack
                </h1>
                <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600, color: '#8b6a3e' }}>
                  Il tuo diario nutrizionale
                </p>
              </motion.div>

              {/* Tab switcher */}
              <motion.div variants={fadeUp} style={{ marginTop: 18, marginBottom: 18 }}>
                <Tabs tab={tab} onChange={switchTab} />
              </motion.div>

              {/* Error / success alerts */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div key="err"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 14,
                      background: '#fff0eb', border: '1.5px solid #fca5a5', color: '#b91c1c',
                      fontSize: 13, fontWeight: 600, overflow: 'hidden' }}
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div key="ok"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 14,
                      background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d',
                      fontSize: 13, fontWeight: 600, overflow: 'hidden' }}
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Staggered form */}
              <motion.form
                onSubmit={submit}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                variants={stagger} initial="hidden" animate="show"
                key={tab}
              >
                {/* Name (register only) */}
                <AnimatePresence>
                  {tab === 'register' && (
                    <motion.div key="name-field" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, height: 0 }}>
                      <ClayField id="name" type="text" label="Nome" value={name} onChange={setName}
                        placeholder="Il tuo nome" required autoComplete="name" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <motion.div variants={fadeUp}>
                  <ClayField id="email" type="email" label="Email" value={email} onChange={setEmail}
                    placeholder="nome@esempio.it" required autoComplete="email"
                    icon="🥕"
                  />
                </motion.div>

                {/* Password */}
                {tab !== 'forgot' && (
                  <motion.div variants={fadeUp}>
                    <ClayField id="pass" type="password" label="Password" value={pass} onChange={setPass}
                      placeholder={tab === 'register' ? 'Min. 6 caratteri' : '••••••••'}
                      required autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      minLength={6}
                      icon="🔑"
                    />
                  </motion.div>
                )}

                {/* Submit */}
                <motion.div variants={fadeUp}>
                  <ClayButton type="submit" variant="primary" fullWidth loading={isPending} disabled={isPending}>
                    {tab === 'login'    ? 'Accedi'
                     : tab === 'register' ? 'Crea account'
                     : 'Invia link di reset'}
                  </ClayButton>
                </motion.div>
              </motion.form>

              {/* Forgot / back links */}
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                {tab === 'login' && (
                  <button type="button"
                    onClick={() => { setTab('forgot'); setError(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, color: '#a08060',
                      textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Password dimenticata?
                  </button>
                )}
                {tab === 'forgot' && (
                  <button type="button"
                    onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, color: '#a08060',
                      textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Torna al login
                  </button>
                )}
              </div>

              {/* Google sign-in */}
              {tab !== 'forgot' && (
                <motion.div variants={fadeUp} style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(155,115,60,0.20)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#b09070' }}>oppure</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(155,115,60,0.20)' }} />
                  </div>
                  <ClayButton variant="secondary" fullWidth disabled={isPending} onClick={doGoogle}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continua con Google
                    </span>
                  </ClayButton>
                </motion.div>
              )}

            </div>{/* end card */}
          </motion.div>{/* end card+mascot wrapper */}
        </div>{/* end content column */}
      </main>
    </>
  );
}
