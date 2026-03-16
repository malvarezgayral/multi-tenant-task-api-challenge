import type { Context } from "hono";

/** Shared Hono environment type — bindings + context variables */
export interface AppEnv {
  Bindings: {
    DATABASE_URL: string;
    TENANT_A_TOKEN: string;
    TENANT_B_TOKEN: string;
    ENVIRONMENT: string;
    RATE_LIMIT_MAX: string;
    RATE_LIMIT_WINDOW_MS: string;
  };
  Variables: {
    tenantId: "tenant_a" | "tenant_b";
  };
}

export type AppContext = Context<AppEnv>;
