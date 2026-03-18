import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ── Next.js 15 / Turbopack compatibility ─────────────────────────────────
  // firebase-admin uses Node.js-only APIs; keep it out of the browser bundle
  serverExternalPackages: ['firebase-admin'],

  // Turbopack is the default bundler in Next.js 15 dev mode;
  // no extra flags needed – just ensure no webpack-only plugins remain.
  // Note: cacheComponents requires Next.js canary and is not used here.

  // ── Image optimisation ───────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ── CORS headers for API routes ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://nutritrack.it' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
