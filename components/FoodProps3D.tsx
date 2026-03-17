/**
 * FoodProps3D  –  Decorative 3D-rendered food elements for the login page bg.
 * Apple, Olives, Spatula — Disney/Pixar clay style using SVG gradients.
 */

export function Apple3D({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.1)} viewBox="0 0 120 132" aria-hidden="true">
      <defs>
        <radialGradient id="ap-body" cx="35%" cy="28%" r="65%">
          <stop offset="0%"   stopColor="#fca5a5" />
          <stop offset="50%"  stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
        <radialGradient id="ap-hi" cx="32%" cy="22%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id="ap-shadow">
          <feDropShadow dx="2" dy="6" stdDeviation="6" floodColor="#991b1b" floodOpacity="0.3" />
        </filter>
      </defs>
      {/* Shadow */}
      <ellipse cx="60" cy="126" rx="34" ry="8" fill="rgba(150,0,0,0.15)" />
      {/* Body */}
      <g filter="url(#ap-shadow)">
        <path d="M60 20 Q100 20 108 60 Q112 90 96 108 Q78 124 60 122 Q42 124 24 108 Q8 90 12 60 Q20 20 60 20 Z"
          fill="url(#ap-body)" />
        {/* Indent top */}
        <path d="M52 24 Q60 18 68 24" stroke="#b91c1c" strokeWidth="3" fill="none" />
        {/* Highlight */}
        <ellipse cx="42" cy="48" rx="16" ry="22" fill="url(#ap-hi)" />
        {/* Secondary shine */}
        <ellipse cx="80" cy="36" rx="8" ry="10" fill="rgba(255,255,255,0.2)" />
      </g>
      {/* Stem */}
      <path d="M60 20 Q62 8 68 4" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M68 4 Q80 2 78 14 Q72 18 64 12 Z" fill="#16a34a" />
      <path d="M68 4 Q76 10 72 16" stroke="#15803d" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function Olives3D({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.9)} viewBox="0 0 80 72" aria-hidden="true">
      <defs>
        <radialGradient id="ol-skin" cx="32%" cy="28%" r="62%">
          <stop offset="0%"   stopColor="#a3e635" />
          <stop offset="50%"  stopColor="#65a30d" />
          <stop offset="100%" stopColor="#365314" />
        </radialGradient>
        <radialGradient id="ol-hi" cx="30%" cy="25%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="ol-pit" cx="40%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>
        <filter id="ol-shadow">
          <feDropShadow dx="1" dy="4" stdDeviation="4" floodColor="#365314" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* Shadows */}
      <ellipse cx="22" cy="68" rx="18" ry="5" fill="rgba(54,83,20,0.18)" />
      <ellipse cx="56" cy="65" rx="16" ry="5" fill="rgba(54,83,20,0.18)" />
      {/* Back olive */}
      <g filter="url(#ol-shadow)">
        <ellipse cx="56" cy="42" rx="22" ry="28" fill="url(#ol-skin)" />
        <ellipse cx="48" cy="34" rx="10" ry="12" fill="url(#ol-hi)" />
        <ellipse cx="56" cy="42" rx="6"  ry="8"  fill="url(#ol-pit)" />
        <ellipse cx="53" cy="39" rx="2.5" ry="3" fill="rgba(255,255,255,0.25)" />
      </g>
      {/* Front olive */}
      <g filter="url(#ol-shadow)">
        <ellipse cx="22" cy="46" rx="20" ry="26" fill="url(#ol-skin)" />
        <ellipse cx="15" cy="38" rx="9" ry="11" fill="url(#ol-hi)" />
        <ellipse cx="22" cy="46" rx="6" ry="7.5" fill="url(#ol-pit)" />
        <ellipse cx="19" cy="43" rx="2.5" ry="3" fill="rgba(255,255,255,0.25)" />
      </g>
    </svg>
  );
}

export function Spatula3D({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 2.5)} viewBox="0 0 90 225" aria-hidden="true">
      <defs>
        <linearGradient id="sp-metal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#94a3b8" />
          <stop offset="35%"  stopColor="#f1f5f9" />
          <stop offset="65%"  stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="sp-handle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#92400e" />
          <stop offset="40%"  stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <filter id="sp-shadow">
          <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#334155" floodOpacity="0.3" />
        </filter>
      </defs>
      <g filter="url(#sp-shadow)" transform="rotate(12 45 112)">
        {/* Blade */}
        <rect x="28" y="10" width="36" height="60" rx="6" fill="url(#sp-metal)" />
        {/* Blade slots */}
        {[20, 32, 44].map((y) => (
          <rect key={y} x="34" y={y} width="24" height="6" rx="3" fill="rgba(100,116,139,0.4)" />
        ))}
        {/* Blade highlight */}
        <rect x="32" y="12" width="10" height="56" rx="4" fill="rgba(255,255,255,0.35)" />
        {/* Neck */}
        <rect x="40" y="68" width="12" height="24" rx="4" fill="#94a3b8" />
        <rect x="41" y="68" width="5" height="24" fill="rgba(255,255,255,0.25)" />
        {/* Handle */}
        <rect x="34" y="90" width="24" height="125" rx="12" fill="url(#sp-handle)" />
        <rect x="38" y="92" width="8" height="120" rx="6" fill="rgba(255,255,255,0.18)" />
        {/* Handle base */}
        <ellipse cx="46" cy="215" rx="12" ry="5" fill="#78350f" />
      </g>
    </svg>
  );
}

export function Carrot3D({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.4)} viewBox="0 0 28 40" aria-hidden="true">
      <defs>
        <linearGradient id="cr-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fdba74" />
          <stop offset="60%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <path d="M14 4 Q22 4 22 20 Q22 36 14 38 Q6 36 6 20 Q6 4 14 4 Z" fill="url(#cr-body)" />
      <path d="M10 20 Q14 30 18 20" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
      <path d="M14 4 Q12 0 8 -2" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M14 4 Q14 0 14 -3" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M14 4 Q16 0 20 -2" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function KeyIcon3D({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <radialGradient id="key-gold" cx="35%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#fef08a" />
          <stop offset="60%"  stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="12" r="7" fill="none" stroke="url(#key-gold)" strokeWidth="3.5" />
      <circle cx="10" cy="12" r="3" fill="url(#key-gold)" />
      <rect x="15" y="11" width="12" height="3" rx="1.5" fill="url(#key-gold)" />
      <rect x="23" y="13" width="3" height="5"  rx="1.5" fill="url(#key-gold)" />
      <rect x="19" y="13" width="3" height="4"  rx="1.5" fill="url(#key-gold)" />
      <rect x="8"  y="10" width="4" height="2"  rx="1"   fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}
