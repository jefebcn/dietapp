'use client';

/**
 * BottomTabBar  –  Wanderquest-style persistent mobile navigation
 *
 * Four tabs: Home (Dashboard), Leagues, Tracking (Diary), Profile
 * Active tab icon gets a Disney Squash-and-Stretch bounce on mount/change.
 * Uses Framer Motion for smooth indicator transitions.
 */

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Tab {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}

const tabs: Tab[] = [
  {
    label: 'Home',
    href: '/dashboard',
    activeColor: '#15803D',
    activeBg: '#DCFCE7',
    activeBorder: '#86EFAC',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          fill={active ? '#22C55E' : 'none'}
          stroke={active ? '#15803D' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 21V12h6v9"
          stroke={active ? '#15803D' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'Leghe',
    href: '/leagues',
    activeColor: '#6D28D9',
    activeBg: '#EDE9FE',
    activeBorder: '#C4B5FD',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
          fill={active ? '#A78BFA' : 'none'}
          stroke={active ? '#6D28D9' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Diario',
    href: '/diary',
    activeColor: '#B45309',
    activeBg: '#FEF3C7',
    activeBorder: '#FDE68A',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="3" width="18" height="18" rx="3"
          fill={active ? '#FDE68A' : 'none'}
          stroke={active ? '#B45309' : '#9CA3AF'}
          strokeWidth="2"
        />
        <path
          d="M8 7h8M8 12h8M8 17h5"
          stroke={active ? '#B45309' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="17" cy="17" r="4" fill={active ? '#F59E0B' : '#E5E7EB'} />
        <path d="M17 15v2l1 1" stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Profilo',
    href: '/profile',
    activeColor: '#1D4ED8',
    activeBg: '#DBEAFE',
    activeBorder: '#BFDBFE',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="8" r="4"
          fill={active ? '#60A5FA' : 'none'}
          stroke={active ? '#1D4ED8' : '#9CA3AF'}
          strokeWidth="2"
        />
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke={active ? '#1D4ED8' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

// Squash-and-Stretch icon bounce variants
const iconVariants = {
  idle: { scale: 1, y: 0 },
  active: {
    scale: [1, 1.3, 0.88, 1.1, 0.96, 1] as number[],
    y: [0, -8, 2, -3, 0.5, 0] as number[],
    transition: {
      duration: 0.55,
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

  // Fire bounce animation when active tab changes
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

  const activeTab = tabs.find((t) => pathname.startsWith(t.href));

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const isBouncing = justActivated === tab.href;

        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-2xl transition-all duration-200"
            style={{ minWidth: 0 }}
          >
            {/* Active pill background */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  layoutId="tab-active-bg"
                  className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-2xl"
                  style={{
                    background: tab.activeBg,
                    border: `2px solid ${tab.activeBorder}`,
                    boxShadow: `0 3px 0 ${tab.activeBorder}, inset 0 1.5px 0 rgba(255,255,255,0.8)`,
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </AnimatePresence>

            {/* Icon with bounce */}
            <motion.span
              className="relative z-10"
              variants={iconVariants}
              animate={isBouncing ? 'active' : 'idle'}
            >
              {tab.icon(isActive)}
            </motion.span>

            {/* Label */}
            <span
              className="relative z-10 text-[10px] font-semibold leading-none transition-colors"
              style={{
                fontFamily: 'var(--font-ui)',
                color: isActive ? tab.activeColor : '#9CA3AF',
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
