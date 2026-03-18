'use client';

/**
 * BottomTabBar  –  Dark Glass Navigation (5 tabs)
 *
 * Tabs: Home | Diario | Insights | Leghe | Profilo
 * Inspired by Yazio, Lifesum 5-tab structure.
 * Active tab: colored glow pill.
 * Squash-and-Stretch bounce on tab activation.
 */

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Tab {
  label: string;
  href: string;
  glowColor: string;
  activePillBg: string;
  activePillBorder: string;
  activeTextColor: string;
  icon: (active: boolean) => React.ReactNode;
}

const tabs: Tab[] = [
  {
    label: 'Home',
    href: '/dashboard',
    glowColor: 'rgba(139,92,246,0.55)',
    activePillBg: 'rgba(139,92,246,0.18)',
    activePillBorder: 'rgba(139,92,246,0.40)',
    activeTextColor: '#C4B5FD',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          fill={active ? 'rgba(167,139,250,0.28)' : 'none'}
          stroke={active ? '#A78BFA' : 'rgba(255,255,255,0.28)'}
          strokeWidth="2" strokeLinejoin="round"/>
        <path d="M9 21V12h6v9" stroke={active ? '#A78BFA' : 'rgba(255,255,255,0.28)'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Diario',
    href: '/diary',
    glowColor: 'rgba(245,158,11,0.55)',
    activePillBg: 'rgba(245,158,11,0.14)',
    activePillBorder: 'rgba(245,158,11,0.35)',
    activeTextColor: '#FCD34D',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3"
          fill={active ? 'rgba(252,211,77,0.14)' : 'none'}
          stroke={active ? '#FCD34D' : 'rgba(255,255,255,0.28)'} strokeWidth="2"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke={active ? '#FCD34D' : 'rgba(255,255,255,0.28)'} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="19" cy="19" r="5" fill="#8B5CF6"/>
        <path d="M17 19h4M19 17v4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Insights',
    href: '/insights',
    glowColor: 'rgba(52,211,153,0.55)',
    activePillBg: 'rgba(52,211,153,0.12)',
    activePillBorder: 'rgba(52,211,153,0.32)',
    activeTextColor: '#34D399',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="14" width="4" height="8" rx="1"
          fill={active ? 'rgba(52,211,153,0.35)' : 'none'}
          stroke={active ? '#34D399' : 'rgba(255,255,255,0.28)'} strokeWidth="1.8"/>
        <rect x="9" y="9" width="4" height="13" rx="1"
          fill={active ? 'rgba(52,211,153,0.28)' : 'none'}
          stroke={active ? '#34D399' : 'rgba(255,255,255,0.28)'} strokeWidth="1.8"/>
        <rect x="16" y="4" width="4" height="18" rx="1"
          fill={active ? 'rgba(52,211,153,0.35)' : 'none'}
          stroke={active ? '#34D399' : 'rgba(255,255,255,0.28)'} strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    label: 'Leghe',
    href: '/leagues',
    glowColor: 'rgba(168,85,247,0.55)',
    activePillBg: 'rgba(168,85,247,0.18)',
    activePillBorder: 'rgba(168,85,247,0.40)',
    activeTextColor: '#D8B4FE',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
          fill={active ? 'rgba(216,180,254,0.22)' : 'none'}
          stroke={active ? '#D8B4FE' : 'rgba(255,255,255,0.28)'}
          strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Profilo',
    href: '/profile',
    glowColor: 'rgba(34,211,238,0.55)',
    activePillBg: 'rgba(34,211,238,0.12)',
    activePillBorder: 'rgba(34,211,238,0.32)',
    activeTextColor: '#67E8F9',
    icon: (active) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          fill={active ? 'rgba(103,232,249,0.20)' : 'none'}
          stroke={active ? '#67E8F9' : 'rgba(255,255,255,0.28)'} strokeWidth="2"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke={active ? '#67E8F9' : 'rgba(255,255,255,0.28)'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// Squash-and-Stretch bounce
const iconVariants = {
  idle: { scale: 1, y: 0 },
  active: {
    scale: [1, 1.35, 0.88, 1.12, 0.96, 1] as number[],
    y: [0, -7, 2, -3, 0.5, 0] as number[],
    transition: {
      duration: 0.50,
      times: [0, 0.28, 0.48, 0.65, 0.82, 1],
      ease: 'easeOut' as const,
    },
  },
};

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const prevPath = useRef(pathname);
  const [justActivated, setJustActivated] = useState<string | null>(null);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      const active = tabs.find((t) => pathname.startsWith(t.href));
      if (active) {
        setJustActivated(active.href);
        setTimeout(() => setJustActivated(null), 600);
      }
      prevPath.current = pathname;
    }
  }, [pathname]);

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale"
      style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const isBouncing = justActivated === tab.href;

        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-2xl"
            style={{ minWidth: 0 }}
          >
            {/* Active glow pill */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  layoutId="tab-active-bg"
                  className="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded-xl"
                  style={{
                    background: tab.activePillBg,
                    border: `1px solid ${tab.activePillBorder}`,
                    boxShadow: `0 0 14px ${tab.glowColor}`,
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
            </AnimatePresence>

            {/* Icon + bounce */}
            <motion.span
              className="relative z-10"
              variants={iconVariants}
              animate={isBouncing ? 'active' : 'idle'}
            >
              {tab.icon(isActive)}
            </motion.span>

            {/* Label */}
            <span
              className="relative z-10 text-[9px] font-semibold leading-none"
              style={{
                fontFamily: 'var(--font-ui)',
                color: isActive ? tab.activeTextColor : 'rgba(255,255,255,0.25)',
                textShadow: isActive ? `0 0 8px ${tab.glowColor}` : 'none',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
