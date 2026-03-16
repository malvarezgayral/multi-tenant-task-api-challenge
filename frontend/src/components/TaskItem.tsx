import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTask, type Task, type TenantId } from '../lib/api'

interface Props {
  task: Task
  tenant: TenantId
}

const STATUS_STYLES: Record<Task['status'], { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', label: 'Pending' },
  done: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', label: 'Done' },
}

export function TaskItem({ task, tenant }: Props) {
  const queryClient = useQueryClient()
  const statusStyle = STATUS_STYLES[task.status]

  const mutation = useMutation({
    mutationFn: () => deleteTask(tenant, task.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', tenant] })
    },
  })

  const date = new Date(task.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'border-color 0.15s ease',
        opacity: mutation.isPending ? 0.5 : 1,
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          'var(--color-border-hover)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          'var(--color-border)')
      }
    >
      {/* Status badge */}
      <span
        style={{
          flexShrink: 0,
          padding: '3px 10px',
          borderRadius: '99px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          backgroundColor: statusStyle.bg,
          color: statusStyle.color,
        }}
      >
        {statusStyle.label}
      </span>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: '14px',
          color:
            task.status === 'done'
              ? 'var(--color-text-muted)'
              : 'var(--color-text-primary)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          wordBreak: 'break-word',
        }}
      >
        {task.title}
      </span>

      {/* Date */}
      <span
        style={{
          flexShrink: 0,
          fontSize: '12px',
          color: 'var(--color-text-muted)',
        }}
      >
        {date}
      </span>

      {/* Delete button */}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        title="Delete task"
        style={{
          flexShrink: 0,
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!mutation.isPending) {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'var(--color-danger-muted)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor =
              'var(--color-danger)'
            ;(e.currentTarget as HTMLButtonElement).style.color =
              'var(--color-danger)'
          }
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor =
            'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color =
            'var(--color-text-muted)'
        }}
      >
        ×
      </button>
    </div>
  )
}
