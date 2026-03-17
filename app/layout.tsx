import type { Metadata, Viewport } from 'next';
import { DM_Sans, DM_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';

// ── Font loading ───────────────────────────────────────────────────────────

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

// ── Metadata ───────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    template: '%s | NutriTrack',
    default: 'NutriTrack – Il tuo diario nutrizionale intelligente',
  },
  description:
    'Traccia pasti, calorie e macro con NutriTrack. Il tuo assistente nutrizionale personale con Sprinty.',
  keywords: ['dieta', 'nutrizione', 'calorie', 'macro', 'diario alimentare', 'salute'],
  authors: [{ name: 'NutriTrack' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://nutritrack.it'),
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://nutritrack.it',
    siteName: 'NutriTrack',
    title: 'NutriTrack – Il tuo diario nutrizionale intelligente',
    description: 'Traccia pasti, calorie e macro con NutriTrack.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NutriTrack',
    description: 'Il tuo diario nutrizionale intelligente.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NutriTrack',
  },
};

export const viewport: Viewport = {
  themeColor: '#3a6b27',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// ── Root Layout ────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="it"
      className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable}`}
    >
      <body className="bg-[#f5efe4] text-[#2c1f0e] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
