# Technical Challenge — Full Stack Developer

Delivery: ZIP ﬁle or GitHub repository (public or private with access granted)

Context

You will build a small multi-tenant task management API with a React frontend that
consumes it. This exercise reﬂects the kind of work you would do maintaining and
evolving the platform.

## Backend (Cloudﬂare Workers + Hono + Drizzle ORM + Neon Postgres)

Build a Cloudﬂare Worker using the Hono framework that implements the
following:

### Authentication
• Two hardcoded tenants: tenant_a and tenant_b, each with one user
• Authentication via Bearer token (static tokens per tenant are ﬁne, no need
for a full auth system)
• Every request must include a valid token, otherwise return 401

### Endpoints
• GET /tasks — returns tasks belonging to the authenticated tenant only
• POST /tasks — creates a task for the authenticated tenant
• DELETE /tasks/:id — deletes a task, only if it belongs to the authenticated
tenant

### Data
• Use Drizzle ORM with Neon Postgres as the database
• Schema must include at minimum: task id, title, status, tenant_id,
created_at
• Tenant isolation must be enforced at the query level, not just in application
logic

### Security
• Implement basic rate limiting on the POST endpoint (in-memory is
acceptable)
• Return appropriate HTTP status codes throughout
• A user from tenant_a must never be able to read or modify data from
tenant_b under any circumstance

## Frontend (React + TypeScript + TailwindCSS)

Build a simple UI that:
• Allows selecting which tenant you are operating as (tenant_a or tenant_b)
• Displays the task list for the selected tenant fetched from the API
• Includes a form to create a new task
• Includes a delete button per task
• Uses TanStack Query for all data fetching and mutations
• Is styled with TailwindCSS, clean and functional, no need to be elaborate
Short written response (no more than half a page)


## Answer the following:

1. How would you approach implementing DMARC and DKIM conﬁguration for
a platform hosted on Cloudﬂare? What is the purpose of each?
2. A user reports they can see tasks that don't belong to them. Walk us
through how you would debug and ﬁx this in a multi-tenant system.
3. What would your automated daily database backup strategy look like for a
Neon Postgres database? How would you verify it's working?

## Delivery requirements

Include a README.md with setup instructions, environment variables required,
and any assumptions made

Code must run locally with minimal setup

.env.example file required with all necessary variables listed
Notes for the candidate

Do not over-engineer. Clean, working, and well-structured code is valued over
complexity.

If you run out of time, document what you would have done differently or what
is missing.

The written section is as important as the code. It reveals how you think about
production systems.


---

A certain discussion about how to achieve the solution will be in `discussion.md`.

This file is only for reference and should not be used to generate code, but to understand the context of the challenge and the reasoning behind the solution. This is the most important file to understand the context of the challenge.