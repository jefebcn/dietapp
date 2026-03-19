/**
 * /app/scan/page.tsx  –  Food Scanner Page
 * Auth-gated. Renders the camera-based food scanner client.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminAuth } from '@/lib/firebase-admin.config';
import ScannerClient from './ScannerClient';

export const metadata: Metadata = { title: 'Scanner' };

export default async function ScanPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  try {
    await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/login');
  }

  return <ScannerClient />;
}
