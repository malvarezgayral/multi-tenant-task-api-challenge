# Multitenant Task Manager — Frontend

React + TypeScript + TailwindCSS v4 + TanStack Query frontend for the multitenant task management API.

---

## Stack

| Technology | Role |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite 8 | Build tool & dev server |
| TailwindCSS v4 | Styling (CSS-first, `@theme` tokens) |
| TanStack Query v5 | Data fetching, caching & mutations |

---

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # Entry point — QueryClient, StrictMode
│   ├── App.tsx               # Root: TenantSelector + TaskForm + TaskList
│   ├── index.css             # Design system (@theme tokens, base styles)
│   ├── lib/
│   │   └── api.ts            # All API calls + types (centralized)
│   └── components/
│       ├── TenantSelector.tsx # Toggle between tenant_a / tenant_b
│       ├── TaskForm.tsx       # Create task form with useMutation
│       ├── TaskList.tsx       # useQuery + empty/loading/error states
│       └── TaskItem.tsx       # Single task row with delete button
├── index.html
├── vite.config.ts
├── .env.example
└── tsconfig.app.json
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:8787` |
| `VITE_TENANT_A_TOKEN` | Bearer token for tenant_a | `token-a` |
| `VITE_TENANT_B_TOKEN` | Bearer token for tenant_b | `token-b` |

> Values must match the backend's `.dev.vars` secrets exactly.
> If you don't create `.env.local`, the app falls back to the defaults above.

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- Backend running at `http://localhost:8787` (see `backend/README.md`)

### Install & run

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## How it works

- **Tenant switching**: selecting a tenant changes the `queryKey` → TanStack Query automatically re-fetches the correct task list with no extra code.
- **Auth**: tokens are sent as `Authorization: Bearer <token>` headers, sourced from `VITE_TENANT_*` env vars.
- **Tenant isolation test**: switch to Tenant B and confirm you see no Tenant A tasks.
