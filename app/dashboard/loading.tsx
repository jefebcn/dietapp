/**
 * /app/dashboard/loading.tsx
 *
 * Next.js automatic loading UI – rendered while the Dashboard Server Component
 * fetches data. Sprinty runs on a treadmill while skeleton cards pulse.
 * Disney Cartoon theme – vibrant colours, 3D stamp shadows.
 */

import SprintyAssistant from '@/components/SprintyAssistant';

// Card style helpers
const skeletonCard = (color: { bg: string; border: string; shadow: string }) => ({
  background: color.bg,
  border: `2.5px solid ${color.border}`,
  borderRadius: '1.5rem',
  boxShadow: `0 6px 0 ${color.shadow}, inset 0 2px 0 rgba(255,255,255,0.70)`,
  animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
});

export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #FFFDE7 0%, #F1F8E9 45%, #E3F2FD 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Skeleton header */}
      <header
        style={{
          background: 'rgba(240,253,244,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '2.5px solid #86EFAC',
          boxShadow: '0 4px 20px rgba(21,128,61,0.12)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div
            className="h-3 w-28 rounded-full mb-2"
            style={{ background: '#BBF7D0', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
          <div
            className="h-5 w-40 rounded-full"
            style={{ background: '#86EFAC', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-8 w-full flex flex-col items-center gap-6 pb-24">

        {/* Sprinty running */}
        <SprintyAssistant
          mood="loading"
          size="xl"
          message="Sto caricando il tuo diario..."
        />

        {/* Skeleton bento grid */}
        <div className="w-full space-y-4">

          {/* Row 1: calorie ring (col-1) + macros (col-2) */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="col-span-1"
              style={{
                ...skeletonCard({ bg: 'linear-gradient(145deg,#F0FDF4,#DCFCE7)', border: '#86EFAC', shadow: '#16A34A' }),
                height: 220,
              }}
            />
            <div
              className="col-span-2"
              style={{
                ...skeletonCard({ bg: 'linear-gradient(145deg,#EFF6FF,#DBEAFE)', border: '#93C5FD', shadow: '#1D4ED8' }),
                height: 220,
              }}
            />
          </div>

          {/* Row 2: chart (col-2) + water (col-1) */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="col-span-2"
              style={{
                ...skeletonCard({ bg: 'linear-gradient(145deg,#FFFBEB,#FEF3C7)', border: '#FDE68A', shadow: '#B45309' }),
                height: 140,
              }}
            />
            <div
              className="col-span-1"
              style={{
                ...skeletonCard({ bg: 'linear-gradient(145deg,#ECFEFF,#CFFAFE)', border: '#67E8F9', shadow: '#0E7490' }),
                height: 140,
              }}
            />
          </div>

          {/* Row 3: quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { bg: 'linear-gradient(145deg,#EFF6FF,#DBEAFE)', border: '#93C5FD', shadow: '#1D4ED8' },
              { bg: 'linear-gradient(145deg,#F5F3FF,#EDE9FE)', border: '#C4B5FD', shadow: '#6D28D9' },
              { bg: 'linear-gradient(145deg,#FFFBEB,#FEF3C7)', border: '#FDE68A', shadow: '#B45309' },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  ...skeletonCard(c),
                  height: 80,
                }}
              />
            ))}
          </div>

          {/* Row 4: meals skeleton */}
          <div
            style={{
              ...skeletonCard({ bg: 'linear-gradient(145deg,#FFFEF5,#FFFBEB)', border: '#FDE68A', shadow: '#CA8A04' }),
              padding: '1.25rem',
            }}
          >
            <div
              className="h-4 rounded-full w-24 mb-4"
              style={{ background: '#FDE68A', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
            />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3 py-2.5"
                style={{ borderBottom: '2px solid rgba(202,138,4,0.10)' }}
              >
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-full w-3/4" style={{ background: '#FEF3C7', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                  <div className="h-2 rounded-full w-1/2" style={{ background: '#FDE68A', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                </div>
                <div className="h-5 w-16 rounded-full" style={{ background: '#BBF7D0', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
