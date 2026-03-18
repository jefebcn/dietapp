/**
 * leagueRepository.ts  –  League System with Distributed Counters
 *
 * Tiers: Bronze → Silver → Gold → Platinum
 *
 * Each league document has 10 shard counter sub-documents to avoid
 * Firestore's single-document write limit (1 write/sec).
 * Shard selection is random, reads aggregate across all shards.
 *
 * Firestore structure:
 *   leagues/{leagueId}              – league metadata
 *   leagues/{leagueId}/shards/{0-9} – distributed member count
 *   users/{uid}/league              – user's current league membership
 */

import { getAdminDb } from '@/lib/firebase-admin.config';
import { FieldValue } from 'firebase-admin/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LeagueDefinition {
  id: LeagueTier;
  name: string;
  emoji: string;
  color: string;
  borderColor: string;
  shadowColor: string;
  bgGradient: string;
  /** Minimum NutriPoints to be eligible */
  minPoints: number;
  /** Max members before promotion eligibility opens */
  maxMembers: number;
}

export interface LeagueMembership {
  uid: string;
  tier: LeagueTier;
  nutriPoints: number;
  joinedAt: string;
  lastActivityAt: string;
  weeklyRank?: number;
}

export interface LeagueStats {
  tier: LeagueTier;
  totalMembers: number;
}

// ── League definitions ────────────────────────────────────────────────────────

export const LEAGUES: Record<LeagueTier, LeagueDefinition> = {
  bronze: {
    id: 'bronze',
    name: 'Lega Bronze',
    emoji: '🥉',
    color: '#92400E',
    borderColor: '#D97706',
    shadowColor: '#B45309',
    bgGradient: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
    minPoints: 0,
    maxMembers: 1000,
  },
  silver: {
    id: 'silver',
    name: 'Lega Silver',
    emoji: '🥈',
    color: '#374151',
    borderColor: '#9CA3AF',
    shadowColor: '#6B7280',
    bgGradient: 'linear-gradient(145deg, #F9FAFB 0%, #F3F4F6 100%)',
    minPoints: 500,
    maxMembers: 500,
  },
  gold: {
    id: 'gold',
    name: 'Lega Gold',
    emoji: '🥇',
    color: '#92400E',
    borderColor: '#FBBF24',
    shadowColor: '#D97706',
    bgGradient: 'linear-gradient(145deg, #FFFBEB 0%, #FEF9C3 100%)',
    minPoints: 2000,
    maxMembers: 200,
  },
  platinum: {
    id: 'platinum',
    name: 'Lega Platinum',
    emoji: '💎',
    color: '#1E3A8A',
    borderColor: '#60A5FA',
    shadowColor: '#1D4ED8',
    bgGradient: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)',
    minPoints: 5000,
    maxMembers: 50,
  },
};

const NUM_SHARDS = 10;

// ── Distributed Counter helpers ───────────────────────────────────────────────

/** Increment the member count for a league using a random shard. */
export async function incrementLeagueMemberCount(tier: LeagueTier): Promise<void> {
  const db = getAdminDb();
  const shardIndex = Math.floor(Math.random() * NUM_SHARDS);
  const shardRef = db.doc(`leagues/${tier}/shards/${shardIndex}`);
  await shardRef.set({ count: FieldValue.increment(1) }, { merge: true });
}

/** Decrement the member count (on tier change or leave). */
export async function decrementLeagueMemberCount(tier: LeagueTier): Promise<void> {
  const db = getAdminDb();
  const shardIndex = Math.floor(Math.random() * NUM_SHARDS);
  const shardRef = db.doc(`leagues/${tier}/shards/${shardIndex}`);
  await shardRef.set({ count: FieldValue.increment(-1) }, { merge: true });
}

/** Aggregate all 10 shards to get the total member count for a league. */
export async function getLeagueMemberCount(tier: LeagueTier): Promise<number> {
  const db = getAdminDb();
  const shards = await db.collection(`leagues/${tier}/shards`).get();
  return shards.docs.reduce((total, doc) => {
    const data = doc.data() as { count?: number };
    return total + (data.count ?? 0);
  }, 0);
}

/** Get member counts for all leagues in parallel. */
export async function getAllLeagueStats(): Promise<LeagueStats[]> {
  const tiers: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const counts = await Promise.all(tiers.map((t) => getLeagueMemberCount(t)));
  return tiers.map((tier, i) => ({ tier, totalMembers: counts[i] }));
}

// ── League membership ─────────────────────────────────────────────────────────

/** Get a user's current league membership. */
export async function getUserLeague(uid: string): Promise<LeagueMembership | null> {
  const db = getAdminDb();
  const doc = await db.doc(`users/${uid}/league/current`).get();
  return doc.exists ? (doc.data() as LeagueMembership) : null;
}

/**
 * Assign or update a user's league.
 * Handles shard counter updates automatically.
 */
export async function setUserLeague(
  uid: string,
  tier: LeagueTier,
  nutriPoints: number,
): Promise<void> {
  const db = getAdminDb();
  const memberRef = db.doc(`users/${uid}/league/current`);

  const existing = await memberRef.get();
  const prevTier = existing.exists
    ? (existing.data() as LeagueMembership).tier
    : null;

  const now = new Date().toISOString();

  const membership: LeagueMembership = {
    uid,
    tier,
    nutriPoints,
    joinedAt: existing.exists
      ? (existing.data() as LeagueMembership).joinedAt
      : now,
    lastActivityAt: now,
  };

  await memberRef.set(membership);

  // Update distributed counters
  if (prevTier && prevTier !== tier) {
    await decrementLeagueMemberCount(prevTier);
  }
  if (!prevTier || prevTier !== tier) {
    await incrementLeagueMemberCount(tier);
  }
}

/**
 * Determine which tier a user should be in based on NutriPoints.
 */
export function getTierForPoints(nutriPoints: number): LeagueTier {
  if (nutriPoints >= LEAGUES.platinum.minPoints) return 'platinum';
  if (nutriPoints >= LEAGUES.gold.minPoints) return 'gold';
  if (nutriPoints >= LEAGUES.silver.minPoints) return 'silver';
  return 'bronze';
}

/** Fetch the top N users in a league by NutriPoints. */
export async function getLeagueLeaderboard(
  tier: LeagueTier,
  limit = 50,
): Promise<LeagueMembership[]> {
  const db = getAdminDb();
  const snap = await db
    .collectionGroup('league')
    // NOTE: collectionGroup query requires a composite index on tier + nutriPoints
    .where('tier', '==', tier)
    .orderBy('nutriPoints', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as LeagueMembership);
}
