'use client';

/**
 * app/page.tsx  —  Onboarding Carousel
 *
 * Public landing page shown to visitors who haven't signed in.
 * Three slides showcasing the app, then CTA to register/login.
 * Authenticated users are redirected by middleware to /dashboard.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ── Slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 0,
    emoji: '🥗',
    bg: 'linear-gradient(160deg, #DCFCE7 0%, #BBF7D0 40%, #A7F3D0 100%)',
    accent: '#16A34A',
    topLabel: 'Healthy Food',
    topColor: '#22C55E',
    midLabel: 'Habits,',
    botLabel: 'One Day at a Time.',
    sub: 'Track every meal. Build lasting habits.',
  },
  {
    id: 1,
    emoji: '🔥',
    bg: 'linear-gradient(160deg, #FFF7ED 0%, #FED7AA 40%, #FDBA74 100%)',
    accent: '#EA6C0A',
    topLabel: 'Track Calories',
    topColor: '#F97316',
    midLabel: '& Macros',
    botLabel: 'Effortlessly.',
    sub: 'Visualise protein, carbs and fat in real time.',
  },
  {
    id: 2,
    emoji: '📷',
    bg: 'linear-gradient(160deg, #E0F2FE 0%, #BAE6FD 40%, #7DD3FC 100%)',
    accent: '#0284C7',
    topLabel: 'Scan Food',
    topColor: '#0EA5E9',
    midLabel: 'with a single',
    botLabel: 'Camera Tap.',
    sub: 'Barcode, food label, or ingredient detection.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const last = SLIDES.length - 1;

  function go(next: number) {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  }

  const current = SLIDES[slide];

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F3F6F0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Slide content ── */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={slide}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d * 60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit:  (d: number) => ({ x: -d * 60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.36, ease: 'easeInOut' }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {/* Hero panel — gradient + emoji (no external images) */}
          <div style={{
            position: 'relative',
            height: '50vh',
            overflow: 'hidden',
            borderBottomLeftRadius: '2.5rem',
            borderBottomRightRadius: '2.5rem',
            background: current.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Large decorative circles */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 200, height: 200, borderRadius: '50%',
              background: `${current.accent}18`,
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -30,
              width: 140, height: 140, borderRadius: '50%',
              background: `${current.accent}12`,
            }} />
            {/* Central emoji */}
            <span style={{ fontSize: 120, lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}>
              {current.emoji}
            </span>
            {/* Soft bottom fade */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '40%',
              background: 'linear-gradient(to bottom, transparent, #F3F6F0)',
            }} />
          </div>

          {/* Text block */}
          <div style={{ padding: '32px 28px 24px', flex: 1 }}>
            <p style={{
              fontSize: 36,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: current.topColor,
              lineHeight: 1.15,
              marginBottom: 4,
            }}>
              {current.topLabel}
            </p>
            <p style={{
              fontSize: 36,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: '#1C1917',
              lineHeight: 1.15,
              marginBottom: 2,
            }}>
              {current.midLabel}
            </p>
            <p style={{
              fontSize: 32,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              color: '#1C1917',
              fontStyle: 'italic',
              lineHeight: 1.2,
              marginBottom: 14,
            }}>
              {current.botLabel}
            </p>
            <p style={{
              fontSize: 15,
              color: '#6B7280',
              fontWeight: 500,
              lineHeight: 1.5,
            }}>
              {current.sub}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom controls ── */}
      <div style={{
        padding: '0 28px calc(40px + env(safe-area-inset-bottom, 0px)) 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Back arrow */}
        <button
          onClick={() => slide > 0 && go(slide - 1)}
          aria-label="Slide precedente"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1.5px solid #E5EBE0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: slide === 0 ? 0.35 : 1,
            cursor: slide === 0 ? 'default' : 'pointer',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === slide ? 22 : 8,
                height: 8,
                borderRadius: 99,
                background: i === slide ? '#F97316' : '#C9D5C4',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Forward arrow / Get started */}
        {slide < last ? (
          <button
            onClick={() => go(slide + 1)}
            aria-label="Prossima slide"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #FB923C, #F97316)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(249,115,22,0.38)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <Link
            href="/login"
            style={{
              height: 48,
              padding: '0 20px',
              borderRadius: 99,
              background: 'linear-gradient(145deg, #FB923C, #F97316)',
              boxShadow: '0 4px 14px rgba(249,115,22,0.38)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--font-ui)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Inizia gratis →
          </Link>
        )}
      </div>

      {/* Skip / login link */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
      }}>
        <Link
          href="/login"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#6B7280',
            textDecoration: 'none',
            background: 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: 99,
            border: '1px solid #E5EBE0',
          }}
        >
          Accedi
        </Link>
      </div>

    </div>
  );
}
