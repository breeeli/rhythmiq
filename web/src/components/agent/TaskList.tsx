import type { Task } from '@/types'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'

interface TaskListProps {
  tasks: Task[]
  onToggle?: (taskId: number) => void
}

export function TaskList({ tasks, onToggle }: TaskListProps) {
  const doneCount = tasks.filter((task) => task.status === 'done').length
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Task list</h3>
          <Tag variant="warning">{doneCount}/{tasks.length}</Tag>
        </div>
        <ProgressBar value={(doneCount / Math.max(1, tasks.length)) * 100} tone="warning" label="Tasks completed" />
        <div className="space-y-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onToggle?.(task.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40"
            >
              <span
                className={[
                  'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs',
                  task.status === 'done'
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 bg-white text-transparent',
                ].join(' ')}
              >
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.estimated_minutes} min</p>
              </div>
              <Tag variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'neutral'}>
                {task.status}
              </Tag>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
