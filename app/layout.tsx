import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: {
    template: '%s | NutriTrack',
    default: 'NutriTrack – Healthy Food & Nutrition Tracking',
  },
  description:
    'Track calories, monitor macros, and build healthy eating habits with NutriTrack. Simple, visual, achievable.',
  keywords: ['nutrition', 'calories', 'macros', 'healthy food', 'diet', 'meal tracking', 'health'],
  authors: [{ name: 'NutriTrack' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://nutritrack.it'),
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://nutritrack.it',
    siteName: 'NutriTrack',
    title: 'NutriTrack – Healthy Food & Nutrition Tracking',
    description: 'Track calories, monitor macros, and build healthy eating habits.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NutriTrack',
    description: 'Healthy Food & Nutrition Tracking',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NutriTrack',
    startupImage: '/apple.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F6F0' },
    { media: '(prefers-color-scheme: dark)',  color: '#F3F6F0' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
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
