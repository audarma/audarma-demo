/**
 * Translation API with Cerebras fallback and Cloudflare KV stats tracking
 */

import { getRequestContext } from '@cloudflare/next-on-pages';
import { translateWithFallback } from '@/lib/cerebras-provider';
import type { TranslationItem } from 'audarma';

export const runtime = 'edge';

interface Env {
  STATS_KV: KVNamespace;
  CEREBRAS_API_KEY: string;
}

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

    // Get environment bindings
    const { env } = getRequestContext<Env>();
    const apiKey = env.CEREBRAS_API_KEY;

    if (!apiKey) {
      return Response.json({ error: 'CEREBRAS_API_KEY not configured' }, { status: 500 });
    }

    // Translate with automatic model fallback
    const result = await translateWithFallback(items, sourceLocale, targetLocale, apiKey);

    // Update global stats in Cloudflare KV
    try {
      // Get current stats
      const statsJson = await env.STATS_KV.get('stats');
      const currentStats = statsJson ? JSON.parse(statsJson) : { translations: 0, tokens: 0, cost: 0 };

      // Increment stats
      const updatedStats = {
        translations: (currentStats.translations || 0) + items.length,
        tokens: (currentStats.tokens || 0) + result.tokens,
        cost: (currentStats.cost || 0) + result.cost,
      };

      // Save updated stats
      await env.STATS_KV.put('stats', JSON.stringify(updatedStats));
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
