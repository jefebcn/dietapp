'use client';

/**
 * BottomSheet  –  Sliding Panel component (Wanderquest-style)
 *
 * Uses Framer Motion AnimatePresence for enter/exit animations.
 * Supports swipe-to-dismiss via drag gesture.
 * Renders a backdrop that closes the sheet on click.
 */

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Height hint: 'auto' | 'half' | 'full' */
  size?: 'auto' | 'half' | 'full';
}

const sizeStyles: Record<string, string> = {
  auto: 'max-h-[85vh]',
  half: 'h-[50vh]',
  full: 'h-[92vh]',
};

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  size = 'auto',
}: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 80 || info.velocity.y > 500) {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`bottom-sheet-panel ${sizeStyles[size]} overflow-y-auto`}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 38,
              mass: 0.9,
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div
                className="rounded-full"
                style={{
                  width: 40,
                  height: 5,
                  background: '#D1FAE5',
                  border: '1.5px solid #86EFAC',
                }}
              />
            </div>

            {/* Header */}
            {title && (
              <div
                className="flex items-center justify-between px-5 pt-2 pb-4"
                style={{ borderBottom: '2px solid #F0FDF4' }}
              >
                <h2
                  className="text-lg font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: '#14532D',
                  }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Chiudi"
                  className="flex items-center justify-center rounded-full transition-colors"
                  style={{
                    width: 32,
                    height: 32,
                    background: '#F0FDF4',
                    border: '2px solid #86EFAC',
                    color: '#15803D',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
