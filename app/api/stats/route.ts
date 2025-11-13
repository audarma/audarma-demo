/**
 * Get global stats from Vercel KV
 */

import { kv } from '@vercel/kv';

export const runtime = 'edge';
export const revalidate = 0; // Disable caching

export async function GET() {
  try {
    const stats = await kv.hgetall('stats');

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
