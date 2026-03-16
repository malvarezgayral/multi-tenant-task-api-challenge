import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { tasksRouter } from "./routes/tasks";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// ──────────────────────────────────────────────────────────────────────────────
// CORS — allow requests from any origin (frontend may run on different port/domain)
// ──────────────────────────────────────────────────────────────────────────────
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// Global request logger
// ──────────────────────────────────────────────────────────────────────────────
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(
    JSON.stringify({
      message: "request",
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      durationMs: duration,
    })
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// Auth — applied to all routes below
// ──────────────────────────────────────────────────────────────────────────────
app.use("*", authMiddleware);

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────
app.route("/tasks", tasksRouter);

// Health check — useful for integration tests and uptime monitoring
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// ──────────────────────────────────────────────────────────────────────────────
// Global error handler — explicit try/catch approach per workers-best-practices
// (No ctx.passThroughOnException — that hides bugs)
// ──────────────────────────────────────────────────────────────────────────────
app.onError((err, c) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error(
    JSON.stringify({
      message: "unhandled_error",
      error: message,
      path: new URL(c.req.url).pathname,
      method: c.req.method,
    })
  );
  return c.json({ error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) =>
  c.json({ error: `Route ${c.req.method} ${new URL(c.req.url).pathname} not found` }, 404)
);

export default app;
