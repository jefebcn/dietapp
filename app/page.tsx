/**
 * Root landing page  –  redirects to /dashboard (authenticated) or /login
 * Implemented as a Server Component for fast SSR redirect.
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin.config';

export default async function RootPage() {
  // Attempt to verify the session cookie set by /api/auth/session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (sessionCookie) {
    try {
      await getAdminAuth().verifySessionCookie(sessionCookie, true /* checkRevoked */);
      redirect('/dashboard');
    } catch {
      // Cookie invalid/expired – fall through to login
    }
  }

  redirect('/login');
}
