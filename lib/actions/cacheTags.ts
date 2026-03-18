/**
 * cacheTags.ts  –  Cache tag helpers (no 'use server' — safe to import anywhere)
 */

export function mealsCacheTag(uid: string, date: string) {
  return `meals:${uid}:${date}`;
}

export function statsCacheTag(uid: string, date: string) {
  return `stats:${uid}:${date}`;
}

export function streakCacheTag(uid: string) {
  return `streak:${uid}`;
}

export function weightCacheTag(uid: string) {
  return `weight:${uid}`;
}
