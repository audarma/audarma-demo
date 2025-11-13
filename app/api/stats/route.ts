/**
 * Get global stats from Cloudflare KV
 */

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';
export const revalidate = 0; // Disable caching

interface Env extends Record<string, unknown> {
  STATS_KV: KVNamespace;
}

export async function GET() {
  try {
    const { env } = getRequestContext<Env>();
    const statsJson = await env.STATS_KV.get('stats');

    const stats = statsJson ? JSON.parse(statsJson) : null;

    return Response.json({
      translations: Number(stats?.translations) || 0,
      tokens: Number(stats?.tokens) || 0,
      cost: Number(stats?.cost) || 0,
    });

  } catch (error) {
    console.error('[Stats API] Error:', error);

    // Return zero stats on error
    return Response.json({
      translations: 0,
      tokens: 0,
      cost: 0,
    });
  }
}
