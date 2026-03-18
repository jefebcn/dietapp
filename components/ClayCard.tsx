'use client';

/**
 * ClayCard  –  Claymorphism card primitive
 *
 * Implements the "Claymorphism" design pattern:
 *  - Creamy off-white surface (#fffdf8)
 *  - Layered box-shadows: top highlight (inset light), bottom depth, optional glow
 *  - Extra-large border-radius (2rem default, configurable)
 *  - Optional Framer Motion animated variant for hover/press interactions
 *
 * Usage:
 *   <ClayCard>…</ClayCard>
 *   <ClayCard elevated glow="green" className="p-6">…</ClayCard>
 *   <ClayCard as="button" onClick={…}>…</ClayCard>
 */

import { motion, type HTMLMotionProps } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

type GlowVariant = 'green' | 'amber' | 'blue' | 'none';
type RadiusSize  = 'lg' | 'xl' | '2xl' | '3xl';

interface ClayCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Stronger shadows – use for hero / primary cards */
  elevated?: boolean;
  /** Coloured glow ring underneath the card */
  glow?: GlowVariant;
  /** Border-radius preset */
  radius?: RadiusSize;
  /** Enable Framer Motion hover tilt + lift */
  interactive?: boolean;
  /** Forwarded to the root element */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** HTML role override (e.g. "button") */
  role?: string;
  /** Tab index for focusable interactive cards */
  tabIndex?: number;
  'aria-label'?: string;
}

// ── Shadow builders ──────────────────────────────────────────────────────────

const GLOW: Record<GlowVariant, string> = {
  green: '0 0 32px rgba(136,176,75,0.28), 0 0 64px rgba(136,176,75,0.10)',
  amber: '0 0 32px rgba(245,158,11,0.22), 0 0 64px rgba(245,158,11,0.08)',
  blue:  '0 0 32px rgba(96,165,250,0.22), 0 0 64px rgba(96,165,250,0.08)',
  none:  '',
};

const RADIUS: Record<RadiusSize, string> = {
  lg:  '1rem',
  xl:  '1.5rem',
  '2xl': '2rem',
  '3xl': '2.5rem',
};

function buildShadow(elevated: boolean, glow: GlowVariant): string {
  const layers = elevated
    ? [
        /* ambient depth  */ '0 24px 64px rgba(90,58,20,0.18)',
        /* mid-range      */ '0 8px  24px rgba(90,58,20,0.12)',
        /* contact shadow */ '0 2px  6px  rgba(90,58,20,0.08)',
        /* top highlight  */ 'inset 0 2px 0 rgba(255,255,255,0.85)',
        /* bottom ridge   */ 'inset 0 -2px 0 rgba(90,58,20,0.08)',
      ]
    : [
        '0 10px 32px rgba(90,58,20,0.14)',
        '0 3px  10px rgba(90,58,20,0.08)',
        'inset 0 1.5px 0 rgba(255,255,255,0.80)',
        'inset 0 -1.5px 0 rgba(90,58,20,0.06)',
      ];

  const glow_ = GLOW[glow];
  return glow_ ? [...layers, glow_].join(', ') : layers.join(', ');
}

// ── Component ────────────────────────────────────────────────────────────────

export function ClayCard({
  children,
  className = '',
  style,
  elevated = false,
  glow = 'none',
  radius = '2xl',
  interactive = false,
  onClick,
  role,
  tabIndex,
  'aria-label': ariaLabel,
}: ClayCardProps) {
  const shadow  = buildShadow(elevated, glow);
  const rounded = RADIUS[radius];

  const baseStyle: React.CSSProperties = {
    background:   'linear-gradient(160deg, #fffdf8 0%, #faf5ea 100%)',
    borderRadius: rounded,
    boxShadow:    shadow,
    border:       '1.5px solid rgba(210,185,140,0.30)',
    ...style,
  };

  if (interactive) {
    return (
      <motion.div
        className={`cursor-pointer select-none ${className}`}
        style={baseStyle}
        onClick={onClick}
        role={role}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        whileHover={{ scale: 1.02, y: -3, transition: { type: 'spring', stiffness: 340, damping: 26 } }}
        whileTap={{
          scale: 0.98,
          y: 1,
          boxShadow: buildShadow(false, glow),
          transition: { type: 'spring', stiffness: 500, damping: 30 },
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={className}
      style={baseStyle}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

// ── ClayInput – scoped input field matching the clay design system ────────────

interface ClayInputProps {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  id?: string;
}

export function ClayInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  autoComplete,
  minLength,
  required,
  disabled,
  icon,
  id,
}: ClayInputProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-bold mb-1.5"
          style={{ color: '#5c3d1a' }}
        >
          {label}
        </label>
      )}
      <div
        className="relative transition-shadow duration-200 focus-within:ring-2 focus-within:ring-[#88b04b]/50"
        style={{
          borderRadius: '1rem',
          background: 'linear-gradient(180deg, #f9f4ec 0%, #fdfaf4 100%)',
          boxShadow: [
            'inset 0 3px 8px rgba(90,58,20,0.13)',
            'inset 0 -1px 0 rgba(255,255,255,0.7)',
            '0 1px 3px rgba(90,58,20,0.06)',
          ].join(', '),
          border: '1.5px solid rgba(195,160,100,0.28)',
        }}
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          disabled={disabled}
          className="w-full bg-transparent px-4 py-3 text-sm outline-none disabled:opacity-50"
          style={{
            borderRadius: '1rem',
            color: '#4a2e0a',
            caretColor: '#88b04b',
            paddingRight: icon ? '3rem' : undefined,
          }}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ClayButton – pill-shaped avocado-green button with pressed effect ─────────

interface ClayButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  fullWidth?: boolean;
}

export function ClayButton({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}: ClayButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      disabled={disabled || loading}
      className={`relative overflow-hidden font-black text-base tracking-wide select-none ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        borderRadius: 50,
        padding: '14px 28px',
        background: isPrimary
          ? 'linear-gradient(180deg, #a3c45a 0%, #88b04b 40%, #6b8e23 100%)'
          : 'linear-gradient(180deg, #fffdf8 0%, #f0e8d8 100%)',
        color: isPrimary ? '#fff' : '#5c3d1a',
        boxShadow: isPrimary
          ? [
              '0 5px 0 #4a6516',              // raised edge
              '0 8px 20px rgba(107,142,35,0.40)',
              'inset 0 1.5px 0 rgba(255,255,255,0.35)', // top sheen
            ].join(', ')
          : [
              '0 4px 0 rgba(90,58,20,0.22)',
              '0 6px 18px rgba(90,58,20,0.12)',
              'inset 0 1.5px 0 rgba(255,255,255,0.9)',
            ].join(', '),
        textShadow: isPrimary ? '0 1px 2px rgba(0,0,0,0.25)' : 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      whileHover={!disabled && !loading ? { scale: 1.025, y: -1 } : {}}
      whileTap={
        !disabled && !loading
          ? {
              scale: 0.97,
              y: 4,                           // "pressed down" Y offset
              boxShadow: isPrimary
                ? '0 1px 0 #4a6516, 0 2px 8px rgba(107,142,35,0.35), inset 0 1.5px 0 rgba(255,255,255,0.35)'
                : '0 1px 0 rgba(90,58,20,0.2), 0 2px 6px rgba(90,58,20,0.1), inset 0 1.5px 0 rgba(255,255,255,0.9)',
            }
          : {}
      }
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      {...props}
    >
      {/* Sheen overlay */}
      {isPrimary && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 50,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)',
            pointerEvents: 'none',
          }}
        />
      )}
      <span className="relative z-10">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin inline-block" />
            Attendere…
          </span>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}
