import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Creates a Drizzle DB client bound to the current request's DATABASE_URL.
 *
 * Called once per request handler — do NOT call at module level.
 * Module-level DB clients cause cross-request state leaks in Workers
 * (violates workers-best-practices: no global request state).
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
