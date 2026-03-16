import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, type TenantId } from '../lib/api'

interface Props {
  tenant: TenantId
}

export function TaskForm({ tenant }: Props) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (title: string) => createTask(tenant, { title }),
    onSuccess: () => {
      setTitle('')
      setError(null)
      // Invalidate tasks for this tenant — TanStack Query re-fetches automatically
      void queryClient.invalidateQueries({ queryKey: ['tasks', tenant] })
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    mutation.mutate(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '28px' }}>
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title…"
          disabled={mutation.isPending}
          maxLength={500}
          style={{
            flex: 1,
            padding: '10px 14px',
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !title.trim()}
          style={{
            padding: '10px 22px',
            backgroundColor: mutation.isPending ? 'var(--color-surface-elevated)' : 'var(--color-accent)',
            color: mutation.isPending ? 'var(--color-text-muted)' : '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!mutation.isPending)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-accent-hover)'
          }}
          onMouseLeave={(e) => {
            if (!mutation.isPending)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-accent)'
          }}
        >
          {mutation.isPending ? 'Adding…' : '+ Add task'}
        </button>
      </div>

      {error && (
        <p
          style={{
            marginTop: '8px',
            marginLeft: '4px',
            fontSize: '13px',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </p>
      )}
    </form>
  )
}
