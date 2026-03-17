/**
 * Sprinty3D  –  Disney/Pixar-style 3D avocado mascot
 *
 * Pure SVG using radial/linear gradients + multiple highlight layers to
 * simulate subsurface scattering, rim-lighting, and soft clay shading.
 * Pose: right arm raised mid-wave, left arm slightly out for balance.
 */

export default function Sprinty3D({
  width = 200,
  className = '',
}: {
  width?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={Math.round(width * 1.35)}
      viewBox="0 0 200 270"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      overflow="visible"
    >
      <defs>
        {/* ── Body gradients ── */}
        <radialGradient id="s3-body-outer" cx="38%" cy="32%" r="62%">
          <stop offset="0%"   stopColor="#74c69d" />
          <stop offset="45%"  stopColor="#52b788" />
          <stop offset="100%" stopColor="#2d6a4f" />
        </radialGradient>
        <radialGradient id="s3-body-inner" cx="40%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#d8f3dc" />
          <stop offset="55%"  stopColor="#b7e4c7" />
          <stop offset="100%" stopColor="#95d5b2" />
        </radialGradient>
        <radialGradient id="s3-pit" cx="35%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#a0745e" />
          <stop offset="50%"  stopColor="#7f5539" />
          <stop offset="100%" stopColor="#4a2e0b" />
        </radialGradient>
        {/* ── Head / body highlight ── */}
        <radialGradient id="s3-body-hi" cx="32%" cy="18%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="s3-inner-hi" cx="30%" cy="20%" r="55%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* ── Eye gradients ── */}
        <radialGradient id="s3-eye-iris" cx="35%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#7b3f00" />
          <stop offset="60%"  stopColor="#4a1c00" />
          <stop offset="100%" stopColor="#2d0f00" />
        </radialGradient>
        {/* ── Headband ── */}
        <linearGradient id="s3-band" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fb923c" />
          <stop offset="40%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="s3-band-hi" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* ── Sneaker ── */}
        <linearGradient id="s3-shoe-sole" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="s3-shoe-upper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        {/* ── Arm band ── */}
        <linearGradient id="s3-arm-band" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        {/* ── Drop shadow blur ── */}
        <filter id="s3-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#2d6a4f" floodOpacity="0.35" />
        </filter>
        <filter id="s3-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Soft inner shadow */}
        <filter id="s3-inner-shadow">
          <feOffset dx="0" dy="3" />
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Cast shadow on ground ── */}
      <ellipse cx="100" cy="262" rx="52" ry="10" fill="rgba(45,106,79,0.22)" />

      {/* ══════════ LEFT ARM (slightly out) ══════════ */}
      <g filter="url(#s3-shadow)">
        <ellipse cx="46" cy="152" rx="14" ry="28" fill="url(#s3-body-outer)"
          transform="rotate(20 46 152)" />
        <ellipse cx="46" cy="152" rx="10" ry="22" fill="#52b788" opacity="0.5"
          transform="rotate(20 46 152)" />
        {/* Arm band */}
        <rect x="34" y="158" width="24" height="10" rx="5" fill="url(#s3-arm-band)"
          transform="rotate(20 46 163)" />
        {/* Hand */}
        <circle cx="38" cy="176" r="13" fill="url(#s3-body-outer)" />
        <circle cx="35" cy="173" r="5" fill="rgba(255,255,255,0.15)" />
      </g>

      {/* ══════════ RIGHT ARM (raised – wave) ══════════ */}
      <g filter="url(#s3-shadow)" transform="rotate(-45 154 130)">
        <ellipse cx="154" cy="130" rx="14" ry="30" fill="url(#s3-body-outer)" />
        <ellipse cx="154" cy="130" rx="10" ry="24" fill="#52b788" opacity="0.4" />
        {/* Arm band */}
        <rect x="142" y="118" width="24" height="10" rx="5" fill="url(#s3-arm-band)" />
        {/* Hand */}
        <circle cx="154" cy="100" r="14" fill="url(#s3-body-outer)" />
        {/* Fingers */}
        <ellipse cx="146" cy="92"  rx="5" ry="8" fill="url(#s3-body-outer)" transform="rotate(-15 146 92)" />
        <ellipse cx="154" cy="88"  rx="5" ry="9" fill="url(#s3-body-outer)" />
        <ellipse cx="162" cy="92"  rx="5" ry="8" fill="url(#s3-body-outer)" transform="rotate(15 162 92)" />
        <ellipse cx="167" cy="99"  rx="4" ry="7" fill="url(#s3-body-outer)" transform="rotate(30 167 99)" />
        {/* Knuckle shines */}
        <circle cx="146" cy="90"   r="2"   fill="rgba(255,255,255,0.4)" />
        <circle cx="154" cy="86"   r="2.5" fill="rgba(255,255,255,0.4)" />
        <circle cx="162" cy="90"   r="2"   fill="rgba(255,255,255,0.4)" />
      </g>

      {/* ══════════ MAIN BODY ══════════ */}
      <g filter="url(#s3-shadow)">
        {/* Outer skin */}
        <ellipse cx="100" cy="158" rx="56" ry="74" fill="url(#s3-body-outer)" />
        {/* Mid shading rim */}
        <ellipse cx="100" cy="158" rx="52" ry="70" fill="url(#s3-body-outer)" opacity="0.4" />
        {/* Inner flesh */}
        <ellipse cx="100" cy="158" rx="42" ry="60" fill="url(#s3-body-inner)" />
        {/* Inner flesh highlight */}
        <ellipse cx="87"  cy="138" rx="22" ry="18" fill="url(#s3-inner-hi)" />
        {/* Pit */}
        <ellipse cx="100" cy="168" rx="20" ry="24" fill="url(#s3-pit)" />
        <ellipse cx="94"  cy="160" rx="8"  ry="10" fill="rgba(255,255,255,0.18)" />
        {/* Body highlight */}
        <ellipse cx="80"  cy="110" rx="20" ry="30" fill="url(#s3-body-hi)" />
        {/* Rim light (right edge) */}
        <ellipse cx="148" cy="150" rx="8"  ry="40" fill="rgba(180,255,210,0.12)" />
      </g>

      {/* ══════════ HEAD ══════════ */}
      <g filter="url(#s3-shadow)">
        <ellipse cx="100" cy="82" rx="48" ry="55" fill="url(#s3-body-outer)" />
        {/* Mid tonal */}
        <ellipse cx="100" cy="82" rx="44" ry="50" fill="#52b788" opacity="0.25" />
        {/* Highlight */}
        <ellipse cx="83"  cy="58" rx="20" ry="26" fill="url(#s3-body-hi)" />
        {/* Rim light */}
        <ellipse cx="140" cy="76" rx="8"  ry="28" fill="rgba(180,255,210,0.12)" />
      </g>

      {/* ══════════ HEADBAND ══════════ */}
      <g>
        {/* Main band */}
        <path
          d="M52 76 Q100 62 148 76 Q148 90 100 95 Q52 90 52 76 Z"
          fill="url(#s3-band)"
        />
        {/* Texture stripes */}
        <path d="M55 79 Q100 67 145 79" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
        <path d="M55 84 Q100 72 145 84" stroke="rgba(0,0,0,0.08)" strokeWidth="1" fill="none" />
        {/* Top highlight */}
        <path
          d="M56 77 Q100 64 144 77 Q144 82 100 87 Q56 82 56 77 Z"
          fill="url(#s3-band-hi)"
        />
        {/* Knot on right */}
        <ellipse cx="148" cy="80" rx="11" ry="8" fill="url(#s3-band)" />
        <ellipse cx="145" cy="77" rx="5" ry="3" fill="rgba(255,255,255,0.3)" />
        {/* Fabric tail */}
        <path d="M156 76 Q166 70 162 84" stroke="#f97316" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M158 80 Q170 82 164 90" stroke="#ea6c0a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>

      {/* ══════════ EYES ══════════ */}
      {/* Left eye */}
      <g>
        <ellipse cx="80" cy="96" rx="15" ry="16" fill="white" />
        <ellipse cx="80" cy="96" rx="11" ry="12" fill="url(#s3-eye-iris)" />
        <ellipse cx="80" cy="96" rx="6"  ry="7"  fill="#1a0800" />
        {/* Main shine */}
        <ellipse cx="74" cy="89" rx="4.5" ry="5" fill="white" opacity="0.95" />
        {/* Small secondary shine */}
        <circle  cx="85" cy="100" r="2" fill="rgba(255,255,255,0.55)" />
        {/* Lashes */}
        <path d="M66 90 Q64 86 67 85" stroke="#2d0f00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M70 87 Q69 83 72 83" stroke="#2d0f00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M74 86 Q74 82 77 83" stroke="#2d0f00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Right eye */}
      <g>
        <ellipse cx="120" cy="96" rx="15" ry="16" fill="white" />
        <ellipse cx="120" cy="96" rx="11" ry="12" fill="url(#s3-eye-iris)" />
        <ellipse cx="120" cy="96" rx="6"  ry="7"  fill="#1a0800" />
        <ellipse cx="114" cy="89" rx="4.5" ry="5" fill="white" opacity="0.95" />
        <circle  cx="126" cy="100" r="2" fill="rgba(255,255,255,0.55)" />
        <path d="M107 90 Q105 86 108 85" stroke="#2d0f00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M111 87 Q110 83 113 83" stroke="#2d0f00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M115 86 Q115 82 118 83" stroke="#2d0f00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* ══════════ EYEBROWS (friendly raised) ══════════ */}
      <path d="M66 80 Q80 73 90 79"  stroke="#2d4a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M110 79 Q120 73 134 80" stroke="#2d4a1e" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* ══════════ NOSE ══════════ */}
      <ellipse cx="100" cy="110" rx="5" ry="4" fill="rgba(45,106,79,0.4)" />

      {/* ══════════ SMILE ══════════ */}
      <path
        d="M78 122 Q100 140 122 122"
        stroke="#2d4a1e"
        strokeWidth="4"
        fill="rgba(255,255,255,0.2)"
        strokeLinecap="round"
      />
      {/* Teeth row */}
      <path d="M84 126 Q100 138 116 126" fill="white" opacity="0.85" />
      {/* Cheek blush */}
      <ellipse cx="66"  cy="112" rx="10" ry="6" fill="rgba(248,113,113,0.28)" />
      <ellipse cx="134" cy="112" rx="10" ry="6" fill="rgba(248,113,113,0.28)" />

      {/* ══════════ LEGS ══════════ */}
      <g>
        {/* Left leg */}
        <path d="M80 220 L72 248" stroke="#2d6a4f" strokeWidth="14" strokeLinecap="round" />
        <path d="M80 220 L72 248" stroke="#40916c" strokeWidth="8" strokeLinecap="round" />
        {/* Right leg */}
        <path d="M120 220 L128 248" stroke="#2d6a4f" strokeWidth="14" strokeLinecap="round" />
        <path d="M120 220 L128 248" stroke="#40916c" strokeWidth="8" strokeLinecap="round" />
      </g>

      {/* ══════════ SNEAKERS ══════════ */}
      {/* Left sneaker */}
      <g>
        <ellipse cx="68" cy="254" rx="24" ry="10" fill="url(#s3-shoe-sole)" />
        <path d="M46 250 Q68 240 90 250 L90 254 Q68 244 46 254 Z" fill="url(#s3-shoe-upper)" />
        <path d="M50 247 Q68 240 86 247" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
        {/* Sole detail */}
        <ellipse cx="68" cy="255" rx="22" ry="7" fill="#e2e8f0" />
        <path d="M48 255 L88 255" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
      </g>
      {/* Right sneaker */}
      <g>
        <ellipse cx="132" cy="254" rx="24" ry="10" fill="url(#s3-shoe-sole)" />
        <path d="M110 250 Q132 240 154 250 L154 254 Q132 244 110 254 Z" fill="url(#s3-shoe-upper)" />
        <path d="M114 247 Q132 240 150 247" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
        <ellipse cx="132" cy="255" rx="22" ry="7" fill="#e2e8f0" />
        <path d="M112 255 L152 255" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
      </g>
    </svg>
  );
}
