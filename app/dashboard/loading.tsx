/**
 * /app/dashboard/loading.tsx
 *
 * Next.js automatic loading UI – rendered while the Dashboard Server Component
 * fetches data. Sprinty runs on a treadmill while the bento grid skeletons pulse.
 * Uses the cream Claymorphic theme (#f7f3e9) consistent with the dashboard.
 */

import SprintyAssistant from '@/components/SprintyAssistant';

export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#f7f3e9' }}
    >
      {/* Skeleton header */}
      <header
        style={{
          background: 'rgba(247,243,233,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1.5px solid rgba(210,185,140,0.30)',
          boxShadow: '0 2px 12px rgba(90,58,20,0.08)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div
            className="h-3 w-28 rounded-full animate-pulse mb-2"
            style={{ background: 'rgba(90,58,20,0.10)' }}
          />
          <div
            className="h-5 w-40 rounded-full animate-pulse"
            style={{ background: 'rgba(90,58,20,0.13)' }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-10 w-full flex flex-col items-center gap-8 pb-24">
        {/* Sprinty on treadmill */}
        <SprintyAssistant
          mood="loading"
          size="xl"
          message="Sto caricando il tuo diario..."
        />

        {/* Bento skeleton grid – cream clay style */}
        <div className="w-full space-y-4">

          {/* Row 1: 2-col calorie ring + macros */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[2rem] animate-pulse"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,253,248,0.8) 0%, rgba(250,245,234,0.8) 100%)',
                  border: '1.5px solid rgba(210,185,140,0.25)',
                  boxShadow: '0 10px 32px rgba(90,58,20,0.10), inset 0 1.5px 0 rgba(255,255,255,0.70)',
                  height: 200,
                }}
              />
            ))}
          </div>

          {/* Row 2: 3-col quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[1.5rem] animate-pulse"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,253,248,0.8) 0%, rgba(250,245,234,0.8) 100%)',
                  border: '1.5px solid rgba(210,185,140,0.20)',
                  boxShadow: '0 6px 20px rgba(90,58,20,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
                  height: 80,
                }}
              />
            ))}
          </div>

          {/* Row 3: chart (col-span-2) + water (col-span-1) */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="col-span-2 rounded-[2rem] animate-pulse"
              style={{
                background: 'linear-gradient(160deg, rgba(255,253,248,0.8) 0%, rgba(250,245,234,0.8) 100%)',
                border: '1.5px solid rgba(210,185,140,0.25)',
                boxShadow: '0 10px 32px rgba(90,58,20,0.10), inset 0 1.5px 0 rgba(255,255,255,0.70)',
                height: 140,
              }}
            />
            <div
              className="col-span-1 rounded-[2rem] animate-pulse"
              style={{
                background: 'linear-gradient(160deg, rgba(255,253,248,0.8) 0%, rgba(250,245,234,0.8) 100%)',
                border: '1.5px solid rgba(210,185,140,0.25)',
                boxShadow: '0 10px 32px rgba(90,58,20,0.10), inset 0 1.5px 0 rgba(255,255,255,0.70)',
                height: 140,
              }}
            />
          </div>

          {/* Row 4: meals list skeleton */}
          <div
            className="rounded-[2rem] animate-pulse p-5 space-y-3"
            style={{
              background: 'linear-gradient(160deg, rgba(255,253,248,0.8) 0%, rgba(250,245,234,0.8) 100%)',
              border: '1.5px solid rgba(210,185,140,0.25)',
              boxShadow: '0 10px 32px rgba(90,58,20,0.10), inset 0 1.5px 0 rgba(255,255,255,0.70)',
            }}
          >
            <div
              className="h-4 rounded-full w-24"
              style={{ background: 'rgba(90,58,20,0.10)' }}
            />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3 py-2.5"
                style={{ borderBottom: '1.5px solid rgba(90,58,20,0.06)' }}
              >
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(90,58,20,0.10)' }} />
                  <div className="h-2 rounded-full w-1/2" style={{ background: 'rgba(90,58,20,0.07)' }} />
                </div>
                <div className="h-4 w-16 rounded-full" style={{ background: 'rgba(90,58,20,0.10)' }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
