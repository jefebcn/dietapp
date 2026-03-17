'use client';

/**
 * SprintyAssistant  –  NutriTrack's health-conscious mascot
 *
 * A reusable component that renders Sprinty in various moods/contexts:
 *
 *  • 'idle'      – Default cheerful pose, shown in empty states
 *  • 'loading'   – Animated running pose, shown during data fetches
 *  • 'success'   – Thumbs-up celebrating a goal hit or meal logged
 *  • 'error'     – Concerned expression for error boundaries
 *  • 'tip'       – Pointing upward with a speech bubble for tips
 *  • 'greeting'  – Waving hello, used on dashboard welcome
 *
 * The component is intentionally self-contained (inline SVG) so it
 * works without any external image assets and renders during loading
 * states where network requests may be unavailable.
 *
 * @example
 * // Loading state
 * <SprintyAssistant mood="loading" size="lg" />
 *
 * @example
 * // Tip with message
 * <SprintyAssistant
 *   mood="tip"
 *   message="Try adding more protein to hit your daily goal!"
 *   size="md"
 * />
 */

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

// ── Types ──────────────────────────────────────────────────────────────────

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
  /** Component size – controls both SVG and text sizing */
  size?: SprintySize;
  /** Additional class names for the wrapper element */
  className?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

// ── Size map ───────────────────────────────────────────────────────────────

const SIZE_MAP: Record<SprintySize, { svg: number; text: string; bubble: string }> = {
  xs: { svg: 40,  text: 'text-xs',  bubble: 'text-xs px-2 py-1'  },
  sm: { svg: 56,  text: 'text-sm',  bubble: 'text-sm px-3 py-1.5'},
  md: { svg: 80,  text: 'text-base',bubble: 'text-sm px-4 py-2'  },
  lg: { svg: 112, text: 'text-lg',  bubble: 'text-base px-4 py-3'},
  xl: { svg: 160, text: 'text-xl',  bubble: 'text-base px-5 py-3'},
};

// ── Mood config ────────────────────────────────────────────────────────────

const MOOD_COLORS: Record<SprintyMood, { body: string; accent: string; eye: string }> = {
  idle:     { body: '#7db560', accent: '#4e8f34', eye: '#2c1f0e' },
  loading:  { body: '#c8861a', accent: '#d4622a', eye: '#2c1f0e' },
  success:  { body: '#7db560', accent: '#3a6b27', eye: '#2c1f0e' },
  error:    { body: '#d4622a', accent: '#b04d1d', eye: '#2c1f0e' },
  tip:      { body: '#7db560', accent: '#c8861a', eye: '#2c1f0e' },
  greeting: { body: '#4e8f34', accent: '#7db560', eye: '#2c1f0e' },
};

// ── SVG Sprinty character ──────────────────────────────────────────────────

function SprintySVG({
  mood,
  size,
  isAnimating,
}: {
  mood: SprintyMood;
  size: number;
  isAnimating: boolean;
}) {
  const colors = MOOD_COLORS[mood];

  // Eye expressions per mood
  const eyes = {
    idle:     <><circle cx="35" cy="38" r="4" fill={colors.eye}/><circle cx="65" cy="38" r="4" fill={colors.eye}/><circle cx="36" cy="37" r="1.5" fill="white"/><circle cx="66" cy="37" r="1.5" fill="white"/></>,
    loading:  <><ellipse cx="35" cy="38" rx="4" ry="3" fill={colors.eye}/><ellipse cx="65" cy="38" rx="4" ry="3" fill={colors.eye}/></>,
    success:  <><path d="M31 38 Q35 43 39 38" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M61 38 Q65 43 69 38" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
    error:    <><path d="M31 40 Q35 35 39 40" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M61 40 Q65 35 69 40" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
    tip:      <><circle cx="35" cy="38" r="4" fill={colors.eye}/><circle cx="65" cy="38" r="4" fill={colors.eye}/><circle cx="36" cy="37" r="1.5" fill="white"/><circle cx="66" cy="37" r="1.5" fill="white"/></>,
    greeting: <><path d="M31 38 Q35 43 39 38" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M61 38 Q65 43 69 38" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
  };

  // Mouth expressions per mood
  const mouths = {
    idle:     <path d="M40 55 Q50 62 60 55" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    loading:  <ellipse cx="50" cy="57" rx="6" ry="4" fill={colors.eye}/>,
    success:  <path d="M36 53 Q50 65 64 53" stroke={colors.eye} strokeWidth="3" fill="none" strokeLinecap="round"/>,
    error:    <path d="M38 60 Q50 52 62 60" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    tip:      <path d="M40 55 Q50 62 60 55" stroke={colors.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    greeting: <path d="M36 53 Q50 65 64 53" stroke={colors.eye} strokeWidth="3" fill="none" strokeLinecap="round"/>,
  };

  // Arms per mood (greeting = wave, tip = pointing up, others = neutral)
  const leftArm = mood === 'greeting'
    ? <path d="M28 72 Q12 60 8 44" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round"/>
    : mood === 'tip'
    ? <path d="M28 72 Q20 58 18 48" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round"/>
    : <path d="M28 72 Q18 80 14 90" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round"/>;

  const rightArm = mood === 'tip'
    ? <><path d="M72 72 Q82 58 84 44" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round"/><circle cx="84" cy="40" r="5" fill={colors.accent}/></>
    : <path d="M72 72 Q82 80 86 90" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round"/>;

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size}
      aria-hidden="true"
      style={{
        transition: 'transform 0.3s ease',
        animation: isAnimating
          ? mood === 'loading'
            ? 'sprinty-run 0.5s ease-in-out infinite alternate'
            : mood === 'success'
            ? 'sprinty-bounce 0.6s ease-in-out'
            : undefined
          : undefined,
      }}
    >
      {/* Leaf / hat decoration */}
      <ellipse cx="50" cy="14" rx="18" ry="8" fill={colors.accent} transform="rotate(-10 50 14)"/>
      <ellipse cx="50" cy="12" rx="10" ry="5" fill={colors.body} transform="rotate(-10 50 12)"/>

      {/* Head */}
      <ellipse cx="50" cy="40" rx="26" ry="28" fill={colors.body}/>

      {/* Cheeks */}
      <ellipse cx="28" cy="48" rx="6" ry="4" fill={colors.accent} opacity="0.5"/>
      <ellipse cx="72" cy="48" rx="6" ry="4" fill={colors.accent} opacity="0.5"/>

      {/* Eyes */}
      {eyes[mood]}

      {/* Mouth */}
      {mouths[mood]}

      {/* Body */}
      <rect x="30" y="65" width="40" height="35" rx="12" fill={colors.body}/>

      {/* Belly patch */}
      <ellipse cx="50" cy="80" rx="12" ry="10" fill={colors.accent} opacity="0.3"/>

      {/* Arms */}
      {leftArm}
      {rightArm}

      {/* Legs */}
      <path d="M38 98 Q34 112 30 118" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M62 98 Q66 112 70 118" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round"/>

      {/* Feet */}
      <ellipse cx="28" cy="118" rx="8" ry="4" fill={colors.eye}/>
      <ellipse cx="72" cy="118" rx="8" ry="4" fill={colors.eye}/>
    </svg>
  );
}

// ── Loading dots animation ─────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-center" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          style={{
            animation: `sprinty-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SprintyAssistant({
  mood = 'idle',
  message,
  size = 'md',
  className,
  ariaLabel,
}: SprintyAssistantProps) {
  const { svg: svgSize, text: textSize, bubble: bubbleClass } = SIZE_MAP[size];
  const isAnimating = mood === 'loading' || mood === 'success';
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for animated content
  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultMessages: Partial<Record<SprintyMood, string>> = {
    loading:  'Sto caricando i tuoi dati...',
    error:    'Ops! Qualcosa è andato storto.',
    tip:      'Suggerimento nutrizionale',
    greeting: 'Ciao! Pronto a tracciare oggi?',
  };

  const displayMessage = message ?? defaultMessages[mood];

  return (
    <>
      {/* Inline keyframes – scoped to this component */}
      <style>{`
        @keyframes sprinty-run {
          from { transform: rotate(-5deg) translateY(0); }
          to   { transform: rotate(5deg) translateY(-4px); }
        }
        @keyframes sprinty-bounce {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.15); }
          60%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes sprinty-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1;   }
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
        aria-label={ariaLabel ?? `Sprinty mascot – ${mood}`}
      >
        <SprintySVG mood={mood} size={svgSize} isAnimating={isAnimating && mounted} />

        {displayMessage && (
          <div
            className={clsx(
              'relative max-w-xs rounded-2xl shadow-sm border',
              bubbleClass,
              textSize,
              'font-medium text-center leading-snug',
              {
                'bg-[#e8f3e2] border-[#7db560] text-[#2c1f0e]':
                  mood === 'idle' || mood === 'success' || mood === 'greeting',
                'bg-[#fff0e8] border-[#d4622a] text-[#2c1f0e]':
                  mood === 'error',
                'bg-[#fffbeb] border-[#c8861a] text-[#2c1f0e]':
                  mood === 'tip',
                'bg-white border-[#ddd3c4] text-[#2c1f0e]':
                  mood === 'loading',
              }
            )}
          >
            {/* Speech bubble triangle */}
            <span
              className={clsx(
                'absolute -top-2 left-1/2 -translate-x-1/2',
                'w-0 h-0 border-l-[8px] border-l-transparent',
                'border-r-[8px] border-r-transparent border-b-[8px]',
                {
                  'border-b-[#7db560]':
                    mood === 'idle' || mood === 'success' || mood === 'greeting',
                  'border-b-[#d4622a]': mood === 'error',
                  'border-b-[#c8861a]': mood === 'tip',
                  'border-b-[#ddd3c4]': mood === 'loading',
                }
              )}
              aria-hidden="true"
            />
            {displayMessage}
            {mood === 'loading' && (
              <span className="ml-1">
                <LoadingDots />
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
