/**
 * /app/dashboard/loading.tsx
 *
 * Next.js automatic loading UI – rendered while the Dashboard Server
 * Component fetches data. Uses SprintyAssistant in 'loading' mood.
 */

import SprintyAssistant from '@/components/SprintyAssistant';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f5efe4] flex flex-col">
      {/* Skeleton header */}
      <header className="border-b border-[#ddd3c4] bg-[#f5efe4]/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="h-3 w-28 bg-[#ddd3c4] rounded-full animate-pulse mb-2" />
          <div className="h-5 w-36 bg-[#ddd3c4] rounded-full animate-pulse" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-12 w-full flex flex-col items-center gap-8">
        {/* Sprinty loading mascot */}
        <SprintyAssistant
          mood="loading"
          size="xl"
          message="Sto caricando il tuo diario..."
        />

        {/* Skeleton cards */}
        <div className="w-full space-y-4">
          {/* Calorie card skeleton */}
          <div className="card animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-[140px] h-[140px] rounded-full bg-[#ede4d3]" />
              <div className="flex-1 space-y-4">
                <div className="h-3 bg-[#ddd3c4] rounded-full w-full" />
                <div className="h-3 bg-[#ddd3c4] rounded-full w-3/4" />
                <div className="h-3 bg-[#ddd3c4] rounded-full w-5/6" />
              </div>
            </div>
          </div>

          {/* Quick actions skeleton */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-sm h-16 animate-pulse bg-[#ede4d3]" />
            ))}
          </div>

          {/* Meals skeleton */}
          <div className="card animate-pulse space-y-3">
            <div className="h-4 bg-[#ddd3c4] rounded-full w-24" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-[#f5efe4]">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#ddd3c4] rounded-full w-3/4" />
                  <div className="h-2 bg-[#ede4d3] rounded-full w-1/2" />
                </div>
                <div className="h-4 w-16 bg-[#ddd3c4] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
