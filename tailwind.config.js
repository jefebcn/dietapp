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
        cream:    'var(--cream)',
        cream2:   'var(--cream2)',
        bark:     'var(--bark)',
        bark2:    'var(--bark2)',
        green:    'var(--green)',
        green2:   'var(--green2)',
        'green-lt': 'var(--green-lt)',
        leaf:     'var(--leaf)',
        orange:   'var(--orange)',
        'orange-lt': 'var(--orange-lt)',
        gold:     'var(--gold)',
        muted:    'var(--muted)',
        border:   'var(--border)',
      },
      fontFamily: {
        sans:  ['var(--font-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        mono:  ['var(--font-mono)', 'DM Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      animation: {
        'fade-up':  'fade-up 0.4s ease both',
        'scale-in': 'scale-in 0.3s ease both',
        'toast-in': 'toast-in 0.3s ease both',
      },
    },
  },
  plugins: [],
};
