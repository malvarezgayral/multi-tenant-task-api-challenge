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
      <div className="text-center py-12 text-muted text-sm">
        Loading tasks…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-danger-muted border border-danger rounded-md px-5 py-4 text-danger text-sm">
        Failed to load tasks: {(error as Error).message}
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm border border-dashed border-border rounded-lg">
        No tasks yet — add one above.
      </div>
    )
  }

  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div className="flex flex-col gap-2">
      {/* Pending tasks first */}
      {pending.map((task) => (
        <TaskItem key={task.id} task={task} tenant={tenant} />
      ))}

      {/* Completed tasks below */}
      {done.length > 0 && (
        <>
          {pending.length > 0 && (
            <div className="mt-2 mb-1 text-[11px] font-semibold text-muted tracking-[0.06em] uppercase">
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
