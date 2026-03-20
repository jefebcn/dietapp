'use client';

/**
 * app/page.tsx  —  NutriTrack Marketing Landing Page
 *
 * Inspired by top competitor landing pages (MyFitnessPal, Yazio, Lifesum):
 *  • Hero with strong value prop + dual CTA
 *  • Feature highlights grid
 *  • App preview mockup
 *  • Social proof stats
 *  • Bottom CTA
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// ── Feature data ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '📊',
    title: 'Traccia Calorie & Macro',
    desc: 'Proteine, carboidrati e grassi in tempo reale. Obiettivi personalizzati.',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.20)',
  },
  {
    icon: '⚖️',
    title: 'Peso & BMI',
    desc: 'Grafico andamento peso con calcolo BMI automatico e trend settimanali.',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.20)',
  },
  {
    icon: '🔥',
    title: 'Streak Giornalieri',
    desc: 'Non interrompere la catena. Sistema di streak che ti mantiene motivato.',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.20)',
  },
  {
    icon: '📷',
    title: 'Scanner Alimenti',
    desc: 'Scansiona il barcode o fotografa il cibo per aggiungere calorie istantaneamente.',
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.20)',
  },
  {
    icon: '💧',
    title: 'Idratazione',
    desc: 'Tieni traccia dell\'acqua giornaliera con obiettivo 2 L e notifiche rapide.',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.20)',
  },
  {
    icon: '🏆',
    title: 'Contest & Sfide',
    desc: 'Gara con altri utenti, vinci badge e sali in classifica settimanale.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.20)',
  },
];

const STATS = [
  { value: '50K+', label: 'Utenti attivi' },
  { value: '2M+',  label: 'Pasti registrati' },
  { value: '98%',  label: 'Soddisfazione' },
  { value: '4.8★', label: 'Valutazione' },
];

// ── Mock dashboard preview ─────────────────────────────────────────────────────

function AppPreview() {
  return (
    <div style={{
      background: '#F3F6F0',
      borderRadius: 28,
      padding: 16,
      boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      border: '1px solid #E5EBE0',
      maxWidth: 320,
      margin: '0 auto',
    }}>
      {/* Mock header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#FB923C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>M</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1C1917', lineHeight: 1 }}>Marco</p>
            <p style={{ fontSize: 10, color: '#9CA3AF' }}>giovedì 20 marzo</p>
          </div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#EF4444' }}>🔥 7</div>
      </div>

      {/* Calorie ring card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Ring */}
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#F3F6F0" strokeWidth="7"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="#F97316" strokeWidth="7"
              strokeDasharray={`${0.72 * 163.4} ${163.4}`} strokeLinecap="round"
              transform="rotate(-90 32 32)"/>
            <text x="32" y="36" textAnchor="middle" fill="#1C1917" fontSize="12" fontWeight="800">1440</text>
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>Calorie rimaste</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['P','#0EA5E9','72%'],['C','#8B5CF6','68%'],['G','#F59E0B','45%']].map(([l,c,p]) => (
                <div key={l} style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 3 }}>{l}</p>
                  <div style={{ height: 4, background: '#F3F6F0', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: p, background: c, borderRadius: 99 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily challenge card */}
      <div style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', borderRadius: 16, padding: '10px 14px', marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>🎯 Sfida del giorno</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Raggiungi 150g di proteine</p>
        <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 99 }}>
          <div style={{ width: '62%', height: '100%', background: '#fff', borderRadius: 99 }}/>
        </div>
      </div>

      {/* Water widget mini */}
      <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>💧</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({length: 8}).map((_,i) => (
              <div key={i} style={{ flex: 1, height: 14, borderRadius: 4, background: i < 5 ? '#3B82F6' : '#DBEAFE' }}/>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6' }}>1.25 L</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100dvh', background: '#0F0A1E', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,10,30,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            boxShadow: '0 0 16px rgba(139,92,246,0.45)',
          }}>🥗</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-display)' }}>NutriTrack</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard" style={{
            fontSize: 13, fontWeight: 600, color: 'rgba(248,250,252,0.65)',
            textDecoration: 'none', padding: '7px 14px', borderRadius: 99,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>Esplora</Link>
          <Link href="/login" style={{
            fontSize: 13, fontWeight: 700, color: '#fff',
            textDecoration: 'none', padding: '7px 16px', borderRadius: 99,
            background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
            boxShadow: '0 2px 12px rgba(139,92,246,0.40)',
          }}>Accedi</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: 'calc(80px + env(safe-area-inset-top,0px)) 24px 60px',
        textAlign: 'center',
        background: 'linear-gradient(160deg, #0F0A1E 0%, #1A0D2E 50%, #0D1520 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: '40%', right: '5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)', pointerEvents: 'none' }}/>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.30)',
            borderRadius: 99, padding: '5px 14px', marginBottom: 24,
          }}>
            <span style={{ fontSize: 11 }}>⭐</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(248,250,252,0.80)' }}>
              L'app di nutrizione #1 in Italia
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(34px, 8vw, 52px)', fontWeight: 900,
            fontFamily: 'var(--font-display)', lineHeight: 1.1,
            color: '#F8FAFC', marginBottom: 16,
          }}>
            Raggiungi il tuo{' '}
            <span style={{ background: 'linear-gradient(135deg,#F97316,#FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              obiettivo
            </span>
            <br/>con NutriTrack
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 16, color: 'rgba(248,250,252,0.55)', fontWeight: 400,
            lineHeight: 1.6, maxWidth: 380, margin: '0 auto 32px',
          }}>
            Traccia calorie, macro e peso. Costruisci abitudini sane grazie a streak, sfide e analisi intelligenti.
          </p>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 16, color: '#F59E0B' }}>★</span>)}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(248,250,252,0.50)' }}>4.8 · 50.000+ utenti</span>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login?mode=register" style={{
              fontSize: 15, fontWeight: 700, color: '#fff',
              textDecoration: 'none', padding: '14px 28px', borderRadius: 99,
              background: 'linear-gradient(135deg,#F97316,#FB923C)',
              boxShadow: '0 4px 24px rgba(249,115,22,0.45)',
              whiteSpace: 'nowrap',
            }}>
              Inizia gratis — è gratis 🚀
            </Link>
            <Link href="/dashboard" style={{
              fontSize: 15, fontWeight: 600, color: 'rgba(248,250,252,0.80)',
              textDecoration: 'none', padding: '14px 24px', borderRadius: 99,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              whiteSpace: 'nowrap',
            }}>
              Esplora l'app →
            </Link>
          </div>
        </motion.div>

        {/* App preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ marginTop: 48 }}>
          <AppPreview />
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{
        padding: '28px 24px',
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, maxWidth: 480, margin: '0 auto' }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', fontFamily: 'var(--font-display)' }}>{value}</p>
              <p style={{ fontSize: 10, color: 'rgba(248,250,252,0.40)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Funzionalità</p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
            Tutto quello che ti serve<br/>in un'unica app
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, maxWidth: 480, margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setActiveFeature(activeFeature === i ? null : i)}
              style={{
                background: activeFeature === i ? f.bg : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeFeature === i ? f.border : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '16px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: f.bg, border: `1px solid ${f.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 10,
              }}>{f.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>{f.title}</p>
              <p style={{ fontSize: 11, color: 'rgba(248,250,252,0.45)', lineHeight: 1.5 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        padding: '48px 24px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            Inizia in 3 passi
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(248,250,252,0.45)' }}>Semplice, veloce, gratuito</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380, margin: '0 auto' }}>
          {[
            { n: '1', icon: '📝', title: 'Crea il tuo profilo', desc: 'Inserisci obiettivo, peso e altezza. In 30 secondi.' },
            { n: '2', icon: '🍽️', title: 'Registra i pasti', desc: 'Cerca alimenti, scansiona barcode o usa la fotocamera AI.' },
            { n: '3', icon: '📈', title: 'Monitora i progressi', desc: 'Grafico peso, analisi macro, streak e sfide giornaliere.' },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#fff',
                boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
              }}>{step.n}</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                  {step.icon} {step.title}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(248,250,252,0.45)', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{
        padding: 'calc(48px + env(safe-area-inset-bottom,0px)) 24px 48px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.12) 100%)',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <p style={{ fontSize: 26, fontWeight: 900, color: '#F8FAFC', fontFamily: 'var(--font-display)', marginBottom: 8, lineHeight: 1.2 }}>
            Pronto a cambiare<br/>le tue abitudini?
          </p>
          <p style={{ fontSize: 14, color: 'rgba(248,250,252,0.45)', marginBottom: 28 }}>
            Gratis per sempre. Nessuna carta richiesta.
          </p>
          <Link href="/login?mode=register" style={{
            display: 'inline-block',
            fontSize: 16, fontWeight: 700, color: '#fff',
            textDecoration: 'none', padding: '15px 36px', borderRadius: 99,
            background: 'linear-gradient(135deg,#F97316,#FB923C)',
            boxShadow: '0 6px 30px rgba(249,115,22,0.45)',
          }}>
            Registrati gratis →
          </Link>
          <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(248,250,252,0.30)' }}>
            Hai già un account?{' '}
            <Link href="/login" style={{ color: '#8B5CF6', textDecoration: 'none', fontWeight: 600 }}>Accedi</Link>
          </p>
        </motion.div>
      </section>

    </div>
  );
}
