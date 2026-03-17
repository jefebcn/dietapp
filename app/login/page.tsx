'use client';

/**
 * Login / Register page
 *
 * Client Component because it uses Firebase Auth directly in the browser.
 * On successful auth the ID token is exchanged for a server-side session
 * cookie via POST /api/auth/session, then the user is redirected to /dashboard.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase-client.config';
import SprintyAssistant from '@/components/SprintyAssistant';
import type { Metadata } from 'next';

type Tab = 'login' | 'register' | 'forgot';

const ERROR_MAP: Record<string, string> = {
  'auth/invalid-email': 'Indirizzo email non valido.',
  'auth/user-not-found': 'Nessun account trovato con questa email.',
  'auth/wrong-password': 'Password errata. Riprova.',
  'auth/email-already-in-use': 'Questa email è già registrata.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/too-many-requests': 'Troppi tentativi. Attendi qualche minuto.',
  'auth/popup-closed-by-user': 'Accesso annullato.',
  'auth/network-request-failed': 'Errore di rete. Controlla la connessione.',
};

function authError(code: string): string {
  return ERROR_MAP[code] ?? 'Si è verificato un errore. Riprova.';
}

async function exchangeTokenForSession(idToken: string): Promise<void> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('Impossibile creare la sessione.');
}

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

  const handleSuccess = async (idToken: string) => {
    await exchangeTokenForSession(idToken);
    router.push('/dashboard');
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const doLogin = () =>
    startTransition(async () => {
      setError('');
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await handleSuccess(await cred.user.getIdToken());
      } catch (e: any) {
        setError(authError(e.code));
      }
    });

  // ── Register ─────────────────────────────────────────────────────────────
  const doRegister = () =>
    startTransition(async () => {
      setError('');
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });

        // Create user profile in Firestore via server action
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: cred.user.uid,
            email,
            name,
            idToken: await cred.user.getIdToken(),
          }),
        });

        await handleSuccess(await cred.user.getIdToken());
      } catch (e: any) {
        setError(authError(e.code));
      }
    });

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const doGoogle = () =>
    startTransition(async () => {
      setError('');
      try {
        if (isMobile) {
          await signInWithRedirect(auth, googleProvider);
          // getRedirectResult handled in useEffect on page load
        } else {
          const cred = await signInWithPopup(auth, googleProvider);
          await handleSuccess(await cred.user.getIdToken());
        }
      } catch (e: any) {
        setError(authError(e.code));
      }
    });

  // ── Forgot password ───────────────────────────────────────────────────────
  const doForgot = () =>
    startTransition(async () => {
      setError('');
      setSuccess('');
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccess(`Email di reset inviata a ${email}. Controlla la tua casella.`);
      } catch (e: any) {
        setError(authError(e.code));
      }
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') doLogin();
    else if (tab === 'register') doRegister();
    else doForgot();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f5efe4]">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <SprintyAssistant
            mood={isPending ? 'loading' : 'greeting'}
            size="lg"
            message={isPending ? undefined : 'Bentornato su NutriTrack!'}
          />
          <h1 className="font-serif text-3xl font-bold text-[#2c1f0e] mt-2">
            NutriTrack
          </h1>
          <p className="text-sm text-[#8a7868]">Il tuo diario nutrizionale</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-[#ede4d3] p-1 mb-6">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className={[
                'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                tab === t
                  ? 'bg-white text-[#2c1f0e] shadow-sm'
                  : 'text-[#8a7868] hover:text-[#2c1f0e]',
              ].join(' ')}
            >
              {t === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="card shadow-md">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[#fff0e8] border border-[#d4622a] text-sm text-[#d4622a] font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[#e8f3e2] border border-[#7db560] text-sm text-[#3a6b27] font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name (register only) */}
            {tab === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ddd3c4] bg-[#f5efe4] focus:outline-none focus:border-[#3a6b27] text-sm transition-colors"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-[#ddd3c4] bg-[#f5efe4] focus:outline-none focus:border-[#3a6b27] text-sm transition-colors"
              />
            </div>

            {/* Password (not shown in forgot tab) */}
            {tab !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? 'Min. 6 caratteri' : '••••••••'}
                  required
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ddd3c4] bg-[#f5efe4] focus:outline-none focus:border-[#3a6b27] text-sm transition-colors"
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending
                ? 'Attendere...'
                : tab === 'login'
                ? 'Accedi'
                : tab === 'register'
                ? 'Crea account'
                : 'Invia link di reset'}
            </button>
          </form>

          {/* Forgot / back links */}
          <div className="mt-4 flex justify-center">
            {tab === 'login' ? (
              <button
                type="button"
                onClick={() => { setTab('forgot'); setError(''); }}
                className="text-xs text-[#8a7868] hover:text-[#3a6b27] underline"
              >
                Password dimenticata?
              </button>
            ) : tab === 'forgot' ? (
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                className="text-xs text-[#8a7868] hover:text-[#3a6b27] underline"
              >
                Torna al login
              </button>
            ) : null}
          </div>
        </div>

        {/* Google sign-in */}
        {tab !== 'forgot' && (
          <div className="mt-4">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#ddd3c4]" />
              <span className="text-xs text-[#8a7868]">oppure</span>
              <div className="flex-1 h-px bg-[#ddd3c4]" />
            </div>
            <button
              type="button"
              onClick={doGoogle}
              disabled={isPending}
              className="btn-secondary w-full gap-3 disabled:opacity-60"
            >
              {/* Google icon */}
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
      </div>
    </main>
  );
}
