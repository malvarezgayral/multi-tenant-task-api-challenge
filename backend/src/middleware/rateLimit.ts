import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * In-memory rate limit store.
 *
 * IMPORTANT: This store is per-isolate, not global across all Cloudflare
 * Worker instances. Under high traffic, a single tenant's requests may be
 * spread across multiple isolates, each with an independent counter.
 * This is acceptable for the challenge scope. A production system would use
 * Cloudflare Durable Objects or KV for a shared, global rate limit counter.
 */
const store = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware — applied only to POST /tasks.
 *
 * Limits each tenant to RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS.
 * Returns 429 with Retry-After header when the limit is exceeded.
 */
export const rateLimitMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const tenantId = c.get("tenantId");

  const max = parseInt(c.env.RATE_LIMIT_MAX ?? "10", 10);
  const windowMs = parseInt(c.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
  const now = Date.now();

  const entry = store.get(tenantId);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(tenantId, { count: 1, windowStart: now });
    await next();
    return;
  }

  if (entry.count >= max) {
    const retryAfterSec = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
    console.log(
      JSON.stringify({
        message: "rate_limit_exceeded",
        tenantId,
        count: entry.count,
        retryAfterSec,
      })
    );
    return c.json(
      { error: "Too many requests. Please wait before retrying." },
      429,
      { "Retry-After": String(retryAfterSec) }
    );
  }

  // Increment within current window
  entry.count++;
  await next();
};
