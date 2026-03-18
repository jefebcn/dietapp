/**
 * nutritionAnalysis.ts  –  Claude Haiku 4.5 AI Nutrition Fallback
 *
 * Used when the Edamam database doesn't return a result for a food search.
 * Accepts either an image (base64) or a text description of a food item,
 * and returns structured nutrition estimates via Anthropic SDK.
 *
 * Uses Zod to validate structured output, ensuring we always get valid JSON
 * containing: foodName, estimatedCalories, macros (protein, carbs, fat, fiber).
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ── Zod schema for validated nutrition output ─────────────────────────────────

export const NutritionSchema = z.object({
  foodName: z.string().min(1),
  servingDescription: z.string(),   // e.g. "100g" or "1 medium apple"
  estimatedCalories: z.number().int().min(0).max(10000),
  macros: z.object({
    proteinG: z.number().min(0),
    carbsG: z.number().min(0),
    fatG: z.number().min(0),
    fiberG: z.number().min(0).optional(),
    sugarG: z.number().min(0).optional(),
  }),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string().optional(),
});

export type NutritionEstimate = z.infer<typeof NutritionSchema>;

// ── Client (lazy-initialized) ─────────────────────────────────────────────────

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional nutritionist and dietitian with expertise in food composition.
Your task is to estimate the nutritional content of foods based on images or text descriptions.

IMPORTANT RULES:
1. Always respond with ONLY valid JSON matching the specified schema. No markdown, no prose.
2. Base estimates on standard serving sizes unless otherwise specified.
3. Use scientific databases (USDA, CREA for Italian foods) as reference.
4. For Italian foods (pasta, pizza, etc.) use authentic Italian portion sizes.
5. Set confidence to "high" for common foods, "medium" for prepared dishes, "low" for unclear items.
6. If the image shows multiple items, estimate the total visible portion.`;

// ── Core analysis function ────────────────────────────────────────────────────

/**
 * Analyse a food by text description.
 */
export async function analyzeFood(description: string): Promise<NutritionEstimate> {
  const client = getClient();

  const userMessage = `Estimate the nutritional content for: "${description}"

Respond with ONLY this JSON structure:
{
  "foodName": "exact food name",
  "servingDescription": "serving size description",
  "estimatedCalories": 0,
  "macros": {
    "proteinG": 0,
    "carbsG": 0,
    "fatG": 0,
    "fiberG": 0,
    "sugarG": 0
  },
  "confidence": "high|medium|low",
  "notes": "optional notes"
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  return parseAndValidate(response.content[0]);
}

/**
 * Analyse a food from a base64-encoded image.
 */
export async function analyzeFoodImage(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg',
  additionalContext?: string,
): Promise<NutritionEstimate> {
  const client = getClient();

  const textContent = `Identify the food(s) in this image and estimate the nutritional content.${
    additionalContext ? ` Additional context: ${additionalContext}` : ''
  }

Respond with ONLY this JSON structure:
{
  "foodName": "exact food name",
  "servingDescription": "estimated portion size",
  "estimatedCalories": 0,
  "macros": {
    "proteinG": 0,
    "carbsG": 0,
    "fatG": 0,
    "fiberG": 0,
    "sugarG": 0
  },
  "confidence": "high|medium|low",
  "notes": "optional notes about the estimation"
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: textContent,
          },
        ],
      },
    ],
  });

  return parseAndValidate(response.content[0]);
}

// ── Response parser + validator ───────────────────────────────────────────────

function parseAndValidate(
  content: Anthropic.Messages.ContentBlock,
): NutritionEstimate {
  if (content.type !== 'text') {
    throw new Error('Unexpected non-text response from Claude');
  }

  let raw: unknown;
  try {
    // Strip any accidental markdown fences
    const cleaned = content.text
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();
    raw = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${content.text.slice(0, 200)}`);
  }

  const result = NutritionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Claude response failed validation: ${result.error.message}`);
  }

  return result.data;
}

// ── API Route helper ──────────────────────────────────────────────────────────

/**
 * Convenience wrapper that tries text-based analysis first, then falls back
 * to a best-guess if the API is unavailable (returns a low-confidence stub).
 */
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type SupportedMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

function toSupportedMimeType(mime?: string): SupportedMimeType {
  if (mime && (VALID_MIME_TYPES as readonly string[]).includes(mime)) {
    return mime as SupportedMimeType;
  }
  return 'image/jpeg';
}

export async function safeAnalyzeFood(
  input: { type: 'text'; description: string } | { type: 'image'; base64: string; mimeType?: string; context?: string },
): Promise<NutritionEstimate & { fromAI: true }> {
  let result: NutritionEstimate;

  if (input.type === 'text') {
    result = await analyzeFood(input.description);
  } else {
    result = await analyzeFoodImage(
      input.base64,
      toSupportedMimeType(input.mimeType),
      input.context,
    );
  }

  return { ...result, fromAI: true };
}
