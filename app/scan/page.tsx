/**
 * /app/scan/page.tsx  –  Food Scanner Page
 * Accessible to guests — saving a scan requires login (gated in ScannerClient).
 */

import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin.config';
import ScannerClient from './ScannerClient';

export const metadata: Metadata = { title: 'Scanner' };

export default async function ScanPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  let uid: string | null = null;
  if (sessionCookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
    } catch { /* guest */ }
  }

  return <ScannerClient isGuest={!uid} />;
}
