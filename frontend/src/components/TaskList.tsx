import { useQuery } from '@tanstack/react-query'
import { fetchTasks, type TenantId } from '../lib/api'
import { TaskItem } from './TaskItem'

interface Props {
  tenant: TenantId
}

export function TaskList({ tenant }: Props) {
  const { data: tasks, isLoading, isError, error } = useQuery({
    queryKey: ['tasks', tenant],
    queryFn: () => fetchTasks(tenant),
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
        Loading tasks…
      </div>
    )
  }

  if (isError) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-danger-muted)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          color: 'var(--color-danger)',
          fontSize: '14px',
        }}
      >
        Failed to load tasks: {(error as Error).message}
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 0',
          color: 'var(--color-text-muted)',
          fontSize: '14px',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        No tasks yet — add one above.
      </div>
    )
  }

  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Pending tasks first */}
      {pending.map((task) => (
        <TaskItem key={task.id} task={task} tenant={tenant} />
      ))}
      {/* Completed tasks below */}
      {done.length > 0 && (
        <>
          {pending.length > 0 && (
            <div
              style={{
                margin: '8px 0 4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Completed
            </div>
          )}
          {done.map((task) => (
            <TaskItem key={task.id} task={task} tenant={tenant} />
          ))}
        </>
      )}
    </div>
  )
}
