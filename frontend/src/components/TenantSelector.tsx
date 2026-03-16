import type { TenantId } from '../lib/api'

interface Props {
  selected: TenantId
  onChange: (tenant: TenantId) => void
}

const TENANTS: { id: TenantId; label: string }[] = [
  { id: 'tenant_a', label: 'Tenant A' },
  { id: 'tenant_b', label: 'Tenant B' },
]

export function TenantSelector({ selected, onChange }: Props) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 mb-7">
      <p className="m-0 mb-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-muted">
        Active tenant
      </p>

      <div className="flex gap-2.5">
        {TENANTS.map((t) => {
          const isSelected = selected === t.id

          /* Per-tenant selected styles */
          const selectedClass =
            t.id === 'tenant_a'
              ? 'border-accent bg-accent-muted text-accent font-bold'
              : 'border-success bg-success-muted text-success font-bold'

          const unselectedClass =
            'border-border bg-surface-elevated text-secondary font-medium ' +
            'hover:border-border-hover hover:text-primary'

          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={[
                'flex-1 px-5 py-2.5 rounded-md border-2 text-sm cursor-pointer transition-all duration-150',
                isSelected ? selectedClass : unselectedClass,
              ].join(' ')}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
