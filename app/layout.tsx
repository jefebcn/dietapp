import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

// ── Metadata ───────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    template: '%s | NutriTrack',
    default: 'NutriTrack – Il tuo diario nutrizionale intelligente',
  },
  description:
    'Traccia pasti, calorie e macro con NutriTrack. Il tuo diario nutrizionale intelligente.',
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
  themeColor: '#22C55E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // Required for iOS safe-area insets
};

// ── Root Layout ────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Nunito (body), Nunito Sans (headings), Fredoka (UI labels) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Nunito+Sans:wght@700;800;900&family=Fredoka:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
