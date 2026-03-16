import type { TenantId } from '../lib/api'

interface Props {
  selected: TenantId
  onChange: (tenant: TenantId) => void
}

const TENANTS: { id: TenantId; label: string; color: string }[] = [
  { id: 'tenant_a', label: 'Tenant A', color: '#6366f1' },
  { id: 'tenant_b', label: 'Tenant B', color: '#22c55e' },
]

export function TenantSelector({ selected, onChange }: Props) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '28px',
      }}
    >
      <p
        style={{
          margin: '0 0 12px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        Active tenant
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        {TENANTS.map((t) => {
          const isSelected = selected === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid',
                borderColor: isSelected ? t.color : 'var(--color-border)',
                backgroundColor: isSelected
                  ? `${t.color}22`
                  : 'var(--color-surface-elevated)',
                color: isSelected ? t.color : 'var(--color-text-secondary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                    'var(--color-border-hover)'
                  ;(e.currentTarget as HTMLButtonElement).style.color =
                    'var(--color-text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                    'var(--color-border)'
                  ;(e.currentTarget as HTMLButtonElement).style.color =
                    'var(--color-text-secondary)'
                }
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
