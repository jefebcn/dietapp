/**
 * /app/dashboard/loading.tsx
 *
 * Next.js automatic loading UI – rendered while the Dashboard Server Component
 * fetches data. Indigo Wanderquest theme with pulsing skeleton cards.
 */

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
        background: 'linear-gradient(160deg, #EEF2FF 0%, #F5F0FF 40%, #ECFDF5 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Skeleton header */}
      <header
        style={{
          background: 'rgba(238,242,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '2.5px solid #A5B4FC',
          boxShadow: '0 4px 20px rgba(67,56,202,0.10)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div
            className="h-3 w-28 rounded-full mb-2"
            style={{ background: '#C7D2FE', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
          <div
            className="h-5 w-40 rounded-full"
            style={{ background: '#A5B4FC', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-8 w-full flex flex-col items-center gap-6 pb-24">

        {/* Loading indicator */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="w-12 h-12 rounded-full border-4 animate-spin"
            style={{ borderColor: '#C7D2FE', borderTopColor: '#4338CA' }}
          />
          <p className="text-sm font-bold" style={{ color: '#4338CA' }}>
            Caricamento in corso...
          </p>
        </div>

        {/* Skeleton bento grid */}
        <div className="w-full space-y-4">

          {/* Row 1: calorie ring (col-1) + macros (col-2) */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="col-span-1"
              style={{
                ...skeletonCard({ bg: 'linear-gradient(145deg,#EEF2FF,#E0E7FF)', border: '#A5B4FC', shadow: '#4338CA' }),
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
                ...skeletonCard({ bg: 'linear-gradient(145deg,#EEF2FF,#E0E7FF)', border: '#A5B4FC', shadow: '#4338CA' }),
                height: 140,
              }}
            />
            <div
              className="col-span-1"
              style={{
                ...skeletonCard({ bg: 'linear-gradient(145deg,#ECFDF5,#D1FAE5)', border: '#6EE7B7', shadow: '#059669' }),
                height: 140,
              }}
            />
          </div>

          {/* Row 3: quick actions */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { bg: 'linear-gradient(145deg,#EFF6FF,#DBEAFE)', border: '#93C5FD', shadow: '#1D4ED8' },
              { bg: 'linear-gradient(145deg,#EEF2FF,#E0E7FF)', border: '#A5B4FC', shadow: '#4338CA' },
              { bg: 'linear-gradient(145deg,#F5F3FF,#EDE9FE)', border: '#C4B5FD', shadow: '#6D28D9' },
              { bg: 'linear-gradient(145deg,#FFFBEB,#FEF3C7)', border: '#FDE68A', shadow: '#B45309' },
            ].map((c, i) => (
              <div key={i} style={{ ...skeletonCard(c), height: 80 }} />
            ))}
          </div>

          {/* Row 4: meals skeleton */}
          <div
            style={{
              ...skeletonCard({ bg: 'linear-gradient(145deg,#EEF2FF,#E0E7FF)', border: '#A5B4FC', shadow: '#4338CA' }),
              padding: '1.25rem',
            }}
          >
            <div
              className="h-4 rounded-full w-24 mb-4"
              style={{ background: '#C7D2FE', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
            />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3 py-2.5"
                style={{ borderBottom: '2px solid rgba(67,56,202,0.08)' }}
              >
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-full w-3/4" style={{ background: '#C7D2FE', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                  <div className="h-2 rounded-full w-1/2" style={{ background: '#E0E7FF', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                </div>
                <div className="h-5 w-16 rounded-full" style={{ background: '#A5B4FC', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
