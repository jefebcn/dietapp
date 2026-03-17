'use client';

/**
 * SprintyAssistant – "Sprinty the Avocado"
 *
 * A humanised avocado mascot with a sporty attitude.
 * Flat retro-cartoon style: headband, sneakers, expressive face.
 *
 * Moods:
 *  idle     – gentle floating (empty-state: holds a pencil)
 *  loading  – running on a treadmill (animated legs & belt)
 *  success  – flexing "keto-power" arms pose
 *  error    – worried eyes & downturned mouth
 *  tip      – pointing finger, curious expression
 *  greeting – waving hand, big happy eyes
 */

import { useId } from 'react';
import { motion, type Variants } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────────

export type SprintyMood =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'tip'
  | 'greeting';

export type SprintySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SprintyAssistantProps {
  mood?: SprintyMood;
  size?: SprintySize;
  message?: string;
  className?: string;
}

// ── Size map ────────────────────────────────────────────────────────────────

const SIZE_PX: Record<SprintySize, number> = {
  xs: 40,
  sm: 64,
  md: 96,
  lg: 128,
  xl: 160,
};

// ── Colour palette ──────────────────────────────────────────────────────────

const C = {
  avo_dark:   '#2d6a4f',
  avo_mid:    '#40916c',
  avo_light:  '#74c69d',
  avo_flesh:  '#d8f3dc',
  avo_cream:  '#f0f7ee',
  pit:        '#6d4c41',
  pit_hi:     '#a0745e',
  headband:   '#f59e0b',
  headband_s: '#d97706',
  shoe_w:     '#f1f5f9',
  shoe_b:     '#3b82f6',
  shoe_s:     '#1d4ed8',
  eye_w:      '#ffffff',
  eye_d:      '#1e293b',
  eye_sh:     '#ffffff',
  brow:       '#1e3a2a',
  mouth:      '#1e293b',
  cheek:      'rgba(248,113,113,0.30)',
  arm:        '#2d6a4f',
  arm_hi:     '#40916c',
  bubble_bg:  'rgba(15,23,42,0.88)',
  bubble_bdr: 'rgba(74,222,128,0.45)',
};

// ── Body animation variants per mood ────────────────────────────────────────

const bodyVariants: Record<SprintyMood, Variants> = {
  idle: {
    animate: {
      y: [0, -7, 0],
      transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  loading: {
    animate: {
      x: [0, 3, -3, 0],
      rotate: [-1.5, 1.5, -1.5],
      transition: { duration: 0.35, repeat: Infinity, ease: 'linear' },
    },
  },
  success: {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 0.55,
        repeat: Infinity,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
      },
    },
  },
  error: {
    animate: {
      x: [-5, 5, -5, 5, 0],
      transition: { duration: 0.45, repeat: 2, ease: 'easeInOut' },
    },
  },
  tip: {
    animate: {
      y: [0, -5, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  greeting: {
    animate: {
      y: [0, -5, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function Eyes({ mood }: { mood: SprintyMood }) {
  switch (mood) {
    case 'loading':
      return (
        <>
          <ellipse cx="39" cy="54" rx="5" ry="3" fill={C.eye_d} />
          <ellipse cx="61" cy="54" rx="5" ry="3" fill={C.eye_d} />
          <circle cx="40" cy="53" r="1" fill={C.eye_sh} />
          <circle cx="62" cy="53" r="1" fill={C.eye_sh} />
        </>
      );
    case 'success':
      return (
        <>
          <path d="M34 56 Q39 50 44 56" stroke={C.eye_d} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M56 56 Q61 50 66 56" stroke={C.eye_d} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <text x="50" y="45" fontSize="8" textAnchor="middle" fill="#fbbf24">★</text>
        </>
      );
    case 'error':
      return (
        <>
          <path d="M33 48 Q38 45 43 47" stroke={C.brow} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M57 47 Q62 45 67 48" stroke={C.brow} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="39" cy="55" r="5" fill={C.eye_w} />
          <circle cx="61" cy="55" r="5" fill={C.eye_w} />
          <circle cx="39" cy="56" r="3" fill={C.eye_d} />
          <circle cx="61" cy="56" r="3" fill={C.eye_d} />
        </>
      );
    case 'tip':
      return (
        <>
          <circle cx="39" cy="54" r="6" fill={C.eye_w} />
          <circle cx="61" cy="54" r="4.5" fill={C.eye_w} />
          <circle cx="40" cy="54" r="3.5" fill={C.eye_d} />
          <circle cx="62" cy="54" r="2.5" fill={C.eye_d} />
          <circle cx="41" cy="52" r="1.2" fill={C.eye_sh} />
          <circle cx="63" cy="52" r="0.9" fill={C.eye_sh} />
        </>
      );
    case 'greeting':
      return (
        <>
          <circle cx="39" cy="54" r="6" fill={C.eye_w} />
          <circle cx="61" cy="54" r="6" fill={C.eye_w} />
          <circle cx="40" cy="55" r="3.5" fill={C.eye_d} />
          <circle cx="62" cy="55" r="3.5" fill={C.eye_d} />
          <circle cx="41.5" cy="53" r="1.3" fill={C.eye_sh} />
          <circle cx="63.5" cy="53" r="1.3" fill={C.eye_sh} />
          <ellipse cx="33" cy="61" rx="4" ry="2.5" fill={C.cheek} />
          <ellipse cx="67" cy="61" rx="4" ry="2.5" fill={C.cheek} />
        </>
      );
    default: // idle
      return (
        <>
          <circle cx="39" cy="54" r="5.5" fill={C.eye_w} />
          <circle cx="61" cy="54" r="5.5" fill={C.eye_w} />
          <circle cx="40" cy="55" r="3" fill={C.eye_d} />
          <circle cx="62" cy="55" r="3" fill={C.eye_d} />
          <circle cx="41" cy="53.5" r="1" fill={C.eye_sh} />
          <circle cx="63" cy="53.5" r="1" fill={C.eye_sh} />
        </>
      );
  }
}

function Mouth({ mood }: { mood: SprintyMood }) {
  switch (mood) {
    case 'loading':
      return <path d="M43 67 Q50 64 57 67" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />;
    case 'success':
      return (
        <>
          <path d="M40 67 Q50 76 60 67" stroke={C.mouth} strokeWidth="2.5" fill="rgba(255,255,255,0.2)" strokeLinecap="round" />
          <rect x="47" y="67" width="6" height="4" rx="1" fill="white" />
        </>
      );
    case 'error':
      return <path d="M42 71 Q50 65 58 71" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />;
    case 'tip':
      return <path d="M43 67 Q50 72 57 67" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M41 67 Q50 74 59 67" stroke={C.mouth} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
  }
}

function Arms({ mood }: { mood: SprintyMood }) {
  if (mood === 'loading') {
    return (
      <>
        <motion.g
          animate={{ rotate: [20, -20, 20] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '28px', originY: '72px' } as React.CSSProperties}
        >
          <path d="M28 72 Q15 64 12 58" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
        </motion.g>
        <motion.g
          animate={{ rotate: [-20, 20, -20] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '72px', originY: '72px' } as React.CSSProperties}
        >
          <path d="M72 72 Q85 64 88 58" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
        </motion.g>
      </>
    );
  }
  if (mood === 'success') {
    return (
      <>
        <path d="M28 70 Q18 57 20 46" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M72 70 Q82 57 80 46" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
        <ellipse cx="19" cy="52" rx="5" ry="7" fill={C.avo_mid} />
        <ellipse cx="81" cy="52" rx="5" ry="7" fill={C.avo_mid} />
        <circle cx="19" cy="44" r="5" fill={C.avo_mid} />
        <circle cx="81" cy="44" r="5" fill={C.avo_mid} />
      </>
    );
  }
  if (mood === 'greeting') {
    return (
      <>
        <path d="M28 72 Q18 82 16 90" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
        <motion.g
          animate={{ rotate: [-18, 18, -18] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '72px', originY: '72px' } as React.CSSProperties}
        >
          <path d="M72 72 Q82 58 84 46" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="84" cy="44" r="5.5" fill={C.avo_mid} />
        </motion.g>
      </>
    );
  }
  if (mood === 'tip') {
    return (
      <>
        <path d="M28 72 Q18 82 16 90" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M72 72 Q82 58 80 44" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
        <ellipse cx="80" cy="40" rx="3" ry="5" fill={C.avo_mid} />
      </>
    );
  }
  // idle / error / default
  return (
    <>
      <path d="M28 72 Q18 82 16 90" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M72 72 Q82 82 84 90" stroke={C.arm} strokeWidth="5" strokeLinecap="round" fill="none" />
    </>
  );
}

function Legs({ mood }: { mood: SprintyMood }) {
  if (mood === 'loading') {
    return (
      <>
        <motion.g
          animate={{ rotate: [32, -32, 32] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '42px', originY: '102px' } as React.CSSProperties}
        >
          <path d="M42 102 Q38 114 34 122" stroke={C.avo_dark} strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="32" cy="125" rx="10" ry="5" fill={C.shoe_w} />
          <path d="M24 122 Q32 118 40 122" fill={C.shoe_b} />
        </motion.g>
        <motion.g
          animate={{ rotate: [-32, 32, -32] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '58px', originY: '102px' } as React.CSSProperties}
        >
          <path d="M58 102 Q62 114 66 122" stroke={C.avo_dark} strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="68" cy="125" rx="10" ry="5" fill={C.shoe_w} />
          <path d="M60 122 Q68 118 76 122" fill={C.shoe_b} />
        </motion.g>
      </>
    );
  }
  return (
    <>
      <path d="M42 102 L38 122" stroke={C.avo_dark} strokeWidth="6" strokeLinecap="round" />
      <path d="M58 102 L62 122" stroke={C.avo_dark} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="36" cy="125" rx="11" ry="5" fill={C.shoe_w} />
      <path d="M27 122 Q36 117 45 122" fill={C.shoe_b} />
      <ellipse cx="64" cy="125" rx="11" ry="5" fill={C.shoe_w} />
      <path d="M55 122 Q64 117 73 122" fill={C.shoe_b} />
    </>
  );
}

function Accessory({ mood }: { mood: SprintyMood }) {
  if (mood === 'idle') {
    // Pencil prop for "empty state – log your first meal"
    return (
      <>
        <path d="M16 90 L10 106 L14 108 L20 92 Z" fill="#fbbf24" />
        <path d="M10 106 L12 110 L14 108 Z" fill="#f5f5dc" />
        <path d="M18 90 L20 92 L14 93 Z" fill="#94a3b8" />
      </>
    );
  }
  return null;
}

function Treadmill({ mood }: { mood: SprintyMood }) {
  if (mood !== 'loading') return null;
  return (
    <>
      <rect x="8" y="130" width="84" height="9" rx="4.5" fill="#1e293b" />
      <motion.g
        animate={{ x: [-20, 0] }}
        transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
        clipPath="url(#tm-clip)"
      >
        {[8, 24, 40, 56, 72, 88].map((x) => (
          <line key={x} x1={x} y1="130" x2={x + 10} y2="139" stroke="#334155" strokeWidth="2" />
        ))}
      </motion.g>
      <defs>
        <clipPath id="tm-clip">
          <rect x="8" y="130" width="84" height="9" />
        </clipPath>
      </defs>
      <rect x="6" y="126" width="5" height="17" rx="2.5" fill="#0f172a" />
      <rect x="89" y="126" width="5" height="17" rx="2.5" fill="#0f172a" />
    </>
  );
}

function SprintySVG({ mood }: { mood: SprintyMood }) {
  return (
    <svg
      viewBox="0 0 100 148"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      overflow="visible"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Drop shadow */}
      <ellipse cx="50" cy="140" rx="22" ry="5" fill="rgba(0,0,0,0.22)" />

      {/* Treadmill (loading only) */}
      <Treadmill mood={mood} />

      {/* Arms – drawn before body so body overlaps them */}
      <Arms mood={mood} />

      {/* Avocado body */}
      <ellipse cx="50" cy="76" rx="26" ry="36" fill={C.avo_dark} />
      <ellipse cx="50" cy="72" rx="23" ry="32" fill={C.avo_mid} />
      {/* Flesh interior */}
      <ellipse cx="50" cy="74" rx="17" ry="26" fill={C.avo_flesh} />
      <ellipse cx="50" cy="72" rx="9"  ry="11" fill={C.avo_cream} opacity="0.55" />
      {/* Pit */}
      <ellipse cx="50" cy="78" rx="9"  ry="11" fill={C.pit} />
      <ellipse cx="47" cy="74" rx="4"  ry="5"  fill={C.pit_hi} />

      {/* Head bump */}
      <ellipse cx="50" cy="42" rx="17" ry="11" fill={C.avo_mid} />

      {/* Headband */}
      <path d="M33 46 Q50 39 67 46 Q67 53 50 55 Q33 53 33 46 Z" fill={C.headband} />
      <path d="M35 48 Q50 42 65 48" stroke={C.headband_s} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Headband knot */}
      <ellipse cx="67" cy="47" rx="4" ry="3" fill={C.headband} />
      <path d="M65 45 Q71 43 69 49" stroke={C.headband_s} strokeWidth="1" fill="none" />

      {/* Face */}
      <Eyes mood={mood} />
      <Mouth mood={mood} />

      {/* Accessory (pencil in idle) */}
      <Accessory mood={mood} />

      {/* Legs & sneakers */}
      <Legs mood={mood} />
    </svg>
  );
}

// ── Speech bubble ────────────────────────────────────────────────────────────

function SpeechBubble({
  message,
  mood,
}: {
  message: string;
  mood: SprintyMood;
}) {
  const borderColor =
    mood === 'error'
      ? 'rgba(251,113,133,0.55)'
      : mood === 'success'
      ? 'rgba(74,222,128,0.55)'
      : mood === 'loading'
      ? 'rgba(96,165,250,0.55)'
      : C.bubble_bdr;

  const isLoadingMood = mood === 'loading';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      style={{
        background: C.bubble_bg,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      className="mt-2 px-3 py-2 rounded-2xl text-sm text-slate-200 leading-snug max-w-[200px] text-center shadow-lg"
    >
      {isLoadingMood ? (
        <span className="flex items-center justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      ) : (
        message
      )}
    </motion.div>
  );
}

// ── Exported component ───────────────────────────────────────────────────────

export default function SprintyAssistant({
  mood = 'idle',
  size = 'md',
  message,
  className = '',
}: SprintyAssistantProps) {
  const px = SIZE_PX[size];
  const labelId = useId();

  const ariaLabels: Record<SprintyMood, string> = {
    idle:     'Sprinty l\'avocado è in attesa – registra il tuo primo pasto',
    loading:  'Sprinty sta correndo sul tapis roulant – caricamento in corso',
    success:  'Sprinty esulta in posa keto-power – obiettivo raggiunto!',
    error:    'Sprinty è preoccupato – si è verificato un errore',
    tip:      'Sprinty indica un consiglio utile',
    greeting: 'Sprinty ti saluta con un cenno',
  };

  const variants = bodyVariants[mood];

  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${className}`}
      role="img"
      aria-label={ariaLabels[mood]}
      aria-live={mood === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      id={labelId}
    >
      <motion.div
        style={{ width: px, height: Math.round(px * 1.48) }}
        variants={variants}
        animate="animate"
      >
        <SprintySVG mood={mood} />
      </motion.div>

      {message !== undefined && (
        <SpeechBubble message={message} mood={mood} />
      )}
    </div>
  );
}
