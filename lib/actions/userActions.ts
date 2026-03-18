'use server';

/**
 * userActions.ts  –  Server Actions for user profile + settings
 */

import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin.config';
import { updateUser, updateUserGoals } from '@/lib/repositories/userRepository';

async function getAuthenticatedUid(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('Not authenticated');
  const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  return decoded.uid;
}

export interface UpdateProfileInput {
  name: string;
}

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const uid = await getAuthenticatedUid();
    await updateUser(uid, { name: input.name.trim() });
    return { success: true as const };
  } catch (err) {
    console.error('[updateProfileAction]', err);
    return { success: false as const, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export interface UpdateGoalsInput {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function updateGoalsAction(
  input: UpdateGoalsInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const uid = await getAuthenticatedUid();
    await updateUserGoals(uid, input);
    return { success: true as const };
  } catch (err) {
    console.error('[updateGoalsAction]', err);
    return { success: false as const, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
