import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTask, type Task, type TenantId } from '../lib/api'

interface Props {
  task: Task
  tenant: TenantId
}

const STATUS_CLASSES: Record<Task['status'], string> = {
  pending: 'bg-accent-muted text-accent',
  done: 'bg-success-muted text-success',
}

const STATUS_LABELS: Record<Task['status'], string> = {
  pending: 'Pending',
  done: 'Done',
}

export function TaskItem({ task, tenant }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const queryClient = useQueryClient()

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

  function handleConfirm() {
    setShowConfirm(false)
    mutation.mutate()
  }

  return (
    <>
      {/* ── Task row ─────────────────────────────────────────────────── */}
      <div
        className={[
          'bg-surface border border-border hover:border-border-hover',
          'rounded-md px-[18px] py-3.5 flex items-center gap-3.5',
          'transition-colors duration-150',
          mutation.isPending ? 'opacity-50' : '',
        ].join(' ')}
      >
        {/* Status badge */}
        <span
          className={[
            'shrink-0 px-2.5 py-[3px] rounded-full text-[11px] font-semibold tracking-[0.04em]',
            STATUS_CLASSES[task.status],
          ].join(' ')}
        >
          {STATUS_LABELS[task.status]}
        </span>

        {/* Title */}
        <span
          className={[
            'flex-1 text-sm break-words',
            task.status === 'done'
              ? 'text-muted line-through'
              : 'text-primary',
          ].join(' ')}
        >
          {task.title}
        </span>

        {/* Date */}
        <span className="shrink-0 text-xs text-muted">{date}</span>

        {/* Delete trigger */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={mutation.isPending}
          title="Delete task"
          className={[
            'shrink-0 w-[30px] h-[30px] flex items-center justify-center',
            'border border-transparent rounded-sm text-base',
            'text-muted cursor-pointer transition-all duration-150',
            'hover:bg-danger-muted hover:border-danger hover:text-danger',
            'disabled:cursor-not-allowed disabled:pointer-events-none',
          ].join(' ')}
        >
          {mutation.isPending ? '…' : '×'}
        </button>
      </div>

      {/* ── Confirmation modal ───────────────────────────────────────── */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-elevated border border-border rounded-lg p-8 max-w-sm w-[90%] shadow-2xl"
          >
            <h3 className="m-0 mb-2 text-base font-bold text-primary">
              Delete task?
            </h3>
            <p className="m-0 mb-6 text-sm text-secondary leading-relaxed">
              "
              <strong className="text-primary">{task.title}</strong>
              " will be permanently deleted.
            </p>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className={[
                  'px-4 py-2 rounded-md text-sm font-medium cursor-pointer',
                  'bg-surface border border-border hover:border-border-hover',
                  'text-secondary transition-colors duration-150',
                ].join(' ')}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={[
                  'px-4 py-2 rounded-md text-sm font-semibold cursor-pointer text-white',
                  'bg-danger hover:bg-danger-hover transition-colors duration-150',
                ].join(' ')}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
