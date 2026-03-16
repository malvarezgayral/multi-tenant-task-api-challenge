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

**Note**: in this case we commit the `.dev.vars` file to git, but in a real production environment we would not commit it because of security reasons. We only allow it in this case for the challenge purposes to make it easier to run locally with the right environment variables.

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

## Setup for the challenge reviewers

> The `.dev.vars` file is committed to this repository for reviewer convenience only. In a real production environment, secrets would never be committed to source control.

```bash
# 1. Install dependencies
npm install

# 2. Run database migration (DATABASE_URL is already in .dev.vars)
npm run db:generate
npm run db:migrate

# 3. Start the dev server
npm run dev
# → http://localhost:8787
```

Test tenant isolation immediately:
```bash
# Tenant A — should see only Tenant A's tasks
curl http://localhost:8787/tasks -H "Authorization: Bearer cualquier-string-secreto-para-tenant-a"

# Tenant B — should see an empty list (or only Tenant B's tasks)
curl http://localhost:8787/tasks -H "Authorization: Bearer cualquier-string-secreto-para-tenant-b"
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

---

## Written Responses

### 1. DMARC and DKIM on Cloudflare — purpose and implementation

**What each protocol does:**

- **DKIM (DomainKeys Identified Mail)** is a cryptographic signature attached to every outgoing email. The sending mail server signs the message with a private key; receiving servers verify the signature against a public key published in the sender's DNS. This proves the message was not tampered with in transit and was genuinely sent by the domain owner.

- **DMARC (Domain-based Message Authentication, Reporting and Conformance)** sits on top of DKIM (and SPF). It tells receiving mail servers what to do when an email *fails* authentication — `none` (monitor only), `quarantine` (move to spam), or `reject` (drop the message). It also enables aggregate and forensic reporting so you can see who is sending email on behalf of your domain.

**Implementation on Cloudflare:**

Cloudflare manages DNS, so both records are added there.

1. **DKIM** — Generate a key pair in your email provider (e.g., SendGrid, Resend, Postmark). They give you a `TXT` record like:
   ```
   Name:  s1._domainkey.yourdomain.com
   Value: v=DKIM1; k=rsa; p=<public-key>
   ```
   Add it in Cloudflare Dashboard → DNS → Add Record. Set the record to **DNS-only** (grey cloud), not proxied — mail authentication uses raw DNS, not the Cloudflare proxy.

2. **SPF** — While implementing DKIM, also add an SPF `TXT` record at the root domain authorizing your email provider's servers:
   ```
   Name:  @
   Value: v=spf1 include:sendgrid.net ~all
   ```

3. **DMARC** — Add a `TXT` record at `_dmarc.yourdomain.com`. Start with `p=none` to monitor before enforcing:
   ```
   Name:  _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com; ruf=mailto:dmarc-forensic@yourdomain.com; fo=1
   ```
   After reviewing reports for a few weeks and confirming no legitimate sending sources are failing, graduate to `p=quarantine` and eventually `p=reject`.

4. **Cloudflare Email Security (optional)** — If using Cloudflare Email Routing or the Email Security product, DKIM signing can be handled directly by Cloudflare, removing the need to manage keys in an external ESP.

---

### 2. Debugging a cross-tenant data leak

A user reporting they can see tasks that don't belong to them is a **critical P0 incident** in a multi-tenant system. Here is the systematic approach:

**Step 1 — Immediate containment**

Before investigating, evaluate whether to temporarily restrict the affected tenant's access or take the service into maintenance to prevent further exposure. Document the report with a timestamp.

**Step 2 — Reproduce with structured logging**

Check Worker logs (Cloudflare Dashboard → Workers → Logs, or `wrangler tail`) for the affected tenant. Look for requests to `GET /tasks` and inspect the SQL query that was executed. Our structured JSON logs include `tenantId` on every request, which makes this straightforward:

```json
{ "message": "tasks_listed", "tenantId": "tenant_a", "count": 47 }
```

If `count` is unexpectedly high, or if the tenant ID in the log doesn't match the authenticated tenant, that points directly to the bug.

**Step 3 — Audit query-level isolation**

The most common cause is a missing or incorrect `WHERE tenant_id = ?` clause. Inspect the ORM query:

```typescript
// CORRECT — always includes tenant filter
db.select().from(tasks).where(eq(tasks.tenantId, tenantId))

// BROKEN — would return all tasks across all tenants
db.select().from(tasks)
```

Also check that `tenantId` in the query comes from the **auth context** (`c.get('tenantId')`), not from a user-supplied request parameter that could be spoofed.

**Step 4 — Verify the auth middleware**

Confirm the middleware correctly sets `tenantId` from the validated token, not from a header or query param the client controls. A timing bug (e.g., using `let` instead of a properly scoped `const`) could cause context leakage between concurrent requests — although in Cloudflare Workers, each request runs in its own isolated context, making this scenario less likely than in traditional Node.js servers.

**Step 5 — Check for missing migration**

If a new column or index was added without a completed migration, a query might fall back to a less specific filter. Verify the `tenant_id` column exists in the database and has a `NOT NULL` constraint.

**Step 6 — Database-level audit**

Run a direct query on Neon to verify row ownership:
```sql
SELECT tenant_id, count(*) FROM tasks GROUP BY tenant_id;
```
If rows exist with the wrong `tenant_id` (e.g., `NULL`, or another tenant's ID), there was a past write bug that needs a data correction.

**Fix and prevention:**

- Apply the query-level fix immediately.
- Add an integration test that creates tasks for two tenants and asserts that each tenant's response contains *only* their own tasks (assert on both `id` and `tenantId`).
- Add a database `CHECK` constraint or row-level security (RLS) policy in Postgres as a defense-in-depth measure so the DB itself rejects cross-tenant writes.

---

### 3. Automated daily backup strategy for Neon Postgres

**Built-in Neon capabilities (first line of defense):**

Neon performs **continuous WAL (Write-Ahead Log) archiving** and provides **Point-in-Time Restore (PITR)** out of the box, with a configurable retention window (up to 30 days on paid plans). This means you can restore the database to any second within that window — not just nightly snapshots. This is the primary backup mechanism and requires zero configuration.

**Supplementary daily snapshot strategy:**

For an additional independent backup (recommended for disaster recovery scenarios where the Neon platform itself is unavailable):

1. **Scheduled export via Neon Branching** — Use the Neon API or CLI to create a daily branch from the main branch. Branches in Neon are copy-on-write, instant, and cheap. This gives you a named, isolated snapshot:
   ```bash
   # Run daily via cron job or GitHub Actions
   neon branches create --name "backup-$(date +%Y-%m-%d)" --parent main
   ```

2. **pg_dump to cold storage** — As an alternative or complement, schedule a daily `pg_dump` using GitHub Actions (or Cloudflare Workers via Cron Triggers) and upload the dump to an S3 bucket or Cloudflare R2:
   ```yaml
   # .github/workflows/backup.yml
   on:
     schedule:
       - cron: '0 2 * * *'   # 2 AM UTC daily
   jobs:
     backup:
       runs-on: ubuntu-latest
       steps:
         - run: |
             pg_dump $DATABASE_URL | gzip > backup-$(date +%Y-%m-%d).sql.gz
             aws s3 cp backup-*.sql.gz s3://my-backups-bucket/neon/
   ```
   Dumps are encrypted in transit (SSL) and at rest on Cloudflare R2 (AES-256).

3. **Retention policy** — Keep 30 daily dumps, 12 monthly dumps, using lifecycle rules on the storage bucket to auto-delete older files.

**Verification strategy:**

A backup that is never tested is not a backup.

- **Automated restore test (weekly)** — Provision a Neon branch from the latest backup (or restore the `pg_dump` to a dev branch) and run a smoke-test query to verify row counts and schema integrity. This can be automated in the same GitHub Actions workflow:
  ```bash
  # After creating the restore branch
  psql $RESTORE_URL -c "SELECT count(*) FROM tasks" | grep -v 'ERROR'
  ```
- **Monitoring** — Use Neon's monitoring dashboard to confirm WAL archiving is active. For `pg_dump` jobs, send a heartbeat to an uptime monitor (e.g., BetterStack, Cronitor) on success; alert if the ping is not received within 2 hours of the expected run time.
- **Alert on failures** — If the GitHub Action fails, send a notification to Slack or PagerDuty via the workflow's `on: [failure]` hook.

