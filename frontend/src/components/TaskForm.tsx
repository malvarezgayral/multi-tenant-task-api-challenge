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
    <form onSubmit={handleSubmit} className="mb-7">
      <div className="bg-surface border border-border rounded-lg p-5 flex gap-3 items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title…"
          disabled={mutation.isPending}
          maxLength={500}
          className={[
            'flex-1 px-3.5 py-2.5 rounded-md text-sm outline-none transition-colors duration-150',
            'bg-surface-elevated border border-border text-primary placeholder:text-muted',
            'focus:border-accent',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !title.trim()}
          className={[
            'px-[22px] py-2.5 rounded-md font-semibold text-sm whitespace-nowrap',
            'transition-colors duration-150 cursor-pointer',
            'bg-accent hover:bg-accent-hover text-white',
            'disabled:bg-surface-elevated disabled:text-muted disabled:cursor-not-allowed disabled:pointer-events-none',
          ].join(' ')}
        >
          {mutation.isPending ? 'Adding…' : '+ Add task'}
        </button>
      </div>

      {error && (
        <p className="mt-2 ml-1 text-sm text-danger">{error}</p>
      )}
    </form>
  )
}
