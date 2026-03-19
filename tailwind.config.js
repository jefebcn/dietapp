/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'nt-orange':   '#F97316',
        'nt-green':    '#22C55E',
        'nt-carb':     '#8B5CF6',
        'nt-protein':  '#0EA5E9',
        'nt-fat':      '#F59E0B',
        'nt-bg':       '#F3F6F0',
        'nt-card':     '#FFFFFF',
        'nt-border':   '#E5EBE0',
        'nt-text':     '#1C1917',
        'nt-muted':    '#9CA3AF',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        card:     'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        tab:      'var(--shadow-tab)',
        fab:      'var(--shadow-fab)',
      },
      animation: {
        'fade-up':  'fadeUp 0.4s ease both',
        'scale-in': 'scaleIn 0.3s ease both',
      },
    },
  },
  plugins: [],
};
