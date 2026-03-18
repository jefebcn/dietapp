/**
 * GET /api/nutrition/search?q=<query>&page=<n>
 *
 * Proxy for external nutrition database APIs.
 * Keeps API keys server-side and implements SWR caching to reduce
 * third-party API costs and improve response latency.
 *
 * Cache strategy:
 *   - stale-while-revalidate: 60s
 *   - max-age: 10s (serve fresh)
 *   - s-maxage: 300s (CDN / Vercel Edge Cache for 5 minutes)
 *
 * Supported backends (selected via NUTRITION_API_BACKEND env var):
 *   - 'edamam' (default)  –  Edamam Food Database API
 *   - 'open-food-facts'   –  Open Food Facts (free, no key required)
 */

import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/repositories/userRepository';

// ── Auth middleware helper ─────────────────────────────────────────────────

async function getAuthenticatedUid(request) {
  const authorization = request.headers.get('Authorization') ?? '';
  const idToken = authorization.replace('Bearer ', '').trim();

  if (!idToken) {
    return null;
  }

  try {
    const decoded = await verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ── Edamam adapter ────────────────────────────────────────────────────────

async function searchEdamam(query, page = 0) {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  const baseUrl = process.env.NUTRITION_API_BASE_URL ?? 'https://api.edamam.com/api/food-database/v2';

  if (!appId || !appKey) {
    throw new Error('Edamam credentials not configured (EDAMAM_APP_ID / EDAMAM_APP_KEY)');
  }

  const url = new URL(`${baseUrl}/parser`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('ingr', query);
  url.searchParams.set('nutrition-type', 'logging');
  if (page > 0) url.searchParams.set('page', String(page));

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    // Next.js Data Cache – 24-hour stale-while-revalidate window for nutritional data
    next: { revalidate: 86400, tags: ['nutrition'] },
  });

  if (!res.ok) {
    throw new Error(`Edamam API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // Normalise Edamam response to our internal schema
  const results = (data.hints ?? []).map((hint) => {
    const food = hint.food;
    const nutrients = food.nutrients ?? {};
    return {
      id: food.foodId,
      name: food.label,
      brand: food.brand ?? null,
      category: food.category ?? null,
      image: food.image ?? null,
      servingSize: 100,
      servingUnit: 'g',
      nutrients: {
        kcal:    Math.round(nutrients.ENERC_KCAL ?? 0),
        protein: Math.round((nutrients.PROCNT ?? 0) * 10) / 10,
        carbs:   Math.round((nutrients.CHOCDF ?? 0) * 10) / 10,
        fat:     Math.round((nutrients.FAT ?? 0) * 10) / 10,
        fiber:   Math.round((nutrients.FIBTG ?? 0) * 10) / 10,
      },
    };
  });

  return {
    results,
    total: data.parsed?.length + (data.hints?.length ?? 0),
    hasMore: !!data._links?.next,
  };
}

// ── Open Food Facts adapter ────────────────────────────────────────────────

async function searchOpenFoodFacts(query) {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('fields', 'code,product_name,brands,nutriments,serving_size,image_thumb_url');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'NutriTrack/2.0 (nutritrack.it)' },
    // Next.js Data Cache – 24-hour stale-while-revalidate window
    next: { revalidate: 86400, tags: ['nutrition'] },
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts error: ${res.status}`);
  }

  const data = await res.json();

  const results = (data.products ?? [])
    .filter((p) => p.product_name)
    .map((p) => {
      const n = p.nutriments ?? {};
      return {
        id: p.code,
        name: p.product_name,
        brand: p.brands ?? null,
        category: null,
        image: p.image_thumb_url ?? null,
        servingSize: 100,
        servingUnit: 'g',
        nutrients: {
          kcal:    Math.round(n['energy-kcal_100g'] ?? n['energy_100g'] / 4.184 ?? 0),
          protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
          carbs:   Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
          fat:     Math.round((n.fat_100g ?? 0) * 10) / 10,
          fiber:   Math.round((n.fiber_100g ?? 0) * 10) / 10,
        },
      };
    });

  return { results, total: data.count ?? results.length, hasMore: results.length === 20 };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(request) {
  // Auth check
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const page = parseInt(searchParams.get('page') ?? '0', 10);

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query parameter "q" must be at least 2 characters.' },
      { status: 400 }
    );
  }

  const backend = process.env.NUTRITION_API_BACKEND ?? 'edamam';

  try {
    const payload =
      backend === 'open-food-facts'
        ? await searchOpenFoodFacts(query)
        : await searchEdamam(query, page);

    return NextResponse.json(payload, {
      headers: {
        // Serve fresh for 10s, use stale while revalidating for up to 24 hours,
        // CDN/Vercel Edge caches for 24 hours (nutritional data changes rarely)
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=86400, s-maxage=86400',
      },
    });
  } catch (err) {
    console.error('[/api/nutrition/search]', err);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition data. Please try again.' },
      { status: 502 }
    );
  }
}
