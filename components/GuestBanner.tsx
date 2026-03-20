'use client';

/**
 * GuestBanner – sticky top banner shown to non-authenticated users.
 * Invites them to register/login without blocking app exploration.
 */

import Link from 'next/link';

export function GuestBanner() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      borderRadius: 16,
      padding: '12px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      boxShadow: '0 4px 14px rgba(139,92,246,0.28)',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
          Stai esplorando NutriTrack
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
          Registrati gratis per salvare i tuoi dati
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <Link href="/login?mode=register" style={{
          fontSize: 12, fontWeight: 700, color: '#7C3AED',
          background: '#fff',
          padding: '7px 14px', borderRadius: 99,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          Registrati
        </Link>
        <Link href="/login" style={{
          fontSize: 12, fontWeight: 600,
          color: 'rgba(255,255,255,0.90)',
          background: 'rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.25)',
          padding: '7px 12px', borderRadius: 99,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          Accedi
        </Link>
      </div>
    </div>
  );
}

/**
 * GuestActionOverlay – shown inline when a guest tries to interact.
 * Wrap around action buttons or show as a modal-like prompt.
 */
export function GuestActionPrompt({ action }: { action: string }) {
  return (
    <div style={{
      background: 'rgba(139,92,246,0.06)',
      border: '1.5px solid rgba(139,92,246,0.25)',
      borderRadius: 16,
      padding: '16px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1917', marginBottom: 4 }}>
        Accedi per {action}
      </p>
      <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
        Crea un account gratuito per iniziare a tracciare
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Link href="/login?mode=register" style={{
          fontSize: 13, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          padding: '9px 20px', borderRadius: 99,
          textDecoration: 'none',
          boxShadow: '0 3px 10px rgba(139,92,246,0.30)',
        }}>
          Registrati gratis
        </Link>
        <Link href="/login" style={{
          fontSize: 13, fontWeight: 600, color: '#6B7280',
          background: '#F3F6F0',
          border: '1px solid #E5EBE0',
          padding: '9px 16px', borderRadius: 99,
          textDecoration: 'none',
        }}>
          Accedi
        </Link>
      </div>
    </div>
  );
}
