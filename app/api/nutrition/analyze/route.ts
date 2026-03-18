/**
 * POST /api/nutrition/analyze
 *
 * Claude Haiku 4.5 image-to-nutrition fallback endpoint.
 * Called when the Edamam database doesn't return results.
 *
 * Body (JSON):
 *   { type: 'text', description: string }
 *   { type: 'image', base64: string, mimeType?: string, context?: string }
 *
 * Returns NutritionEstimate JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerToken } from '@/lib/dal';
import { safeAnalyzeFood } from '@/lib/ai/nutritionAnalysis';
import { z } from 'zod';

const TextBody = z.object({
  type: z.literal('text'),
  description: z.string().min(1).max(500),
});

const ImageBody = z.object({
  type: z.literal('image'),
  base64: z.string().min(1),
  mimeType: z.string().optional(),
  context: z.string().max(200).optional(),
});

const RequestBody = z.discriminatedUnion('type', [TextBody, ImageBody]);

export async function POST(request: NextRequest) {
  // Auth check
  const uid = await verifyBearerToken(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RequestBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI analysis not configured' },
      { status: 503 },
    );
  }

  try {
    const result = await safeAnalyzeFood(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/nutrition/analyze]', err);
    return NextResponse.json(
      { error: 'Analysis failed', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
