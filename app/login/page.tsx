'use client';

/**
 * Login / Register  –  Claymorphic 3D Soft-UI
 *
 * Assets from /public:
 *   /sprinty.png   – avocado mascot (breathing animation, sits on pedestal)
 *   /pedestal.png  – wooden block plinth under Sprinty
 *   /apple.png     – floating decoration, top-left
 *   /olives.png    – floating decoration, bottom-left, blur-[2px]
 *   /spatula.png   – floating decoration, top-right, rotated
 *
 * Design:
 *   bg #f7f3e9 · card bg #f0ede4 · rounded-[2.5rem]
 *   Multi-layer clay box-shadow (dark depth + white top-left highlight)
 *   Framer Motion: y [0,-15,0] floats · staggered form entrance · breathing mascot
 *
 * Auth (already live):
 *   POST /api/login  →  7-day HttpOnly __session cookie
 *   AuthProvider     →  onIdTokenChanged keeps cookie fresh every hour
 *   middleware.ts    →  Edge JWT-expiry guard on every request
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

// ── Error map ────────────────────────────────────────────────────────────────

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

// ── Animation variants ───────────────────────────────────────────────────────

const FLOAT = (delay = 0, yAmt = 15, duration = 4) => ({
  animate: {
    y: [0, -yAmt, 0],
    transition: { duration, repeat: Infinity, ease: 'easeInOut' as const, delay },
  },
});

const stagger: Variants = {
  hidden:  {},
  show:    { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  show:    { opacity: 1, y: 0,  scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 24 } },
};

// ── Clay design tokens ────────────────────────────────────────────────────────

/** Multi-layer claymorphic box-shadow.
 *  dark spread bottom-right + bright white top-left highlight */
const CLAY_SHADOW =
  '6px 6px 24px rgba(160,120,70,0.22), ' +
  '-4px -4px 14px rgba(255,255,255,0.82), ' +
  'inset 0 1.5px 0 rgba(255,255,255,0.70)';

const CLAY_SHADOW_DEEP =
  '8px 8px 32px rgba(140,100,50,0.26), ' +
  '-5px -5px 18px rgba(255,255,255,0.88), ' +
  'inset 0 2px 0 rgba(255,255,255,0.75)';

// ── Sub-components ───────────────────────────────────────────────────────────

/** Floating food decoration */
function FloatProp({
  src,
  alt,
  width,
  height,
  style,
  floatDelay = 0,
  floatY = 15,
  blur = false,
  rotate = 0,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  floatDelay?: number;
  floatY?: number;
  blur?: boolean;
  rotate?: number;
}) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        filter: blur ? 'blur(2px)' : undefined,
        ...style,
      }}
      animate={{ y: [0, -floatY, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, objectFit: 'contain' }}
        priority={false}
        unoptimized
      />
    </motion.div>
  );
}

/** Claymorphic input field */
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
      <label htmlFor={id} className="block text-sm font-bold mb-1.5" style={{ color: '#5c3d1a' }}>
        {label}
      </label>
      <div
        style={{
          borderRadius: '1rem',
          background: 'linear-gradient(160deg, #fdfaf4 0%, #f7f2e8 100%)',
          boxShadow: focused
            ? 'inset 0 3px 10px rgba(100,65,20,0.15), 0 0 0 2.5px #88b04b'
            : 'inset 0 3px 10px rgba(100,65,20,0.13), -2px -2px 6px rgba(255,255,255,0.75)',
          border: '1.5px solid rgba(190,155,95,0.28)',
          transition: 'box-shadow 0.2s',
          position: 'relative',
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
            padding: '12px 44px 12px 16px',
            fontSize: 14,
            color: '#4a2e0a',
            outline: 'none',
            borderRadius: '1rem',
            caretColor: '#88b04b',
          }}
        />
        {icon && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

/** Avocado-green clay pill button */
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
        opacity: disabled ? 0.62 : 1,
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        background: primary
          ? 'linear-gradient(180deg, #a3c45a 0%, #88b04b 45%, #6b8e23 100%)'
          : 'linear-gradient(180deg, #fdfaf4 0%, #ede4d0 100%)',
        color: primary ? '#fff' : '#5c3d1a',
        boxShadow: primary
          ? '0 5px 0 #4d6618, 0 8px 22px rgba(107,142,35,0.38), inset 0 1.5px 0 rgba(255,255,255,0.32)'
          : `${CLAY_SHADOW}`,
        textShadow: primary ? '0 1px 2px rgba(0,0,0,0.22)' : 'none',
      }}
      whileHover={!disabled ? { scale: 1.025, y: -1 } : {}}
      whileTap={
        !disabled
          ? {
              scale: 0.97,
              y: primary ? 4 : 2,
              boxShadow: primary
                ? '0 1px 0 #4d6618, 0 3px 10px rgba(107,142,35,0.30), inset 0 1.5px 0 rgba(255,255,255,0.32)'
                : '2px 2px 8px rgba(140,100,50,0.18), -2px -2px 6px rgba(255,255,255,0.72)',
            }
          : {}
      }
      transition={{ type: 'spring', stiffness: 460, damping: 26 }}
    >
      {/* Sheen */}
      {primary && (
        <span aria-hidden style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '44%',
          borderRadius: '0 0 50% 50%',
          background: 'rgba(255,255,255,0.24)',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {loading
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Attendere…
            </span>
          : children}
      </span>
    </motion.button>
  );
}

/** Neumorphic tab pill */
function Tabs({ tab, onChange }: { tab: string; onChange: (t: 'login' | 'register') => void }) {
  return (
    <div style={{
      display: 'flex', padding: 6, borderRadius: 50,
      background: 'linear-gradient(180deg, #e8e0d0 0%, #ddd4c0 100%)',
      boxShadow: 'inset 0 3px 8px rgba(100,70,20,0.18), inset 0 -1px 0 rgba(255,255,255,0.60)',
    }}>
      {(['login', 'register'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 40, border: 'none',
            background: 'transparent', cursor: 'pointer', position: 'relative',
            fontWeight: 700, fontSize: 14,
            color: tab === t ? '#3d2208' : '#9a7350',
          }}
        >
          {tab === t && (
            <motion.span
              layoutId="tab-bg"
              style={{
                position: 'absolute', inset: 0, borderRadius: 40,
                background: 'linear-gradient(180deg, #fdfaf5 0%, #f2e9d8 100%)',
                boxShadow: '0 3px 12px rgba(100,70,20,0.20), inset 0 1px 0 rgba(255,255,255,0.85)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
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

// ── Page ─────────────────────────────────────────────────────────────────────

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
      await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: c.user.uid, email, name, idToken: await c.user.getIdToken() }) });
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
      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main style={{
        minHeight: '100vh',
        background: '#f7f3e9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 20,
        paddingBottom: 48,
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-sans)',
      }}>

        {/* ── Depth-of-field floating decorations ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} aria-hidden="true">

          {/* Apple – top-left, sharpest (closest) */}
          <FloatProp
            src="/apple.png" alt="" width={130} height={140}
            style={{ left: -18, top: 48 }}
            floatDelay={0} floatY={15}
          />

          {/* Olives – bottom-left, blurred (mid distance) */}
          <FloatProp
            src="/olives.png" alt="" width={110} height={90}
            style={{ left: -6, bottom: 80 }}
            floatDelay={0.8} floatY={12} blur
          />

          {/* Spatula – top-right, rotated */}
          <FloatProp
            src="/spatula.png" alt="" width={100} height={180}
            style={{ right: -10, top: 30 }}
            floatDelay={0.4} floatY={15} rotate={-15}
          />
        </div>

        {/* ── Content column ── */}
        <motion.div
          style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 380, padding: '0 16px' }}
          variants={stagger}
          initial="hidden"
          animate="show"
        >

          {/* ── Mascot + Pedestal ── */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}
          >
            {/* Sprinty – breathing scale animation */}
            <motion.div
              animate={prefersReduced ? {} : isPending
                ? { x: [0, 4, -4, 4, 0], transition: { duration: 0.4, repeat: Infinity } }
                : { scale: [1, 1.022, 1], transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } }
              }
            >
              <Image
                src="/sprinty.png"
                alt="Sprinty, la mascotte avocado di NutriTrack"
                width={200}
                height={240}
                style={{ objectFit: 'contain', display: 'block' }}
                priority
                unoptimized
              />
            </motion.div>

            {/* Pedestal – sits directly below Sprinty, overlaps feet */}
            <div style={{ marginTop: -22, position: 'relative', zIndex: -1 }}>
              <Image
                src="/pedestal.png"
                alt=""
                width={240}
                height={90}
                style={{ objectFit: 'contain', display: 'block' }}
                priority
                unoptimized
              />
            </div>
          </motion.div>

          {/* ── Welcome badge ── */}
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{
              background: 'linear-gradient(135deg, #c8a06b 0%, #a07048 40%, #8a5e34 100%)',
              borderRadius: 14,
              padding: '8px 22px',
              boxShadow: '0 4px 14px rgba(92,48,10,0.36), inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 -2px 4px rgba(0,0,0,0.18)',
              border: '2px solid rgba(255,255,255,0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Wood grain */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 12,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.04) 5px, rgba(0,0,0,0.04) 6px)',
              }} />
              <span style={{
                position: 'relative', fontFamily: 'var(--font-serif)',
                fontWeight: 900, fontSize: 14, color: '#fff9f0',
                textShadow: '0 1px 3px rgba(0,0,0,0.44)', letterSpacing: '0.01em',
              }}>
                Bentornato su NutriTrack!
              </span>
            </div>
          </motion.div>

          {/* ── 3D title ── */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 4 }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 46,
              lineHeight: 1, margin: 0, userSelect: 'none',
              background: 'linear-gradient(180deg, #a8c85e 0%, #88b04b 38%, #5a7a1e 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 3px 0 rgba(70,100,14,0.52)) drop-shadow(0 6px 12px rgba(70,100,14,0.20))',
            }}>
              NutriTrack
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: '#8b6a3e' }}>
              Il tuo diario nutrizionale
            </p>
          </motion.div>

          {/* ── Tab switcher ── */}
          <motion.div variants={fadeUp} style={{ marginTop: 20, marginBottom: 16 }}>
            <Tabs tab={tab} onChange={switchTab} />
          </motion.div>

          {/* ── Claymorphic form card ── */}
          <motion.div variants={fadeUp}>
            <div style={{
              background: '#f0ede4',
              borderRadius: '2.5rem',
              padding: '28px 24px 24px',
              boxShadow: CLAY_SHADOW_DEEP,
              border: '1.5px solid rgba(210,185,140,0.28)',
            }}>

              {/* Alerts */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div key="err"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 16, background: '#fff0eb', border: '1.5px solid #fca5a5', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}
                  >{error}</motion.div>
                )}
                {success && (
                  <motion.div key="ok"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 16, background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d', fontSize: 13, fontWeight: 600 }}
                  >{success}</motion.div>
                )}
              </AnimatePresence>

              {/* Staggered form fields */}
              <motion.form
                onSubmit={submit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                variants={stagger} initial="hidden" animate="show"
                key={tab}
              >
                {/* Name (register) */}
                <AnimatePresence>
                  {tab === 'register' && (
                    <motion.div key="name" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, height: 0 }}>
                      <ClayField id="name" type="text" label="Nome" value={name} onChange={setName}
                        placeholder="Il tuo nome" required autoComplete="name" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <motion.div variants={fadeUp}>
                  <ClayField id="email" type="email" label="Email" value={email} onChange={setEmail}
                    placeholder="nome@esempio.it" required autoComplete="email"
                    icon={<span style={{ fontSize: 18 }}>🥕</span>}
                  />
                </motion.div>

                {/* Password */}
                {tab !== 'forgot' && (
                  <motion.div variants={fadeUp}>
                    <ClayField id="pass" type="password" label="Password" value={pass} onChange={setPass}
                      placeholder={tab === 'register' ? 'Min. 6 caratteri' : '••••••••'}
                      required autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      minLength={6}
                      icon={<span style={{ fontSize: 18 }}>🔑</span>}
                    />
                  </motion.div>
                )}

                {/* Submit */}
                <motion.div variants={fadeUp}>
                  <ClayButton type="submit" variant="primary" fullWidth loading={isPending} disabled={isPending}>
                    {tab === 'login' ? 'Accedi' : tab === 'register' ? 'Crea account' : 'Invia link di reset'}
                  </ClayButton>
                </motion.div>
              </motion.form>

              {/* Forgot / back */}
              <div style={{ marginTop: 14, textAlign: 'center' }}>
                {tab === 'login' && (
                  <button type="button" onClick={() => { setTab('forgot'); setError(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#a08060', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    Password dimenticata?
                  </button>
                )}
                {tab === 'forgot' && (
                  <button type="button" onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#a08060', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    Torna al login
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Google sign-in ── */}
          {tab !== 'forgot' && (
            <motion.div variants={fadeUp} style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(155,115,60,0.22)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#b09070' }}>oppure</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(155,115,60,0.22)' }} />
              </div>
              <ClayButton variant="secondary" fullWidth disabled={isPending} onClick={doGoogle}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
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

        </motion.div>
      </main>
    </>
  );
}
