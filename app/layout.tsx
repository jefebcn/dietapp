import type { Metadata, Viewport } from 'next';
import { Nunito, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

// ── Font loading ───────────────────────────────────────────────────────────

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '600', '700', '800', '900'],
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['700', '800', '900'],
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
  themeColor: '#4CAF50',
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
      className={`${nunito.variable} ${nunitoSans.variable}`}
    >
      <body className="antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
