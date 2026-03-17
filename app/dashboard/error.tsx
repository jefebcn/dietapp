'use client';

/**
 * /app/dashboard/error.tsx  –  Error boundary for the dashboard route
 *
 * Displays Sprinty in 'error' mood with a retry button.
 * Must be a Client Component ('use client') as required by Next.js error boundaries.
 */

import { useEffect } from 'react';
import SprintyAssistant from '@/components/SprintyAssistant';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    // Log to error tracking service (e.g. Sentry) in production
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f5efe4] flex flex-col items-center justify-center px-4 text-center gap-6">
      <SprintyAssistant
        mood="error"
        size="xl"
        message="Ops! Non riesco a caricare i tuoi dati."
      />

      <div className="space-y-2">
        <h2 className="font-serif text-xl font-bold text-[#2c1f0e]">
          Qualcosa è andato storto
        </h2>
        <p className="text-sm text-[#8a7868] max-w-xs">
          {error.message || 'Si è verificato un errore imprevisto. Riprova tra qualche istante.'}
        </p>
        {error.digest && (
          <p className="text-xs text-[#8a7868] font-mono">Codice: {error.digest}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary">
          Riprova
        </button>
        <a href="/" className="btn-secondary">
          Torna alla home
        </a>
      </div>
    </div>
  );
}
