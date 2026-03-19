/**
 * /app/settings/page.tsx  –  Settings Page
 *
 * Sections: Profile (display name), Nutrition Goals, Timezone, Sign Out.
 * Server Component: auth-gated.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getAdminAuth } from '@/lib/firebase-admin.config';
import { getUserById } from '@/lib/repositories/userRepository';
import { BottomTabBar } from '@/components/BottomTabBar';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = { title: 'Impostazioni' };

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    redirect('/login');
  }

  const user = await getUserById(uid);
  if (!user) redirect('/login');

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold" style={{ color: 'rgba(248,250,252,0.45)' }}>
            Personalizza
          </p>
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#F8FAFC', textShadow: '0 0 24px rgba(139,92,246,0.40)' }}>
            ⚙️ Impostazioni
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 space-y-4 page-content">
        <SettingsClient
          user={{
            name: user.name ?? '',
            email: user.email ?? '',
            goals: user.goals ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 },
          }}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
