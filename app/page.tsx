'use client';

/**
 * NutriTrack Landing Page  —  Public, no auth required.
 *
 * Competitor-inspired design analysis:
 *  • MyFitnessPal: Prominent calorie ring, meal categories, large food database
 *  • Cronometer: Scientific detail, clean charts, micronutrient focus
 *  • Noom: Gamified psychology-based approach, colorful, engaging
 *  • Yazio: European, clean, fasting + meal planning, 5-tab navigation
 *  • Lifesum: Scandinavian minimal, food quality scores, beautiful imagery
 *
 * NutriTrack differentiators:
 *  → Claude AI nutrition analysis (unique)
 *  → Dark premium glass aesthetic (premium feel)
 *  → League gamification (engagement driver)
 *  → Italian-first UX
 */

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// ── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = target / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString('it-IT')}{suffix}</span>;
}

// ── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, color, delay }: {
  icon: string; title: string; desc: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="p-5 rounded-3xl relative overflow-hidden"
      style={{
        background: `rgba(${color},0.08)`,
        border: `1px solid rgba(${color},0.22)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
        style={{
          background: `rgba(${color},0.18)`,
          border: `1px solid rgba(${color},0.30)`,
        }}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold mb-1.5" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,250,252,0.60)', fontFamily: 'var(--font-ui)' }}>
        {desc}
      </p>
    </motion.div>
  );
}

// ── Mock phone screen ─────────────────────────────────────────────────────────

function PhonePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="relative mx-auto"
      style={{ width: 220, filter: 'drop-shadow(0 40px 80px rgba(139,92,246,0.55))' }}
    >
      {/* Phone frame */}
      <div
        className="relative rounded-[2.5rem] overflow-hidden"
        style={{
          width: 220, height: 440,
          background: '#0A0D1A',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 0 0 1px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-5 pt-3 pb-1">
          <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-1.5 rounded-sm" style={{ background: 'rgba(255,255,255,0.4)' }} />
            <div className="w-1 h-1.5 rounded-sm" style={{ background: 'rgba(255,255,255,0.4)' }} />
          </div>
        </div>

        {/* Header */}
        <div className="px-4 py-2">
          <p className="text-[9px]" style={{ color: 'rgba(248,250,252,0.45)' }}>mercoledì 18 marzo</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>Ciao, Marco!</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.20)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.35)' }}>🔥 12</span>
          </div>
        </div>

        {/* Calorie ring area */}
        <div className="mx-4 p-3 rounded-2xl mb-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 56, height: 56 }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
                <circle cx="28" cy="28" r="22" fill="none" stroke="url(#lg)" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray="138" strokeDashoffset="42"
                  transform="rotate(-90 28 28)"/>
                <defs>
                  <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B"/>
                    <stop offset="100%" stopColor="#FCD34D"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-black" style={{ color: '#FCD34D' }}>1.640</span>
                <span className="text-[7px]" style={{ color: 'rgba(248,250,252,0.5)' }}>kcal</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                { l: 'Prot', v: 78, max: 150, c: '#22D3EE' },
                { l: 'Carb', v: 195, max: 200, c: '#FB923C' },
                { l: 'Gras', v: 42, max: 65, c: '#F87171' },
              ].map((m) => (
                <div key={m.l}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[8px] font-bold" style={{ color: m.c }}>{m.l}</span>
                    <span className="text-[8px]" style={{ color: 'rgba(248,250,252,0.4)' }}>{m.v}g</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(m.v/m.max)*100}%`, background: m.c, boxShadow: `0 0 6px ${m.c}80` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Meals list */}
        <div className="mx-4 space-y-1.5">
          {[
            { name: 'Uova e avocado', kcal: 380, time: '08:30' },
            { name: 'Petto di pollo', kcal: 290, time: '13:00' },
            { name: 'Insalata mista', kcal: 120, time: '13:15' },
          ].map((meal) => (
            <div key={meal.name} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div>
                <p className="text-[10px] font-bold" style={{ color: '#F8FAFC' }}>{meal.name}</p>
                <p className="text-[8px]" style={{ color: 'rgba(248,250,252,0.4)' }}>{meal.time}</p>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.18)', color: '#FCD34D' }}>{meal.kcal}</span>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-3 py-2"
          style={{ background: 'rgba(8,11,20,0.92)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {['🏠','📋','📊','🏆','👤'].map((icon, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[14px]" style={{ opacity: i === 0 ? 1 : 0.35 }}>{icon}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Glow behind phone */}
      <div className="absolute inset-0 rounded-[2.5rem]" style={{
        background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 70%)',
        filter: 'blur(30px)', zIndex: -1, transform: 'scale(1.2)',
      }} />
    </motion.div>
  );
}

// ── Premium tier card ─────────────────────────────────────────────────────────

function PremiumCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl p-0.5"
      style={{
        background: 'linear-gradient(145deg, rgba(245,158,11,0.8), rgba(139,92,246,0.8), rgba(34,211,238,0.8))',
      }}
    >
      <div className="rounded-[calc(1.5rem-2px)] p-6"
        style={{
          background: 'linear-gradient(145deg, #0D0A2E, #080B14)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
          style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <span className="text-sm">✨</span>
          <span className="text-xs font-bold" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>Premium</span>
        </div>

        <h3 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
          Sblocca tutto
        </h3>
        <p className="text-sm mb-5" style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>
          Il tuo coach nutrizionale completo
        </p>

        <div className="space-y-2.5 mb-6">
          {[
            { icon: '🤖', text: 'Analisi AI illimitata con Claude' },
            { icon: '📊', text: 'Grafici avanzati e report settimanali' },
            { icon: '🍽️', text: 'Piani pasto personalizzati' },
            { icon: '📱', text: 'Scanner codici a barre avanzato' },
            { icon: '🏆', text: 'Accesso a tutte le leghe premium' },
            { icon: '⚡', text: 'Streak freeze illimitati' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm" style={{ color: 'rgba(248,250,252,0.80)', fontFamily: 'var(--font-ui)' }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2 mb-5">
          <span className="text-4xl font-black" style={{ color: '#FCD34D', fontFamily: 'var(--font-display)' }}>€4,99</span>
          <span className="text-sm mb-1.5" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>/mese</span>
        </div>

        <a href="/login"
          className="block w-full py-3.5 rounded-2xl text-center text-sm font-bold"
          style={{
            background: 'linear-gradient(145deg, #F59E0B, #D97706)',
            color: '#fff',
            fontFamily: 'var(--font-ui)',
            boxShadow: '0 4px 0 rgba(146,64,14,0.70), 0 8px 28px rgba(245,158,11,0.35)',
          }}
        >
          🚀 Inizia 7 giorni gratuiti
        </a>
        <p className="text-center text-xs mt-2" style={{ color: 'rgba(248,250,252,0.35)', fontFamily: 'var(--font-ui)' }}>
          Nessuna carta richiesta per la prova
        </p>
      </div>
    </motion.div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(8,11,20,0)', 'rgba(8,11,20,0.95)']);

  return (
    <div className="relative min-h-screen overflow-x-hidden">

      {/* ── Sticky Nav ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: headerBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.40), rgba(109,40,217,0.60))', border: '1px solid rgba(167,139,250,0.35)' }}>
            🥗
          </div>
          <span className="text-lg" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>NutriTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/login"
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ color: 'rgba(248,250,252,0.65)', fontFamily: 'var(--font-ui)' }}>
            Accedi
          </a>
          <a href="/login"
            className="px-4 py-1.5 rounded-xl text-xs font-bold"
            style={{
              background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)',
              color: '#fff',
              fontFamily: 'var(--font-ui)',
              boxShadow: '0 3px 0 rgba(91,33,182,0.60)',
            }}>
            Inizia Gratis
          </a>
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center">
        {/* Extra orb for hero */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 65%)',
            filter: 'blur(60px)' }} />

        {/* Social proof pill */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            background: 'rgba(52,211,153,0.10)',
            border: '1px solid rgba(52,211,153,0.30)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="flex gap-px">
            {['🟢','🟢','🟢','🟢','🟢'].map((_, i) => (
              <span key={i} className="text-[10px]">⭐</span>
            ))}
          </span>
          <span className="text-xs font-bold" style={{ color: '#34D399', fontFamily: 'var(--font-ui)' }}>
            12.000+ utenti attivi in Italia
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl mb-4 leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            color: '#F8FAFC',
            textShadow: '0 0 60px rgba(139,92,246,0.40)',
            maxWidth: 480,
          }}
        >
          Il tuo coach{' '}
          <span style={{
            background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            nutrizionale
          </span>{' '}
          personale
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg mb-8 max-w-xs mx-auto leading-relaxed"
          style={{ color: 'rgba(248,250,252,0.60)', fontFamily: 'var(--font-ui)' }}
        >
          Traccia calorie e macro, analizza i pasti con l&apos;AI, competi nelle leghe e raggiungi i tuoi obiettivi.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <a href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold"
            style={{
              background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)',
              color: '#fff',
              fontFamily: 'var(--font-ui)',
              border: '1px solid rgba(196,181,253,0.30)',
              boxShadow: '0 4px 0 rgba(91,33,182,0.70), 0 8px 32px rgba(139,92,246,0.40)',
            }}>
            🚀 Inizia Gratis
          </a>
          <a href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(248,250,252,0.78)',
              fontFamily: 'var(--font-ui)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}>
            Accedi →
          </a>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 mb-2"
        >
          <PhonePreview />
        </motion.div>

        {/* Stats floating cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-wrap justify-center gap-3 mt-8"
        >
          {[
            { value: 12000, label: 'Utenti', suffix: '+' },
            { value: 4, label: 'Stelle', suffix: '.8/5 ★' },
            { value: 500000, label: 'Pasti', suffix: '+' },
          ].map((stat) => (
            <div key={stat.label}
              className="px-4 py-2.5 rounded-2xl text-center"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
              }}>
              <p className="text-lg font-black" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-xs" style={{ color: 'rgba(248,250,252,0.45)', fontFamily: 'var(--font-ui)' }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative px-4 py-16 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
            Tutto quello che ti serve
          </h2>
          <p className="text-sm" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>
            Progettato per renderti facile raggiungere i tuoi obiettivi
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <FeatureCard
            icon="🧠" title="AI Nutrition" delay={0}
            color="139,92,246"
            desc="Claude AI analizza i tuoi pasti e ti dà consigli nutrizionali personalizzati."
          />
          <FeatureCard
            icon="📊" title="Macro Tracker" delay={0.08}
            color="34,211,238"
            desc="Monitoraggio completo di calorie, proteine, carboidrati e grassi."
          />
          <FeatureCard
            icon="🏆" title="Leghe & Premi" delay={0.16}
            color="168,85,247"
            desc="Compete con altri utenti e scala le leghe Bronze → Platinum."
          />
          <FeatureCard
            icon="🔥" title="Streak Giornalieri" delay={0.24}
            color="245,158,11"
            desc="Mantieni la tua striscia giornaliera e sblocca badge esclusivi."
          />
          <FeatureCard
            icon="⚖️" title="Peso & BMI" delay={0.32}
            color="52,211,153"
            desc="Traccia il peso, calcola il BMI e visualizza la tendenza settimanale."
          />
          <FeatureCard
            icon="💧" title="Idratazione" delay={0.40}
            color="34,211,238"
            desc="Monitora l'apporto di acqua giornaliero con un click."
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative px-4 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
            Come funziona
          </h2>
        </motion.div>

        <div className="space-y-4">
          {[
            { num: '01', title: 'Crea il tuo profilo', desc: 'Inserisci i tuoi obiettivi: perdita di peso, mantenimento o massa muscolare.', icon: '👤', color: '139,92,246' },
            { num: '02', title: 'Registra i pasti', desc: 'Cerca alimenti, scansiona barcode o fotografa il piatto per l\'analisi AI.', icon: '📋', color: '34,211,238' },
            { num: '03', title: 'Monitora i progressi', desc: 'Visualizza grafici, streak e scala le leghe mentre migliori la tua nutrizione.', icon: '📈', color: '52,211,153' },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="flex items-start gap-4 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: `rgba(${step.color},0.18)`, border: `1px solid rgba(${step.color},0.30)` }}>
                {step.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold mb-0.5" style={{ color: `rgba(${step.color},0.80)`, fontFamily: 'var(--font-ui)' }}>STEP {step.num}</p>
                <p className="text-sm font-bold mb-1" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative px-4 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
            Cosa dicono gli utenti
          </h2>
        </motion.div>

        <div className="space-y-3">
          {[
            { name: 'Marco R.', city: 'Milano', text: 'Finalmente un\'app che capisce la nutrizione italiana! Il tracciamento AI è fantastico.', stars: 5, color: '139,92,246' },
            { name: 'Giulia T.', city: 'Roma', text: 'Le leghe mi motivano tantissimo. In 3 mesi sono arrivata a Platinum!', stars: 5, color: '168,85,247' },
            { name: 'Luca B.', city: 'Torino', text: 'Design bellissimo e facile da usare. La streak mi mantiene costante ogni giorno.', stars: 5, color: '34,211,238' },
          ].map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.10 }}
              className="p-4 rounded-2xl"
              style={{
                background: `rgba(${review.color},0.06)`,
                border: `1px solid rgba(${review.color},0.18)`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `rgba(${review.color},0.25)`, color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#F8FAFC', fontFamily: 'var(--font-ui)' }}>{review.name}</p>
                  <p className="text-[9px]" style={{ color: 'rgba(248,250,252,0.40)', fontFamily: 'var(--font-ui)' }}>{review.city}</p>
                </div>
                <div className="ml-auto flex">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <span key={j} className="text-[10px]">⭐</span>
                  ))}
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,250,252,0.70)', fontFamily: 'var(--font-ui)' }}>
                &ldquo;{review.text}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Premium Section ── */}
      <section className="relative px-4 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
            Porta la nutrizione al livello successivo
          </h2>
          <p className="text-sm" style={{ color: 'rgba(248,250,252,0.50)', fontFamily: 'var(--font-ui)' }}>
            Accesso completo con NutriTrack Premium
          </p>
        </motion.div>

        {/* Free vs Premium comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <p className="text-xs font-bold mb-3" style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>✦ GRATUITO</p>
            {[
              'Traccia calorie & macro',
              'Diario alimentare',
              'Streak giornaliero',
              'Lega Bronze',
              '5 analisi AI/mese',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 mb-2">
                <span className="text-[10px]" style={{ color: '#34D399' }}>✓</span>
                <span className="text-xs" style={{ color: 'rgba(248,250,252,0.60)', fontFamily: 'var(--font-ui)' }}>{f}</span>
              </div>
            ))}
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(139,92,246,0.15), rgba(245,158,11,0.10))',
              border: '1px solid rgba(245,158,11,0.35)',
            }}
          >
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.25)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.40)' }}>
                ✨ PRO
              </span>
            </div>
            <p className="text-xs font-bold mb-3" style={{ color: '#FCD34D', fontFamily: 'var(--font-ui)' }}>✦ PREMIUM</p>
            {[
              'Tutto del piano Free',
              'AI illimitata',
              'Grafici avanzati',
              'Piani pasto AI',
              'Tutte le leghe',
              'Streak freeze ∞',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 mb-2">
                <span className="text-[10px]" style={{ color: '#FCD34D' }}>★</span>
                <span className="text-xs" style={{ color: 'rgba(248,250,252,0.80)', fontFamily: 'var(--font-ui)' }}>{f}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <PremiumCard />
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-4 py-16 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-8 rounded-3xl"
          style={{
            background: 'linear-gradient(145deg, rgba(139,92,246,0.15), rgba(34,211,238,0.08))',
            border: '1px solid rgba(139,92,246,0.30)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="text-4xl mb-4">🥗</div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC' }}>
            Inizia oggi, gratis
          </h2>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-ui)' }}>
            Unisciti a migliaia di italiani che stanno migliorando la loro nutrizione con NutriTrack.
          </p>
          <a href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold"
            style={{
              background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)',
              color: '#fff',
              fontFamily: 'var(--font-ui)',
              border: '1px solid rgba(196,181,253,0.30)',
              boxShadow: '0 4px 0 rgba(91,33,182,0.70), 0 12px 40px rgba(139,92,246,0.40)',
            }}
          >
            🚀 Crea account gratuito
          </a>
          <p className="text-xs mt-3" style={{ color: 'rgba(248,250,252,0.35)', fontFamily: 'var(--font-ui)' }}>
            Nessuna carta richiesta · Cancella quando vuoi
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative px-4 py-8 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🥗</span>
          <span className="text-base" style={{ fontFamily: 'var(--font-display)', color: 'rgba(248,250,252,0.50)' }}>NutriTrack</span>
        </div>
        <p className="text-xs" style={{ color: 'rgba(248,250,252,0.25)', fontFamily: 'var(--font-ui)' }}>
          © 2025 NutriTrack · Il tuo diario nutrizionale intelligente
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <a href="/login" className="text-xs" style={{ color: 'rgba(248,250,252,0.35)', fontFamily: 'var(--font-ui)' }}>Privacy</a>
          <a href="/login" className="text-xs" style={{ color: 'rgba(248,250,252,0.35)', fontFamily: 'var(--font-ui)' }}>Termini</a>
          <a href="/login" className="text-xs" style={{ color: 'rgba(248,250,252,0.35)', fontFamily: 'var(--font-ui)' }}>Contatti</a>
        </div>
      </footer>

    </div>
  );
}
