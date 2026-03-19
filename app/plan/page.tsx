/**
 * /app/plan/page.tsx  –  Meal Plan Page
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserById } from '@/lib/repositories/userRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import PlanClient from './PlanClient';

export const metadata: Metadata = { title: 'Meal Plan' };

export default async function PlanPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch { redirect('/login'); }

  const user  = await getUserById(uid);
  const goals = user?.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 };

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100dvh' }}>
      <PlanClient goals={goals} />
      <BottomTabBar />
    </div>
  );
}
