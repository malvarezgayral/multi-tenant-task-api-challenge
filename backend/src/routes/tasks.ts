import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "../db/client";
import { tasks } from "../db/schema";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import type { AppEnv } from "../types";

const tasksRouter = new Hono<AppEnv>();

// ──────────────────────────────────────────────────────────────────────────────
// GET /tasks — list tasks for the authenticated tenant
// ──────────────────────────────────────────────────────────────────────────────
tasksRouter.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const db = createDb(c.env.DATABASE_URL);

  // Tenant isolation enforced at the query level — not just application logic
  const tenantTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.tenantId, tenantId))
    .orderBy(tasks.createdAt);

  console.log(
    JSON.stringify({ message: "tasks_listed", tenantId, count: tenantTasks.length })
  );
  return c.json(tenantTasks, 200);
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /tasks — create a task for the authenticated tenant
// Rate limiting is applied before this handler
// ──────────────────────────────────────────────────────────────────────────────
const createTaskSchema = z.object({
  title: z.string().min(1, "title is required").max(500),
  status: z.enum(["pending", "done"]).optional().default("pending"),
});

tasksRouter.post(
  "/",
  rateLimitMiddleware,
  zValidator("json", createTaskSchema),
  async (c) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json");
    const db = createDb(c.env.DATABASE_URL);

    // tenantId is forced from the auth context — clients cannot override it
    const [created] = await db
      .insert(tasks)
      .values({
        title: body.title,
        status: body.status,
        tenantId, // always from auth context, never from request body
      })
      .returning();

    console.log(
      JSON.stringify({ message: "task_created", tenantId, taskId: created?.id })
    );
    return c.json(created, 201);
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /tasks/:id — delete a task only if it belongs to the authenticated tenant
// ──────────────────────────────────────────────────────────────────────────────
tasksRouter.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const taskId = c.req.param("id");
  const db = createDb(c.env.DATABASE_URL);

  // Both id AND tenant_id must match — prevents IDOR (Insecure Direct Object Reference)
  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
    .returning({ id: tasks.id });

  if (!deleted) {
    // Return 404 for both "not found" and "belongs to different tenant"
    // Avoids leaking information about cross-tenant task existence
    console.log(
      JSON.stringify({ message: "task_delete_not_found", tenantId, taskId })
    );
    return c.json({ error: "Task not found" }, 404);
  }

  console.log(
    JSON.stringify({ message: "task_deleted", tenantId, taskId: deleted.id })
  );
  return c.json({ message: "Task deleted successfully", id: deleted.id }, 200);
});

export { tasksRouter };
