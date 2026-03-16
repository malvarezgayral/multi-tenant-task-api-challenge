// ──────────────────────────────────────────────────────────────────────────────
// Central API client
//
// All backend communication goes through this module.
// Tenant tokens are static strings matching the backend .dev.vars secrets.
// ──────────────────────────────────────────────────────────────────────────────

export type TenantId = 'tenant_a' | 'tenant_b'

export interface Task {
  id: string
  title: string
  status: 'pending' | 'done'
  tenantId: TenantId
  createdAt: string
}

/** Maps each tenant to its static Bearer token. */
const TENANT_TOKENS: Record<TenantId, string> = {
  tenant_a: import.meta.env.VITE_TENANT_A_TOKEN ?? 'cualquier-string-secreto-para-tenant-a',
  tenant_b: import.meta.env.VITE_TENANT_B_TOKEN ?? 'cualquier-string-secreto-para-tenant-b',
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

function authHeaders(tenant: TenantId): HeadersInit {
  return {
    Authorization: `Bearer ${TENANT_TOKENS[tenant]}`,
    'Content-Type': 'application/json',
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ──────────────────────────────────────────────────────────────────────────────
// API functions — used in TanStack Query hooks
// ──────────────────────────────────────────────────────────────────────────────

export async function fetchTasks(tenant: TenantId): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks`, {
    headers: authHeaders(tenant),
  })
  return handleResponse<Task[]>(res)
}

export async function createTask(
  tenant: TenantId,
  data: { title: string; status?: 'pending' | 'done' }
): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: authHeaders(tenant),
    body: JSON.stringify(data),
  })
  return handleResponse<Task>(res)
}

export async function deleteTask(tenant: TenantId, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(tenant),
  })
  await handleResponse<unknown>(res)
}
