/**
 * Cloudflare environment bindings
 * Extends CloudflareEnv for @cloudflare/next-on-pages
 */

declare module '@cloudflare/next-on-pages' {
  interface CloudflareEnv {
    STATS_KV: KVNamespace;
    CEREBRAS_API_KEY: string;
  }
}
