'use client';

/**
 * SprintyAssistant  –  NutriTrack's official mascot
 *
 * Sprinty is an athletic cheetah wearing NutriTrack kit and a biometric
 * smartwatch. He renders as a fully inline SVG (no external assets needed)
 * and uses Framer Motion for micro-animations.
 *
 * Moods:
 *  • 'idle'      – Gentle float; shown in empty states / corners
 *  • 'loading'   – Sprint lean with running legs; during API fetches
 *  • 'success'   – Bounce + raised fist; when goals / meals are hit
 *  • 'error'     – Horizontal shake + worried brows; for error boundaries
 *  • 'tip'       – Float + pointing finger; nutritional tips
 *  • 'greeting'  – Float + waving hand; dashboard welcome / onboarding
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import clsx from 'clsx';

// ── Types ───────────────────────────────────────────────────────────────────

export type SprintyMood =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'tip'
  | 'greeting';

export type SprintySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SprintyAssistantProps {
  /** Visual mood / animation variant */
  mood?: SprintyMood;
  /** Optional speech bubble message */
  message?: string;
  /** Component size – scales both SVG and bubble text */
  size?: SprintySize;
  /** Additional class names for the wrapper */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

// ── Size map ────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<SprintySize, { svg: number; text: string; bubble: string }> = {
  xs: { svg: 40,  text: 'text-xs',   bubble: 'text-xs px-2 py-1'   },
  sm: { svg: 56,  text: 'text-sm',   bubble: 'text-sm px-3 py-1.5' },
  md: { svg: 80,  text: 'text-base', bubble: 'text-sm px-4 py-2'   },
  lg: { svg: 112, text: 'text-lg',   bubble: 'text-base px-4 py-3' },
  xl: { svg: 160, text: 'text-xl',   bubble: 'text-base px-5 py-3' },
};

// ── Brand + cheetah palette ─────────────────────────────────────────────────

const C = {
  fur:    '#F0A830',   // warm golden cheetah fur
  furLt:  '#FDD88A',   // lighter muzzle / belly
  spots:  '#5C3317',   // dark-brown spots & tear marks
  green:  '#3a6b27',   // NutriTrack primary (jersey)
  greenM: '#4e8f34',   // medium green (jersey details / sneakers)
  greenL: '#7db560',   // light green (accents)
  dark:   '#2c1f0e',   // shorts / pupils
  gold:   '#c8861a',   // ear inner / tail tip accent
  blush:  '#E8844A',   // cheek flush
  w:      '#FFFFFF',
} as const;

// ── Framer Motion body animation variants ───────────────────────────────────

const BODY_ANIMATE: Record<SprintyMood, TargetAndTransition> = {
  idle:     { y: [0, -5, 0] },
  loading:  { rotate: [-8, 8] },
  success:  { scale: [1, 1.15, 0.95, 1] },
  error:    { x: [-4, 4, -4, 4, 0] },
  tip:      { y: [0, -3, 0] },
  greeting: { y: [0, -4, 0] },
};

const BODY_TRANSITION: Record<SprintyMood, Parameters<typeof motion.div>[0]['transition']> = {
  idle:     { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
  loading:  { repeat: Infinity, repeatType: 'reverse' as const, duration: 0.35, ease: 'linear' },
  success:  { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
  error:    { duration: 0.45, ease: 'easeInOut' },
  tip:      { repeat: Infinity, duration: 3, ease: 'easeInOut' },
  greeting: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
};

// ── Bubble colour tokens ────────────────────────────────────────────────────

const BUBBLE_COLORS: Record<SprintyMood, string> = {
  idle:     'bg-[#e8f3e2] border-[#7db560] text-[#2c1f0e]',
  loading:  'bg-white border-[#ddd3c4] text-[#2c1f0e]',
  success:  'bg-[#e8f3e2] border-[#7db560] text-[#2c1f0e]',
  error:    'bg-[#fff0e8] border-[#d4622a] text-[#2c1f0e]',
  tip:      'bg-[#fffbeb] border-[#c8861a] text-[#2c1f0e]',
  greeting: 'bg-[#e8f3e2] border-[#7db560] text-[#2c1f0e]',
};

const ARROW_COLORS: Record<SprintyMood, string> = {
  idle:     'border-b-[#7db560]',
  loading:  'border-b-[#ddd3c4]',
  success:  'border-b-[#7db560]',
  error:    'border-b-[#d4622a]',
  tip:      'border-b-[#c8861a]',
  greeting: 'border-b-[#7db560]',
};

// ── SVG sub-elements ────────────────────────────────────────────────────────

/** Eye variants – green irises match NutriTrack brand colour */
const Eyes: Record<SprintyMood, React.ReactNode> = {
  idle: (
    <>
      <circle cx="38" cy="36" r="5.5" fill={C.w}/>
      <circle cx="38" cy="36" r="3.5" fill={C.green}/>
      <circle cx="38" cy="36" r="2"   fill={C.dark}/>
      <circle cx="39.5" cy="34.5" r="1" fill={C.w}/>
      <circle cx="62" cy="36" r="5.5" fill={C.w}/>
      <circle cx="62" cy="36" r="3.5" fill={C.green}/>
      <circle cx="62" cy="36" r="2"   fill={C.dark}/>
      <circle cx="63.5" cy="34.5" r="1" fill={C.w}/>
    </>
  ),
  loading: (
    /* Focused / determined – ellipses slightly narrowed */
    <>
      <ellipse cx="38" cy="36" rx="5.5" ry="4"  fill={C.w}/>
      <circle  cx="38" cy="36" r="3"             fill={C.green}/>
      <circle  cx="38" cy="36" r="1.8"           fill={C.dark}/>
      <circle  cx="39"  cy="35" r="0.8"          fill={C.w}/>
      <ellipse cx="62" cy="36" rx="5.5" ry="4"  fill={C.w}/>
      <circle  cx="62" cy="36" r="3"             fill={C.green}/>
      <circle  cx="62" cy="36" r="1.8"           fill={C.dark}/>
      <circle  cx="63"  cy="35" r="0.8"          fill={C.w}/>
    </>
  ),
  success: (
    /* Happy squint arcs */
    <>
      <path d="M33 36 Q38 42 43 36" stroke={C.dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M57 36 Q62 42 67 36" stroke={C.dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  error: (
    /* Worried – inner brows raised */
    <>
      <circle cx="38" cy="37" r="5.5" fill={C.w}/>
      <circle cx="38" cy="37" r="3.5" fill={C.green}/>
      <circle cx="38" cy="37" r="2"   fill={C.dark}/>
      <circle cx="62" cy="37" r="5.5" fill={C.w}/>
      <circle cx="62" cy="37" r="3.5" fill={C.green}/>
      <circle cx="62" cy="37" r="2"   fill={C.dark}/>
      <path d="M34 29 Q38 26 42 29" stroke={C.spots} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M58 29 Q62 26 66 29" stroke={C.spots} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </>
  ),
  tip: (
    /* Bright + curious – irises shifted up slightly */
    <>
      <circle cx="38" cy="35"   r="5.5" fill={C.w}/>
      <circle cx="38" cy="34.5" r="3.5" fill={C.green}/>
      <circle cx="38" cy="34.5" r="2"   fill={C.dark}/>
      <circle cx="39.5" cy="33" r="1"   fill={C.w}/>
      <circle cx="62" cy="35"   r="5.5" fill={C.w}/>
      <circle cx="62" cy="34.5" r="3.5" fill={C.green}/>
      <circle cx="62" cy="34.5" r="2"   fill={C.dark}/>
      <circle cx="63.5" cy="33" r="1"   fill={C.w}/>
    </>
  ),
  greeting: (
    /* Big happy squint arcs */
    <>
      <path d="M33 36 Q38 42 43 36" stroke={C.dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M57 36 Q62 42 67 36" stroke={C.dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  ),
};

/** Mouth variants */
const Mouths: Record<SprintyMood, React.ReactNode> = {
  idle:     <path d="M43 51 Q50 57 57 51" stroke={C.spots} strokeWidth="2"   fill="none" strokeLinecap="round"/>,
  loading:  <ellipse cx="50" cy="50" rx="5" ry="3.5" fill={C.spots}/>,
  success:  <path d="M39 50 Q50 61 61 50" stroke={C.spots} strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
  error:    <path d="M42 55 Q50 49 58 55" stroke={C.spots} strokeWidth="2"   fill="none" strokeLinecap="round"/>,
  tip:      <path d="M43 51 Q50 57 57 51" stroke={C.spots} strokeWidth="2"   fill="none" strokeLinecap="round"/>,
  greeting: <path d="M39 50 Q50 61 61 50" stroke={C.spots} strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
};

// ── Smartwatch (SVG-safe component) ─────────────────────────────────────────

function Watch({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x}   y={y}   width="8" height="6" rx="2"   fill={C.dark}/>
      <rect x={x+1} y={y+1} width="6" height="4" rx="1"   fill="#00e676"/>
      <line x1={x+2} y1={y+2} x2={x+5} y2={y+2} stroke={C.dark} strokeWidth="0.5"/>
      <line x1={x+2} y1={y+3.5} x2={x+4} y2={y+3.5} stroke={C.dark} strokeWidth="0.5"/>
    </>
  );
}

// ── Main character SVG ───────────────────────────────────────────────────────

function SprintySVG({ mood, size }: { mood: SprintyMood; size: number }) {
  const running = mood === 'loading';

  return (
    <svg
      viewBox="0 0 100 128"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ overflow: 'visible', display: 'block' }}
    >

      {/* ── TAIL (drawn behind body) ──────────────────────────────── */}
      <path
        d="M67 90 Q83 86 89 76 Q95 65 88 60"
        stroke={C.fur}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tail rings / tip */}
      <path
        d="M87 62 Q91 58 89 55"
        stroke={C.gold}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="89" cy="55" r="3" fill={C.spots}/>

      {/* ── LEGS ──────────────────────────────────────────────────── */}
      {running ? (
        <>
          {/* Left leg kicked back */}
          <path d="M38 99 Q27 108 20 114" stroke={C.dark} strokeWidth="8" fill="none" strokeLinecap="round"/>
          {/* Right leg forward / lifted */}
          <path d="M62 99 Q72 104 78 97"  stroke={C.dark} strokeWidth="8" fill="none" strokeLinecap="round"/>
          <ellipse cx="18" cy="115" rx="7" ry="3.5" fill={C.greenM}/>
          <ellipse cx="80" cy="96"  rx="7" ry="3.5" fill={C.greenM}/>
        </>
      ) : (
        <>
          <path d="M38 100 Q33 112 31 119" stroke={C.dark} strokeWidth="8" fill="none" strokeLinecap="round"/>
          <path d="M62 100 Q67 112 69 119" stroke={C.dark} strokeWidth="8" fill="none" strokeLinecap="round"/>
          {/* Green NutriTrack sneakers */}
          <ellipse cx="29" cy="120" rx="7" ry="3.5" fill={C.greenM}/>
          <ellipse cx="71" cy="120" rx="7" ry="3.5" fill={C.greenM}/>
        </>
      )}

      {/* ── SHORTS ────────────────────────────────────────────────── */}
      {!running && (
        <>
          <rect x="30" y="93" width="17" height="13" rx="5" fill={C.dark}/>
          <rect x="53" y="93" width="17" height="13" rx="5" fill={C.dark}/>
          <line x1="30" y1="100" x2="47" y2="100" stroke={C.greenL} strokeWidth="1.5" opacity="0.6"/>
          <line x1="53" y1="100" x2="70" y2="100" stroke={C.greenL} strokeWidth="1.5" opacity="0.6"/>
        </>
      )}

      {/* ── JERSEY / BODY ─────────────────────────────────────────── */}
      <rect x="27" y="62" width="46" height="36" rx="14" fill={C.green}/>
      {/* Horizontal jersey stripes */}
      <path d="M27 70 Q50 73 73 70" stroke={C.greenL} strokeWidth="2"   fill="none" opacity="0.7"/>
      <path d="M27 78 Q50 80 73 78" stroke={C.greenM} strokeWidth="1.5" fill="none" opacity="0.4"/>
      {/* NT chest logo */}
      <text
        x="50" y="88"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fill={C.greenL}
        fontFamily="system-ui,sans-serif"
        letterSpacing="1"
      >NT</text>

      {/* ── SPOTS on visible fur (arms / sides) ───────────────────── */}
      <circle cx="19" cy="76" r="2.5" fill={C.spots} opacity="0.6"/>
      <circle cx="15" cy="84" r="2"   fill={C.spots} opacity="0.5"/>
      <circle cx="81" cy="76" r="2.5" fill={C.spots} opacity="0.6"/>
      <circle cx="85" cy="84" r="2"   fill={C.spots} opacity="0.5"/>

      {/* ── LEFT ARM ──────────────────────────────────────────────── */}
      {running
        ? <path d="M30 70 Q18 64 12 56" stroke={C.fur} strokeWidth="7" fill="none" strokeLinecap="round"/>
        : <path d="M30 72 Q20 82 17 92" stroke={C.fur} strokeWidth="7" fill="none" strokeLinecap="round"/>
      }

      {/* ── RIGHT ARM + SMARTWATCH ────────────────────────────────── */}
      {mood === 'success' ? (
        <g>
          <path d="M70 72 Q78 60 76 47" stroke={C.fur} strokeWidth="7" fill="none" strokeLinecap="round"/>
          {/* Raised fist */}
          <circle cx="76" cy="44" r="5.5" fill={C.fur}/>
          {/* Thumb up */}
          <path d="M76 41 Q80 37 81 39 Q82 42 78 43" stroke={C.fur} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          <Watch x={72} y={62}/>
        </g>
      ) : mood === 'tip' ? (
        <g>
          <path d="M70 70 Q82 60 84 47" stroke={C.fur} strokeWidth="7" fill="none" strokeLinecap="round"/>
          {/* Pointing finger */}
          <ellipse cx="84" cy="44" rx="3.5" ry="5" fill={C.fur}/>
          <Watch x={80} y={60}/>
        </g>
      ) : mood === 'greeting' ? (
        /* CSS wave animation applied on this <g> */
        <g style={{
          animation: 'sprinty-wave 0.5s ease-in-out infinite alternate',
          transformOrigin: '70px 72px',
        }}>
          <path d="M70 70 Q80 58 77 45" stroke={C.fur} strokeWidth="7" fill="none" strokeLinecap="round"/>
          <circle cx="77" cy="42" r="5.5" fill={C.fur}/>
          {/* Spread fingers */}
          <path d="M73 40 Q72 36 74 35" stroke={C.fur} strokeWidth="3" strokeLinecap="round"/>
          <path d="M77 38 Q77 34 79 33" stroke={C.fur} strokeWidth="3" strokeLinecap="round"/>
          <path d="M81 40 Q82 36 84 35" stroke={C.fur} strokeWidth="3" strokeLinecap="round"/>
          <Watch x={73} y={60}/>
        </g>
      ) : running ? (
        <g>
          <path d="M70 70 Q82 64 88 56" stroke={C.fur} strokeWidth="7" fill="none" strokeLinecap="round"/>
          <Watch x={84} y={58}/>
        </g>
      ) : (
        <g>
          <path d="M70 72 Q80 82 83 92" stroke={C.fur} strokeWidth="7" fill="none" strokeLinecap="round"/>
          <Watch x={79} y={87}/>
        </g>
      )}

      {/* ── NECK ──────────────────────────────────────────────────── */}
      <ellipse cx="50" cy="62" rx="14" ry="7" fill={C.fur}/>

      {/* ── EARS (behind head layer) ──────────────────────────────── */}
      <polygon points="30,22 24,8 38,18"  fill={C.fur}/>
      <polygon points="30,21 26,10 36,17" fill={C.gold}/>
      <polygon points="70,22 76,8 62,18"  fill={C.fur}/>
      <polygon points="70,21 74,10 64,17" fill={C.gold}/>

      {/* ── HEAD ──────────────────────────────────────────────────── */}
      <ellipse cx="50" cy="38" rx="23" ry="26" fill={C.fur}/>

      {/* Head spots */}
      <circle cx="34" cy="27" r="2.5" fill={C.spots} opacity="0.65"/>
      <circle cx="42" cy="20" r="1.8" fill={C.spots} opacity="0.6"/>
      <circle cx="50" cy="16" r="1.5" fill={C.spots} opacity="0.5"/>
      <circle cx="58" cy="20" r="1.8" fill={C.spots} opacity="0.6"/>
      <circle cx="66" cy="27" r="2.5" fill={C.spots} opacity="0.65"/>
      <circle cx="37" cy="32" r="1.5" fill={C.spots} opacity="0.5"/>
      <circle cx="63" cy="32" r="1.5" fill={C.spots} opacity="0.5"/>

      {/* Muzzle – lighter cream area */}
      <ellipse cx="50" cy="48" rx="13" ry="10" fill={C.furLt}/>

      {/* Cheetah TEAR MARKS – the species' signature feature */}
      <path d="M43 42 Q40 50 38 56" stroke={C.spots} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
      <path d="M57 42 Q60 50 62 56" stroke={C.spots} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>

      {/* Cheek blush */}
      <ellipse cx="30" cy="47" rx="5.5" ry="3.5" fill={C.blush} opacity="0.3"/>
      <ellipse cx="70" cy="47" rx="5.5" ry="3.5" fill={C.blush} opacity="0.3"/>

      {/* Eyes */}
      {Eyes[mood]}

      {/* Nose */}
      <ellipse cx="50" cy="44" rx="3.5" ry="2.5" fill={C.spots}/>
      <ellipse cx="50" cy="43.5" rx="2" ry="1.2" fill={C.blush} opacity="0.5"/>

      {/* Mouth */}
      {Mouths[mood]}

    </svg>
  );
}

// ── Loading dots ─────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-center" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          style={{ animation: `sprinty-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SprintyAssistant({
  mood = 'idle',
  message,
  size = 'md',
  className,
  ariaLabel,
}: SprintyAssistantProps) {
  const { svg: svgSize, text: textSize, bubble: bubbleClass } = SIZE_MAP[size];
  const [mounted, setMounted] = useState(false);

  // Prevents hydration mismatch – animations only start client-side
  useEffect(() => { setMounted(true); }, []);

  const defaultMessages: Partial<Record<SprintyMood, string>> = {
    loading:  'Sto caricando i tuoi dati...',
    error:    'Ops! Qualcosa è andato storto.',
    tip:      'Suggerimento nutrizionale',
    greeting: 'Ciao! Pronto a tracciare oggi?',
  };

  const displayMessage = message ?? defaultMessages[mood];

  return (
    <>
      {/* Inline keyframes – isolated to this component, no globals needed */}
      <style>{`
        @keyframes sprinty-dot {
          0%,80%,100% { transform: scale(.6); opacity: .4; }
          40%          { transform: scale(1);  opacity: 1;  }
        }
        @keyframes sprinty-wave {
          from { transform: rotate(-15deg); }
          to   { transform: rotate(10deg);  }
        }
        @keyframes sprinty-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div
        className={clsx(
          'flex flex-col items-center gap-3',
          mounted && 'animate-[sprinty-fadein_0.4s_ease_both]',
          className
        )}
        role={mood === 'error' ? 'alert' : 'img'}
        aria-label={ariaLabel ?? `Sprinty – ${mood}`}
      >
        {/* Character – Framer Motion handles body-level animation client-side */}
        {mounted ? (
          <motion.div
            animate={BODY_ANIMATE[mood]}
            transition={BODY_TRANSITION[mood]}
          >
            <SprintySVG mood={mood} size={svgSize} />
          </motion.div>
        ) : (
          <SprintySVG mood={mood} size={svgSize} />
        )}

        {/* Speech bubble */}
        <AnimatePresence mode="wait">
          {displayMessage && (
            <motion.div
              key={`${mood}-${displayMessage}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className={clsx(
                'relative max-w-xs rounded-2xl shadow-sm border',
                bubbleClass,
                textSize,
                'font-medium text-center leading-snug',
                BUBBLE_COLORS[mood]
              )}
            >
              {/* Upward-pointing triangle */}
              <span
                className={clsx(
                  'absolute -top-2 left-1/2 -translate-x-1/2',
                  'w-0 h-0',
                  'border-l-[8px] border-l-transparent',
                  'border-r-[8px] border-r-transparent',
                  'border-b-[8px]',
                  ARROW_COLORS[mood]
                )}
                aria-hidden="true"
              />
              {displayMessage}
              {mood === 'loading' && (
                <span className="ml-1"><LoadingDots /></span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
