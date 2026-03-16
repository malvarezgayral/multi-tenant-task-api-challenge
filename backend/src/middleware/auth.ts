import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

// Tenant IDs that map to their corresponding env secret name
const TENANT_TOKEN_KEYS = {
  tenant_a: "TENANT_A_TOKEN",
  tenant_b: "TENANT_B_TOKEN",
} as const;

type TenantId = keyof typeof TENANT_TOKEN_KEYS;

/**
 * Compares two strings in constant time using SHA-256 hashing to avoid
 * timing side-channels. Both values are hashed before comparison so that
 * a length difference does not leak information via timing.
 *
 * Per workers-best-practices: never use direct string comparison for secrets.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  // timingSafeEqual is a Cloudflare Workers extension on SubtleCrypto.
  // Not present in standard DOM lib — cast is safe in the Workers runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (crypto.subtle as any).timingSafeEqual(hashA, hashB) as boolean;
}

/**
 * Auth middleware — validates Bearer token and sets tenantId in Hono context.
 *
 * Returns 401 if:
 *  - Authorization header is missing or malformed
 *  - Token does not match any known tenant
 */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const providedToken = authHeader.slice(7); // strip "Bearer "

  // Check each tenant token using constant-time comparison
  for (const [tenantId, envKey] of Object.entries(TENANT_TOKEN_KEYS) as [
    TenantId,
    (typeof TENANT_TOKEN_KEYS)[TenantId],
  ][]) {
    const expectedToken = c.env[envKey];
    if (expectedToken && (await timingSafeEqual(providedToken, expectedToken))) {
      c.set("tenantId", tenantId);
      await next();
      return;
    }
  }

  console.error(
    JSON.stringify({ message: "auth_failed", path: new URL(c.req.url).pathname })
  );
  return c.json({ error: "Invalid or expired token" }, 401);
};
