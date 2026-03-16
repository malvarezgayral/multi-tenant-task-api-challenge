import { useState } from 'react'
import { TenantSelector } from './components/TenantSelector'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import type { TenantId } from './lib/api'

const TENANT_COLORS: Record<TenantId, string> = {
  tenant_a: '#6366f1',
  tenant_b: '#22c55e',
}

const TENANT_LABELS: Record<TenantId, string> = {
  tenant_a: 'Tenant A',
  tenant_b: 'Tenant B',
}

export default function App() {
  const [tenant, setTenant] = useState<TenantId>('tenant_a')

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>✓</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '16px',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Task Manager
            </span>
          </div>

          {/* Active tenant indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '99px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: TENANT_COLORS[tenant],
                display: 'inline-block',
                boxShadow: `0 0 6px ${TENANT_COLORS[tenant]}`,
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: TENANT_COLORS[tenant],
              }}
            >
              {TENANT_LABELS[tenant]}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '36px 24px',
        }}
      >
        <TenantSelector selected={tenant} onChange={setTenant} />
        <TaskForm tenant={tenant} />
        <TaskList tenant={tenant} />
      </main>
    </div>
  )
}
