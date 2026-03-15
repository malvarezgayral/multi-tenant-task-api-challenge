# Skills Index — Multitenant API Agent

This file is the **canonical entry point** for all skills available in this workspace.
When a task is triggered, consult this index first to decide which skill(s) to activate.
Load only the skills that are relevant to the current context; avoid loading all skills at once.

---

## Context of this work

This project is for a tech challenge, the goal is to build a multitenant api using the following technologies:

- Cloudflare Workers
- Hono
- Drizzle ORM
- Neon Postgres
- Tailwind CSS
- TypeScript
- React

The important details about the challenge will be defined in the `challenge.md` file.

It is very important that you attend to the `challenge.md` file for the details of the challenge, and prioritize it over any other instruction.

The available skills will be important only to the specifics of each technology, and will be used only when needed, but the priority is to achieve the goals of the challenge.

## Available Skills

| Skill | Folder | Activate when… |
|-------|--------|----------------|
| [workers-best-practices](#workers-best-practices) | `workers-best-practices/` | Writing or reviewing **Cloudflare Workers** code, configuring `wrangler.jsonc`, checking streaming / floating-promise / global-state patterns, managing secrets or bindings |
| [hono](#hono) | `hono/` | Building or debugging **Hono** framework routes, middleware, or request handling on any runtime |
| [drizzle-orm](#drizzle-orm) | `drizzle-orm/` | Defining database schemas, writing queries, managing migrations, or optimising DB performance with **Drizzle ORM** |
| [neon-postgres](#neon-postgres) | `neon-postgres/` | Connecting to, configuring, or administering a **Neon Serverless Postgres** database (branching, pooling, auth, REST/SDK) |
| [tailwindcss](#tailwindcss) | `tailwindcss/` | Styling UI with **Tailwind CSS** utility classes, customising the design system, or migrating from v3 → v4 |
| [typescript-expert](#typescript-expert) | `typescript-expert/` | Solving advanced **TypeScript** type errors, optimising compilation, migrating from JavaScript, or reviewing type-level code |
| [vercel-react-best-practices](#vercel-react-best-practices) | `vercel-react-best-practices/` | Writing, reviewing, or refactoring **React / Next.js** components for performance (waterfalls, bundle size, rendering, SSR) |

---

## Selection Rules

```
task involves Cloudflare Worker runtime            → workers-best-practices
task involves HTTP routing / Hono API              → hono
task involves database schema / queries / ORM      → drizzle-orm
task involves Neon Postgres config or platform     → neon-postgres
task involves styling / UI classes                 → tailwindcss
task involves TypeScript types or toolchain        → typescript-expert
task involves React / Next.js component or perf    → vercel-react-best-practices
```

> Multiple skills can (and often should) be loaded together for fullstack tasks.
> **Example:** building a Hono worker that queries Neon via Drizzle → load `hono` + `workers-best-practices` + `drizzle-orm` + `neon-postgres`.

---

## Skill Details

### workers-best-practices

**Path:** `workers-best-practices/SKILL.md`
**Key references:**
- `references/rules.md` — all best-practice rules with code examples
- `references/review.md` — type/config validation and review process

**Critical rules (quick reference):**
| Area | Rule |
|------|------|
| Config | Set `compatibility_date`; enable `nodejs_compat`; run `wrangler types` |
| Fetch / Response | Stream large payloads — never `await response.text()` on unbounded data |
| Async | Use `ctx.waitUntil()` for post-response work; never destructure `ctx` |
| Architecture | Prefer bindings (KV, R2, D1) over Cloudflare REST API from inside a Worker |
| Security | Use `crypto.randomUUID()` — never `Math.random()` for tokens/IDs |
| Code | No module-level mutable state; every Promise must be awaited or handled |

---

### hono

**Path:** `hono/SKILL.md`

**CLI workflow:**
```bash
npx @hono/cli search "<query>" --pretty   # look up APIs
npx @hono/cli docs /docs/api/context       # read docs
npx @hono/cli request [file] -P /route     # test endpoints without a server
npx @hono/cli optimize [entry] -t cloudflare-workers  # bundle for production
```
Always use `hono search` before implementing unfamiliar APIs.

---

### drizzle-orm

**Path:** `drizzle-orm/SKILL.md`
**Extended references** (load on demand):
- `references/advanced-schemas.md` — custom types, indexes, multi-tenant patterns
- `references/query-patterns.md` — CTEs, raw SQL, prepared statements
- `references/performance.md` — connection pooling, N+1, edge runtime integration
- `references/vs-prisma.md` — ORM comparison / migration guide

**Red flags to stop and reconsider:**
- `any`/`unknown` on JSON columns without `$type<>` annotation
- Raw SQL string building outside the `sql` template tag
- Multi-step writes without a transaction
- Unbounded `select()` on large tables without `.limit()`

---

### neon-postgres

**Path:** `neon-postgres/SKILL.md`

**Documentation strategy:** Fetch official docs as markdown for any claim before responding:
```
https://neon.com/docs/<page>.md
```
Full page index: `https://neon.com/docs/llms.txt`

**Key topic links (use when relevant):**
| Topic | When to load |
|-------|-------------|
| Getting started | First-time setup, connection strings |
| Connection methods | Picking TCP / HTTP / WebSocket driver for the runtime |
| Serverless driver | `@neondatabase/serverless` patterns |
| Branching | Isolated environments, preview deploys, migration testing |
| Connection pooling | Serverless / high-concurrency (use `-pooler` hostname) |
| Neon Auth | Managed user auth in Next.js / React |
| Autoscaling / Scale-to-zero | Cost optimisation, cold-start trade-offs |

---

### tailwindcss

**Path:** `tailwindcss/SKILL.md`
**Version:** Tailwind CSS **v4** (CSS-first config via `@theme`)
**Extended references:** `references/` folder contains per-topic files for layout, typography, visual, transforms, effects, and features.

**Key recommendations:**
- Compose designs with utility classes — avoid writing custom CSS where utilities exist
- Use `@theme` directive to define design tokens (v4 CSS-first config)
- Mobile-first: unprefixed utilities = mobile, prefixed (`md:`, `lg:`) = breakpoints
- Never construct class names dynamically via string interpolation
- Migrate from Tailwind v3 → v4: consult `references/features-upgrade.md`

---

### typescript-expert

**Path:** `typescript-expert/SKILL.md`
**Extended references:** `references/` and `scripts/` folders.

**When to escalate to a sub-specialist:**
- Deep bundler internals → `typescript-build-expert`
- Complex ESM/CJS migration → `typescript-module-expert`
- Compiler type performance profiling → `typescript-type-expert`

**Recommended tsconfig (strict by default):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler"
  }
}
```

**Validation commands (always run before closing a TS task):**
```bash
npm run -s typecheck || npx tsc --noEmit
npm test -s || npx vitest run --reporter=basic --no-watch
```

---

### vercel-react-best-practices

**Path:** `vercel-react-best-practices/SKILL.md`
**Full compiled guide:** `AGENTS.md` (all 62 rules expanded)
**Individual rules:** `rules/<rule-id>.md`

**Priority tiers:**

| Priority | Category | Rule prefix |
|----------|----------|-------------|
| CRITICAL | Eliminating Waterfalls | `async-` |
| CRITICAL | Bundle Size | `bundle-` |
| HIGH | Server-Side Performance | `server-` |
| MEDIUM-HIGH | Client-Side Data Fetching | `client-` |
| MEDIUM | Re-render Optimization | `rerender-` |
| MEDIUM | Rendering Performance | `rendering-` |
| LOW-MEDIUM | JavaScript Performance | `js-` |
| LOW | Advanced Patterns | `advanced-` |

Apply rules in priority order. Read `rules/<rule-id>.md` for full code examples on any rule.

---

## Coordination Protocol

1. **Read this index first** whenever starting a new task.
2. **Identify matching skills** from the Selection Rules table.
3. **Load `SKILL.md`** for each matching skill before writing or reviewing code.
4. **Load sub-references** from a skill's `references/` folder only when the specific topic is in scope for the current task — do not pre-load all references.
5. **Combine skills** freely; they are designed to work together.
6. **Retrieve before assuming** — both `workers-best-practices` and `neon-postgres` require fetching live documentation; prefer retrieval over pre-trained knowledge for any claim about APIs or config.
