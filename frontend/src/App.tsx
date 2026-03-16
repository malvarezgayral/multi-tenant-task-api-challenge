import { useState } from 'react'
import { TenantSelector } from './components/TenantSelector'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import type { TenantId } from './lib/api'

const TENANT_LABELS: Record<TenantId, string> = {
  tenant_a: 'Tenant A',
  tenant_b: 'Tenant B',
}

export default function App() {
  const [tenant, setTenant] = useState<TenantId>('tenant_a')

  const dotClass =
    tenant === 'tenant_a'
      ? 'bg-accent shadow-[0_0_6px_var(--color-accent)]'
      : 'bg-success shadow-[0_0_6px_var(--color-success)]'

  const labelClass = tenant === 'tenant_a' ? 'text-accent' : 'text-success'

  return (
    <div className="min-h-screen bg-bg font-sans">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto h-[60px] flex items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✓</span>
            <span className="font-bold text-base text-primary tracking-tight">
              Task Manager
            </span>
          </div>

          {/* Active tenant indicator */}
          <div className="flex items-center gap-2 px-3 py-[5px] bg-surface-elevated border border-border rounded-full">
            <span className={`w-2 h-2 rounded-full inline-block ${dotClass}`} />
            <span className={`text-xs font-semibold ${labelClass}`}>
              {TENANT_LABELS[tenant]}
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-9">
        <TenantSelector selected={tenant} onChange={setTenant} />
        <TaskForm tenant={tenant} />
        <TaskList tenant={tenant} />
      </main>
    </div>
  )
}
