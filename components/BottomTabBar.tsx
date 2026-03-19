'use client';

/**
 * BottomTabBar  –  Light Healthy Theme Navigation
 *
 * Tabs: Home | Analytics | +(Scanner) | Plan | Setting
 * Active state: orange icon + label, subtle bg pill
 * Center + button: floating orange FAB that lifts above the bar
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

// ── SVG icon components ───────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? '#F97316' : '#9CA3AF';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" fill={active ? 'rgba(249,115,22,0.10)' : 'none'} />
      <path d="M9 21V13h6v8" />
    </svg>
  );
}

function AnalyticsIcon({ active }: { active: boolean }) {
  const c = active ? '#F97316' : '#9CA3AF';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  const c = active ? '#F97316' : '#9CA3AF';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" fill={active ? 'rgba(249,115,22,0.08)' : 'none'} />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="3" />
      <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="3" />
      <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="3" />
    </svg>
  );
}

function SettingIcon({ active }: { active: boolean }) {
  const c = active ? '#F97316' : '#9CA3AF';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { href: '/dashboard', label: 'Home',      Icon: HomeIcon      },
  { href: '/insights',  label: 'Analytics', Icon: AnalyticsIcon },
  { href: '/plan',      label: 'Plan',      Icon: PlanIcon      },
  { href: '/settings',  label: 'Setting',   Icon: SettingIcon   },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav"
      aria-label="Navigazione principale"
      style={{ height: `calc(72px + var(--safe-bottom))` }}
    >
      {/* Inner flex row: 2 tabs | center FAB | 2 tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 72,
        paddingLeft: 8,
        paddingRight: 8,
        position: 'relative',
      }}>

        {/* Left 2 tabs */}
        {TABS.slice(0, 2).map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const { Icon } = tab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '8px 4px',
                textDecoration: 'none',
                color: isActive ? '#F97316' : '#9CA3AF',
                position: 'relative',
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-pill"
                  style={{
                    position: 'absolute',
                    inset: '4px 6px',
                    borderRadius: 12,
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.18)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                <Icon active={isActive} />
              </span>
              <span style={{
                position: 'relative', zIndex: 1,
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-ui)',
                color: isActive ? '#F97316' : '#9CA3AF',
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* Center FAB — scanner */}
        <div style={{ width: 72, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Link
            href="/scan"
            prefetch={true}
            aria-label="Scanner alimentare"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #FB923C, #F97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(249,115,22,0.42)',
              transform: 'translateY(-10px)',
              textDecoration: 'none',
              border: '3px solid white',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        </div>

        {/* Right 2 tabs */}
        {TABS.slice(2).map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const { Icon } = tab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '8px 4px',
                textDecoration: 'none',
                color: isActive ? '#F97316' : '#9CA3AF',
                position: 'relative',
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-pill"
                  style={{
                    position: 'absolute',
                    inset: '4px 6px',
                    borderRadius: 12,
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.18)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                <Icon active={isActive} />
              </span>
              <span style={{
                position: 'relative', zIndex: 1,
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-ui)',
                color: isActive ? '#F97316' : '#9CA3AF',
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
