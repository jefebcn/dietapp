'use client';

/**
 * ScannerClient.tsx  –  Food Scanner UI
 *
 * Modes: Scan Food | Barcode | Food Label | Ingredients
 * Uses device camera (getUserMedia) where available.
 * Animated scan line, mode selector, camera controls.
 */

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { addMealAction } from '@/lib/actions/mealActions';

type ScanMode = 'food' | 'barcode' | 'label' | 'ingredients';

interface ScanResult {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

const MODES: { id: ScanMode; label: string; icon: string }[] = [
  { id: 'food',        label: 'Scan Food',   icon: '🍽️' },
  { id: 'barcode',     label: 'Barcode',      icon: '|||' },
  { id: 'label',       label: 'Food Label',  icon: '📋' },
  { id: 'ingredients', label: 'Ingredients', icon: '🌿' },
];

// Simulated scan results for demo
const DEMO_RESULTS: Record<ScanMode, ScanResult> = {
  food: { name: 'Insalata mista', kcal: 45, protein: 2.5, carbs: 6.2, fat: 1.8, portion: '100g' },
  barcode: { name: 'Pasta Barilla', kcal: 351, protein: 13, carbs: 70, fat: 1.5, portion: '100g' },
  label: { name: 'Yogurt greco', kcal: 97, protein: 9, carbs: 3.6, fat: 5, portion: '150g' },
  ingredients: { name: 'Smoothie verdure', kcal: 68, protein: 3, carbs: 12, fat: 0.8, portion: '250ml' },
};

// ── Result sheet ──────────────────────────────────────────────────────────────

const MEAL_TYPES_SCAN = [
  { key: 'colazione', label: 'Colazione', icon: '🌅' },
  { key: 'pranzo',    label: 'Pranzo',    icon: '☀️'  },
  { key: 'cena',      label: 'Cena',      icon: '🌙'  },
  { key: 'spuntino',  label: 'Spuntino',  icon: '🍎'  },
] as const;

function ResultSheet({
  result,
  onDismiss,
  onAdd,
}: {
  result: ScanResult;
  onDismiss: () => void;
  onAdd: (r: ScanResult, mealType: string) => Promise<void>;
}) {
  const [mealType, setMealType] = useState<string>('spuntino');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const macros = [
    { label: 'Carboidrati', value: result.carbs,   color: '#8B5CF6' },
    { label: 'Proteine',    value: result.protein,  color: '#0EA5E9' },
    { label: 'Grassi',      value: result.fat,      color: '#F59E0B' },
  ];

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      await onAdd(result, mealType);
    } catch {
      setSaveError('Errore durante il salvataggio. Riprova.');
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: '20px 24px 32px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        zIndex: 30,
      }}
    >
      {/* Handle */}
      <div style={{ width: 40, height: 4, borderRadius: 99, background: '#E5EBE0', margin: '0 auto 20px' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1C1917' }}>{result.name}</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{result.portion}</p>
        </div>
        <div style={{ background: 'rgba(249,115,22,0.10)', borderRadius: 14, padding: '8px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#F97316', lineHeight: 1 }}>{result.kcal}</p>
          <p style={{ fontSize: 10, color: '#F97316', fontWeight: 600, textAlign: 'center' }}>kcal</p>
        </div>
      </div>

      {/* Macro pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {macros.map((m) => (
          <div key={m.label} style={{ flex: 1, background: `${m.color}12`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.value}g</p>
            <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Meal type selector */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Aggiungi a
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {MEAL_TYPES_SCAN.map((t) => (
            <button
              key={t.key}
              onClick={() => setMealType(t.key)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 12, border: 'none',
                background: mealType === t.key ? '#F97316' : '#F3F6F0',
                color: mealType === t.key ? '#fff' : '#6B7280',
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {saveError && (
        <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, textAlign: 'center', marginBottom: 10 }}>
          ⚠️ {saveError}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onDismiss}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14, border: '1.5px solid #E5EBE0',
            background: 'transparent', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, color: '#6B7280',
          }}
        >
          Scansiona ancora
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
            background: saving ? 'rgba(249,115,22,0.40)' : 'linear-gradient(145deg, #FB923C, #F97316)',
            cursor: saving ? 'default' : 'pointer',
            fontSize: 14, fontWeight: 700, color: '#fff',
            boxShadow: saving ? 'none' : '0 4px 14px rgba(249,115,22,0.32)',
          }}
        >
          {saving ? '⏳ Salvando...' : '+ Aggiungi al diario'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScannerClient() {
  const [mode, setMode]           = useState<ScanMode>('food');
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState<ScanResult | null>(null);
  const [added, setAdded]         = useState(false);
  const [addedName, setAddedName] = useState('');
  const [flash, setFlash]         = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef                  = useRef<HTMLVideoElement>(null);
  const streamRef                 = useRef<MediaStream | null>(null);

  // Step 1: request camera access and store the stream.
  // We must NOT try to set videoRef.current.srcObject here because the
  // <video> element is only rendered once hasCamera = true (it's conditional).
  // Setting hasCamera triggers a re-render that mounts the <video>, then
  // Step 2 attaches the stream via a separate useEffect.
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera non disponibile su questo dispositivo.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setHasCamera(true); // triggers re-render → <video> mounts → Step 2 runs
    } catch (err: unknown) {
      const msg = (err as { name?: string })?.name;
      if (msg === 'NotAllowedError' || msg === 'PermissionDeniedError') {
        setCameraError('Permesso fotocamera negato. Abilita l\'accesso nelle impostazioni del browser.');
      } else if (msg === 'NotFoundError' || msg === 'DevicesNotFoundError') {
        setCameraError('Nessuna fotocamera trovata su questo dispositivo.');
      } else {
        setCameraError('Impossibile avviare la fotocamera.');
      }
      setHasCamera(false);
    }
  }, []);

  // Step 2: once the <video> element is in the DOM, attach the stream.
  useEffect(() => {
    if (hasCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [hasCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // Simulate scan
  function handleScan() {
    if (result) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult(DEMO_RESULTS[mode]);
    }, 2200);
  }

  async function handleAdd(r: ScanResult, mealType: string) {
    const today = new Date().toISOString().split('T')[0];
    const res = await addMealAction(today, {
      name: r.name,
      kcal: r.kcal,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      qty: parseFloat(r.portion) || 100,
      unit: r.portion.replace(/[\d.]/g, '').trim() || 'g',
      source: 'barcode',
      mealType,
    });
    if (res.success) {
      setAddedName(r.name);
      setResult(null);
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } else {
      throw new Error(res.error);
    }
  }

  function toggleFlash() {
    const newFlash = !flash;
    setFlash(newFlash);
    // Apply torch constraint on the active camera track where supported (mobile Chrome/Android)
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.applyConstraints({ advanced: [{ torch: newFlash } as MediaTrackConstraintSet] }).catch(() => {
        // torch not supported on this device/browser — silently ignore
      });
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: '#111', overflow: 'hidden' }}>

      {/* ── Camera / viewfinder ── */}
      <div style={{ position: 'relative', height: 'calc(100dvh - 220px)', overflow: 'hidden' }}>
        {/* Always render <video> so videoRef is available when hasCamera becomes true */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: hasCamera ? 'block' : 'none',
          }}
        />
        {/* Fallback shown while camera is loading or unavailable */}
        {!hasCamera && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&q=80"
              alt="Food to scan"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {cameraError && (
              <div style={{
                position: 'absolute', bottom: 20, left: 16, right: 16,
                background: 'rgba(0,0,0,0.72)', borderRadius: 14,
                padding: '10px 14px',
                backdropFilter: 'blur(8px)',
              }}>
                <p style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 600, textAlign: 'center' }}>
                  ⚠️ {cameraError}
                </p>
                <button
                  onClick={() => { setCameraError(''); setHasCamera(false); startCamera(); }}
                  style={{
                    display: 'block', margin: '8px auto 0',
                    fontSize: 11, fontWeight: 700, color: '#F97316',
                    background: 'rgba(249,115,22,0.15)',
                    border: '1px solid rgba(249,115,22,0.30)',
                    borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
                  }}
                >
                  Riprova
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scan frame overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.50) 100%)',
        }} />

        {/* Viewfinder corners */}
        <div style={{ position: 'absolute', inset: '15% 12%', borderRadius: 20, overflow: 'hidden' }}>
          {/* Corners */}
          {[
            { top: 0, left: 0, borderTop: '3px solid #F97316', borderLeft: '3px solid #F97316', borderRadius: '12px 0 0 0' },
            { top: 0, right: 0, borderTop: '3px solid #F97316', borderRight: '3px solid #F97316', borderRadius: '0 12px 0 0' },
            { bottom: 0, left: 0, borderBottom: '3px solid #F97316', borderLeft: '3px solid #F97316', borderRadius: '0 0 0 12px' },
            { bottom: 0, right: 0, borderBottom: '3px solid #F97316', borderRight: '3px solid #F97316', borderRadius: '0 0 12px 0' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s as React.CSSProperties }} />
          ))}

          {/* Animated scan line */}
          {scanning && (
            <motion.div
              className="scan-line"
              style={{
                position: 'absolute', left: 0, right: 0,
                height: 2.5,
                background: 'linear-gradient(90deg, transparent, #22C55E, #22C55E, transparent)',
                boxShadow: '0 0 8px rgba(34,197,94,0.70)',
              }}
              animate={{ top: ['8%', '84%', '8%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Header overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '52px 20px 16px',
        }}>
          <Link href="/dashboard" style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Scanner</p>
          <div style={{ width: 38, height: 38 }} />
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {added && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#22C55E', color: '#fff',
                borderRadius: 20, padding: '18px 28px',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(34,197,94,0.45)',
              }}
            >
              <p style={{ fontSize: 28, marginBottom: 4 }}>✅</p>
              <p style={{ fontSize: 15, fontWeight: 800 }}>Aggiunto al diario!</p>
              {addedName && <p style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{addedName}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom panel ── */}
      <div style={{
        background: '#1A1A1A',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        position: 'relative',
      }}>

        {/* Mode selector */}
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '16px 16px 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {MODES.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setResult(null); setScanning(false); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 14px', borderRadius: 14, border: 'none',
                  background: isActive ? '#F97316' : 'rgba(255,255,255,0.08)',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.18s',
                }}
              >
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Camera controls row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '12px 24px 8px',
        }}>
          {/* Gallery */}
          <button
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.10)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Shutter */}
          <button
            onClick={handleScan}
            disabled={scanning || !!result}
            style={{
              width: 68, height: 68, borderRadius: '50%',
              background: '#fff', border: '4px solid rgba(255,255,255,0.30)',
              cursor: scanning ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.15)',
              transition: 'transform 0.1s',
              transform: scanning ? 'scale(0.94)' : 'scale(1)',
            }}
          >
            {scanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '3px solid #F97316',
                  borderTopColor: 'transparent',
                }}
              />
            ) : (
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: '#F97316',
              }} />
            )}
          </button>

          {/* Flash */}
          <button
            onClick={toggleFlash}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: flash ? 'rgba(249,115,22,0.30)' : 'rgba(255,255,255,0.10)',
              border: flash ? '1px solid rgba(249,115,22,0.50)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={flash ? '#F97316' : 'none'}
              stroke={flash ? '#F97316' : 'white'} strokeWidth="2" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </button>
        </div>

      </div>

      {/* ── Result bottom sheet ── */}
      <AnimatePresence>
        {result && (
          <ResultSheet
            result={result}
            onDismiss={() => { setResult(null); setScanning(false); }}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
