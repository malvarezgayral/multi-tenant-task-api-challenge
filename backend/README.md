# Multitenant Task API — Backend

Cloudflare Worker built with **Hono** + **Drizzle ORM** + **Neon Serverless Postgres**.

Implements a task management API with strict multi-tenant isolation, Bearer token authentication, and in-memory rate limiting.

---

## Stack

| Technology | Role |
|---|---|
| Cloudflare Workers | Runtime |
| Hono | HTTP framework |
| Drizzle ORM | Type-safe ORM |
| Neon Postgres | Serverless database |
| Zod | Request validation |

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point: CORS, auth, routes, error handler
│   ├── types.ts              # Shared Hono AppEnv (Bindings + Variables)
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema — tasks table
│   │   └── client.ts         # Neon connection factory (per-request)
│   ├── middleware/
│   │   ├── auth.ts           # Bearer token → tenantId (timing-safe comparison)
│   │   └── rateLimit.ts      # In-memory rate limiter (POST /tasks)
│   └── routes/
│       └── tasks.ts          # GET, POST, DELETE — tenant isolation at query level
├── drizzle/                  # Generated migration files
├── drizzle.config.ts
├── wrangler.jsonc
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Environment Variables

Copy `.env.example` to `.dev.vars` for local development:

```bash
cp .env.example .dev.vars
```

> **Wrangler** reads `.dev.vars` automatically during `wrangler dev`.  
> For production, set secrets with `wrangler secret put <SECRET_NAME>`.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (from Neon console) |
| `TENANT_A_TOKEN` | Static Bearer token for `tenant_a` |
| `TENANT_B_TOKEN` | Static Bearer token for `tenant_b` |

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- A [Neon](https://neon.tech) account with a project created

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .dev.vars
# Edit .dev.vars and fill in your DATABASE_URL and token values
```

### 3. Run database migration

```bash
npm run db:generate   # Generate SQL from schema
npm run db:migrate    # Apply migration to Neon
```

### 4. Start dev server

```bash
npm run dev
# → http://localhost:8787
```

---

## API Reference

All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | List tasks for the authenticated tenant |
| `POST` | `/tasks` | Create a task (rate limited: 10 req/min per tenant) |
| `DELETE` | `/tasks/:id` | Delete a task (tenant-owned only) |
| `GET` | `/health` | Health check (no auth required) |

### POST /tasks — Request body

```json
{
  "title": "My task",
  "status": "pending"
}
```

`status` defaults to `"pending"` if omitted. Allowed values: `"pending"`, `"done"`.

### Response shapes

**Task object:**
```json
{
  "id": "uuid",
  "title": "string",
  "status": "pending | done",
  "tenantId": "tenant_a | tenant_b",
  "createdAt": "ISO timestamp"
}
```

**Error:**
```json
{ "error": "message" }
```

---

## Security Design

- **Tenant isolation**: every query includes `WHERE tenant_id = $tenant`. The `tenant_id` is forced from the auth context — it cannot be overridden by request body.
- **IDOR prevention on DELETE**: deletes only rows matching both `id` AND `tenant_id`. Returns 404 for cross-tenant attempts (avoids leaking existence).
- **Timing-safe token comparison**: tokens are hashed with SHA-256 before `timingSafeEqual` comparison to prevent timing side-channel attacks.
- **No secrets in code**: tokens and DB credentials are Wrangler secrets, not in source or config files.

---

## Rate Limiting

`POST /tasks` is limited to **10 requests per 60 seconds per tenant**.

**Known limitation**: the counter is in-memory, scoped to a single Worker isolate. Under Cloudflare's global routing, a tenant's requests may be handled by multiple isolates — each with an independent counter. In production, a global counter would use [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) or KV.

---

## Deployment

```bash
# Set production secrets (one time)
wrangler secret put DATABASE_URL
wrangler secret put TENANT_A_TOKEN
wrangler secret put TENANT_B_TOKEN

# Deploy
npm run deploy
```

---

## Assumptions

- Tenant tokens are static strings (no rotation mechanism). A production system would use short-lived JWTs.
- The database migration is applied manually via `npm run db:migrate` (no auto-migration on deploy).
- CORS is open (`*`) to allow the frontend dev server to connect without additional config.
