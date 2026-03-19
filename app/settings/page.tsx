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
import { upsertUserFromAuth } from '@/lib/repositories/userRepository';
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

  const user = await upsertUserFromAuth(uid).catch(() => null);
  if (!user) redirect('/login');

  return (
    <div className="relative min-h-screen" style={{ background: '#F3F6F0' }}>
      {/* Header */}
      <header className="page-header" style={{
        background: 'rgba(243,246,240,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5EBE0',
      }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
            Personalizza
          </p>
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
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
            heightCm: (user as { heightCm?: number }).heightCm,
          }}
        />
      </main>

      <BottomTabBar />
    </div>
  );
}
