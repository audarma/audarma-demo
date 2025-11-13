/**
 * Translation API with Cerebras fallback and Vercel KV stats tracking
 */

import { kv } from '@vercel/kv';
import { translateWithFallback } from '@/lib/cerebras-provider';
import type { TranslationItem } from 'audarma';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { items, sourceLocale, targetLocale } = await req.json() as {
      items: TranslationItem[];
      sourceLocale: string;
      targetLocale: string;
    };

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Invalid items' }, { status: 400 });
    }

    if (!sourceLocale || !targetLocale) {
      return Response.json({ error: 'Missing locale' }, { status: 400 });
    }

    // Get Cerebras API key from environment
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'CEREBRAS_API_KEY not configured' }, { status: 500 });
    }

    // Translate with automatic model fallback
    const result = await translateWithFallback(items, sourceLocale, targetLocale, apiKey);

    // Update global stats in Vercel KV
    try {
      await Promise.all([
        kv.hincrby('stats', 'translations', items.length),
        kv.hincrbyfloat('stats', 'tokens', result.tokens),
        kv.hincrbyfloat('stats', 'cost', result.cost),
      ]);
      console.log(`[Stats] Updated: +${items.length} translations, +${result.tokens} tokens, +$${result.cost.toFixed(4)}`);
    } catch (error) {
      console.error('[Stats] Error updating KV:', error);
      // Don't fail the request if stats update fails
    }

    return Response.json({
      success: true,
      translations: result.translations,
      meta: {
        tokens: result.tokens,
        cost: result.cost,
        model: result.model,
        itemCount: items.length
      }
    });

  } catch (error) {
    console.error('[API] Translation error:', error);

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed'
    }, { status: 500 });
  }
}
