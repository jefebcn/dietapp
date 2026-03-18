'use client';

/**
 * /app/dashboard/error.tsx  –  Error boundary for the dashboard route
 */

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-6"
      style={{
        background: 'linear-gradient(160deg, #EEF2FF 0%, #F5F0FF 40%, #ECFDF5 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <span className="text-6xl">😵</span>

      <div
        className="p-6 rounded-3xl space-y-2"
        style={{
          background: 'linear-gradient(145deg, #FFF1F2, #FFE4E6)',
          border: '2.5px solid #FECDD3',
          boxShadow: '0 6px 0 #BE123C, 0 10px 28px rgba(190,18,60,0.15)',
          maxWidth: 360,
        }}
      >
        <h2 className="text-xl font-black" style={{ color: '#881337' }}>
          Qualcosa è andato storto 😓
        </h2>
        <p className="text-sm font-bold" style={{ color: '#BE123C', opacity: 0.85 }}>
          {error.message || 'Si è verificato un errore imprevisto. Riprova tra qualche istante.'}
        </p>
        {error.digest && (
          <p className="text-xs font-mono" style={{ color: '#9F1239' }}>Codice: {error.digest}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="font-extrabold px-5 py-2.5 rounded-full text-sm"
          style={{
            background: 'linear-gradient(145deg, #818CF8, #6366F1)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 5px 0 #3730A3',
            cursor: 'pointer',
          }}
        >
          Riprova
        </button>
        <a
          href="/"
          className="font-extrabold px-5 py-2.5 rounded-full text-sm"
          style={{
            background: 'linear-gradient(145deg, #EEF2FF, #E0E7FF)',
            color: '#3730A3',
            border: '2px solid #A5B4FC',
            boxShadow: '0 5px 0 #4338CA',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Home
        </a>
      </div>
    </div>
  );
}
