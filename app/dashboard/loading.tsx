/**
 * /app/dashboard/loading.tsx
 *
 * Next.js automatic loading UI – rendered while the Dashboard Server Component
 * fetches data. Sprinty runs on a treadmill while the bento grid skeletons pulse.
 */

import SprintyAssistant from '@/components/SprintyAssistant';

export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0f172a' }}
    >
      {/* Skeleton header */}
      <header
        className="border-b border-white/8"
        style={{ background: 'rgba(15,23,42,0.80)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="h-3 w-28 bg-white/8 rounded-full animate-pulse mb-2" />
          <div className="h-5 w-40 bg-white/10 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-10 w-full flex flex-col items-center gap-8">
        {/* Sprinty on treadmill */}
        <SprintyAssistant
          mood="loading"
          size="xl"
          message="Sto caricando il tuo diario..."
        />

        {/* Bento skeleton grid */}
        <div className="w-full space-y-4">

          {/* Row 1: 2-col */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
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
                className="rounded-xl animate-pulse"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  height: 76,
                }}
              />
            ))}
          </div>

          {/* Row 3: chart + water */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="col-span-2 rounded-2xl animate-pulse"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                height: 130,
              }}
            />
            <div
              className="col-span-1 rounded-2xl animate-pulse"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                height: 130,
              }}
            />
          </div>

          {/* Row 4: meals list */}
          <div
            className="rounded-2xl animate-pulse p-4 space-y-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="h-4 bg-white/10 rounded-full w-24" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded-full w-3/4" />
                  <div className="h-2 bg-white/6 rounded-full w-1/2" />
                </div>
                <div className="h-4 w-16 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
