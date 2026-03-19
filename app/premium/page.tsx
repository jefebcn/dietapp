'use client';

/**
 * /app/premium/page.tsx  –  Premium Subscription Page (light healthy theme)
 *
 * Design inspired by top app premium pages (Yazio, Cronometer, Lifesum):
 *  • Hero with gradient + feature highlights
 *  • Clear pricing: €4,99/mese with trial
 *  • Free vs Premium comparison
 *  • FAQ section
 *  • Strong CTA
 *
 * Pricing: €4,99/mese · €39,99/anno (save 33%)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🤖',
    title: 'Analisi AI illimitata',
    desc: 'Claude AI analizza ogni pasto e ti fornisce consigli nutrizionali personalizzati senza limiti.',
    color: '139,92,246',
  },
  {
    icon: '📊',
    title: 'Grafici e report avanzati',
    desc: 'Visualizza tendenze a 30/90 giorni, distribuzione macro, andamento peso e molto altro.',
    color: '14,165,233',
  },
  {
    icon: '🍽️',
    title: 'Piani pasto AI',
    desc: 'L\'AI crea piani pasto settimanali personalizzati in base ai tuoi obiettivi e gusti.',
    color: '34,197,94',
  },
  {
    icon: '🏆',
    title: 'Accesso tutte le leghe',
    desc: 'Gareggia in Silver, Gold e Platinum e guadagna NutriPoints con moltiplicatori bonus.',
    color: '245,158,11',
  },
  {
    icon: '🧊',
    title: 'Streak Freeze illimitati',
    desc: 'Non perdere mai la tua streak. Con Premium hai freeze illimitati per mantenerla sempre attiva.',
    color: '14,165,233',
  },
  {
    icon: '📱',
    title: 'Scanner avanzato',
    desc: 'Scansiona codici a barre con accesso al database di oltre 8 milioni di alimenti.',
    color: '168,85,247',
  },
  {
    icon: '⚡',
    title: 'Accesso anticipato',
    desc: 'Prova le nuove funzionalità prima di tutti gli altri utenti.',
    color: '245,158,11',
  },
  {
    icon: '💬',
    title: 'Supporto prioritario',
    desc: 'Assistenza dedicata con risposta in meno di 24 ore tramite chat.',
    color: '139,92,246',
  },
];

const FAQ = [
  {
    q: 'Posso cancellare in qualsiasi momento?',
    a: 'Sì, puoi cancellare l\'abbonamento in qualsiasi momento. L\'accesso Premium rimane attivo fino alla fine del periodo pagato.',
  },
  {
    q: 'La prova gratuita richiede la carta di credito?',
    a: 'No! Puoi iniziare i 7 giorni di prova senza inserire nessuna carta. Al termine della prova, scegli se continuare con Premium o restare sul piano gratuito.',
  },
  {
    q: 'Cosa succede ai miei dati se cancello?',
    a: 'I tuoi dati rimangono al sicuro. Se torni a Premium in futuro, ritroverai tutto esattamente com\'era.',
  },
  {
    q: 'Il piano annuale si rinnova automaticamente?',
    a: 'Sì, entrambi i piani si rinnovano automaticamente. Riceverai un promemoria via email 7 giorni prima del rinnovo.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E5EBE0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>{q}</span>
        <motion.svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#9CA3AF" strokeWidth="2.5"
          animate={{ rotate: open ? 180 : 0 }}
        >
          <path d="M6 9l6 6 6-6"/>
        </motion.svg>
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-3"
          style={{ borderTop: '1px solid #E5EBE0' }}
        >
          <p className="text-sm pt-2 leading-relaxed" style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>{a}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function PremiumPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(243,246,240,0.92)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid #E5EBE0',
        }}>
        <a href="/profile"
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5EBE0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </a>
        <h1 className="text-base" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
          ✨ NutriTrack Premium
        </h1>
        <div style={{ width: 36 }}/>
      </div>

      <main className="max-w-lg mx-auto px-4 pb-20">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)' }}>
            <span className="text-sm">✨</span>
            <span className="text-xs font-bold" style={{ color: '#D97706', fontFamily: 'var(--font-ui)' }}>
              7 giorni GRATIS poi €4,99/mese
            </span>
          </div>

          <h2 className="text-3xl mb-3 leading-tight" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
            Porta la tua nutrizione al livello superiore
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
            Analisi AI illimitata, piani pasto personalizzati, grafici avanzati e molto altro.
          </p>
        </motion.div>

        {/* ── Billing Toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.10 }}
          className="flex gap-1 p-1 mb-4 rounded-2xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5EBE0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          {[
            { key: 'monthly', label: 'Mensile', price: '€4,99/mese' },
            { key: 'yearly', label: 'Annuale', price: '€39,99/anno', badge: '−33%' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setBilling(opt.key as 'monthly' | 'yearly')}
              className="flex-1 py-3 rounded-xl transition-all"
              style={{
                background: billing === opt.key ? '#F97316' : 'transparent',
                border: billing === opt.key ? '1px solid rgba(249,115,22,0.30)' : '1px solid transparent',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: billing === opt.key ? '#FFFFFF' : '#6B7280' }}>
                  {opt.label}
                </span>
                {'badge' in opt && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#16A34A' }}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: billing === opt.key ? 'rgba(255,255,255,0.80)' : '#9CA3AF', fontFamily: 'var(--font-ui)' }}>
                {opt.price}
              </p>
            </button>
          ))}
        </motion.div>

        {/* ── Price Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="relative overflow-hidden rounded-3xl mb-5"
          style={{
            background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)',
            border: '1.5px solid #FDE68A',
            boxShadow: '0 4px 16px rgba(245,158,11,0.12)',
          }}
        >
          <div className="p-5">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-black" style={{ color: '#F97316', fontFamily: 'var(--font-display)' }}>
                {billing === 'monthly' ? '€4,99' : '€3,33'}
              </span>
              <span className="text-sm mb-1.5" style={{ color: '#9CA3AF', fontFamily: 'var(--font-ui)' }}>
                /mese{billing === 'yearly' ? ' (fatturato annualmente)' : ''}
              </span>
            </div>
            {billing === 'yearly' && (
              <p className="text-xs mb-3" style={{ color: '#16A34A', fontFamily: 'var(--font-ui)' }}>
                ✓ Risparmi €19,89 rispetto al mensile
              </p>
            )}

            <a
              href="/login"
              className="block w-full py-4 rounded-2xl text-center text-base font-bold mb-3"
              style={{
                background: 'linear-gradient(145deg, #F97316, #EA6C0A)',
                color: '#fff',
                fontFamily: 'var(--font-ui)',
                boxShadow: '0 4px 0 rgba(234,108,10,0.30), 0 8px 24px rgba(249,115,22,0.18)',
              }}
            >
              🚀 Inizia 7 giorni gratuiti
            </a>
            <p className="text-center text-xs" style={{ color: '#9CA3AF', fontFamily: 'var(--font-ui)' }}>
              Nessuna carta richiesta · Cancella quando vuoi
            </p>
          </div>
        </motion.div>

        {/* ── Features Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-5"
        >
          <h3 className="text-base font-bold mb-3 px-1" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
            Tutto incluso in Premium
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.20 + i * 0.04 }}
                className="p-3.5 rounded-2xl"
                style={{
                  background: '#FFFFFF',
                  border: `1px solid rgba(${feat.color},0.18)`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl mb-2.5"
                  style={{ background: `rgba(${feat.color},0.10)`, border: `1px solid rgba(${feat.color},0.20)` }}>
                  {feat.icon}
                </div>
                <p className="text-xs font-bold mb-1" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
                  {feat.title}
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Free vs Premium ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.30 }}
          className="p-4 rounded-2xl mb-5"
          style={{ background: '#FFFFFF', border: '1px solid #E5EBE0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          {/* Header labels */}
          <div className="flex items-center pb-2 mb-0" style={{ borderBottom: '1px solid #E5EBE0' }}>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
                Confronto piani
              </h3>
            </div>
            <div className="flex gap-6 pl-4">
              <div className="w-16 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Gratuito</span>
              </div>
              <div className="w-16 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#F97316' }}>Premium</span>
              </div>
            </div>
          </div>
          <div className="space-y-0 mt-2">
            {[
              { feature: 'Tracciamento calorie & macro',          free: true,  premium: true },
              { feature: 'Diario alimentare',                     free: true,  premium: true },
              { feature: 'Streak giornaliero',                    free: true,  premium: true },
              { feature: 'Lega Bronze',                           free: true,  premium: true },
              { feature: 'Analisi AI',                            free: '5/mese', premium: 'Illimitata' },
              { feature: 'Accesso tutte le leghe',                free: false, premium: true },
              { feature: 'Grafici avanzati (30/90 giorni)',       free: false, premium: true },
              { feature: 'Piani pasto AI',                        free: false, premium: true },
              { feature: 'Streak Freeze',                         free: '1/mese', premium: 'Illimitati' },
              { feature: 'Report settimanale AI',                 free: false, premium: true },
              { feature: 'Scanner codici a barre avanzato',      free: false, premium: true },
              { feature: 'Supporto prioritario',                  free: false, premium: true },
            ].map((row, i, arr) => (
              <div key={row.feature}
                className="flex items-center py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #F3F6F0' : 'none' }}>
                <span className="flex-1 text-xs" style={{ color: '#6B7280', fontFamily: 'var(--font-ui)' }}>
                  {row.feature}
                </span>
                <div className="flex gap-6 pl-4">
                  <div className="w-16 text-center">
                    {typeof row.free === 'string'
                      ? <span className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>{row.free}</span>
                      : row.free
                      ? <span className="text-[11px]" style={{ color: '#22C55E' }}>✓</span>
                      : <span className="text-[11px]" style={{ color: '#D1D5DB' }}>—</span>
                    }
                  </div>
                  <div className="w-16 text-center">
                    {typeof row.premium === 'string'
                      ? <span className="text-[10px] font-bold" style={{ color: '#F97316' }}>{row.premium}</span>
                      : row.premium
                      ? <span className="text-[11px]" style={{ color: '#22C55E' }}>✓</span>
                      : <span className="text-[11px]" style={{ color: '#D1D5DB' }}>—</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Social Proof ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="mb-5"
        >
          {[
            { name: 'Sofia M.', text: 'I piani pasto AI mi hanno cambiato la vita. In 2 mesi ho raggiunto i miei obiettivi!', stars: 5 },
            { name: 'Andrea P.', text: 'I grafici avanzati mi aiutano a capire esattamente dove migliorare. Vale ogni centesimo.', stars: 5 },
          ].map((review) => (
            <div key={review.name} className="p-4 rounded-2xl mb-2.5"
              style={{ background: '#FFFFFF', border: '1px solid #E5EBE0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex gap-px mb-1.5">
                {Array.from({ length: review.stars }).map((_, i) => (
                  <span key={i} className="text-[11px]">⭐</span>
                ))}
              </div>
              <p className="text-xs leading-relaxed mb-1.5" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
                &ldquo;{review.text}&rdquo;
              </p>
              <p className="text-[10px] font-bold" style={{ color: '#9CA3AF', fontFamily: 'var(--font-ui)' }}>
                — {review.name}, Premium
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── FAQ ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.40 }}
          className="mb-6"
        >
          <h3 className="text-sm font-bold mb-3 px-1" style={{ color: '#1C1917', fontFamily: 'var(--font-ui)' }}>
            Domande frequenti
          </h3>
          <div className="space-y-2">
            {FAQ.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a}/>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="text-center"
        >
          <a href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold"
            style={{
              background: 'linear-gradient(145deg, #F97316, #EA6C0A)',
              color: '#fff',
              fontFamily: 'var(--font-ui)',
              border: '1px solid rgba(249,115,22,0.30)',
              boxShadow: '0 4px 0 rgba(234,108,10,0.30), 0 12px 40px rgba(249,115,22,0.20)',
            }}>
            🚀 Inizia 7 giorni gratis
          </a>
          <p className="text-xs mt-2" style={{ color: '#9CA3AF', fontFamily: 'var(--font-ui)' }}>
            Poi {billing === 'monthly' ? '€4,99/mese' : '€39,99/anno'} · Cancella quando vuoi
          </p>
        </motion.div>

      </main>
    </div>
  );
}
