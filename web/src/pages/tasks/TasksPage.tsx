import { useEffect, useState } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUserStore, useTaskStore } from '@/store'
import type { Task, TaskPriority, TaskStatus } from '@/types'
import clsx from 'clsx'

const statusVariant: Record<TaskStatus, 'default' | 'info' | 'success' | 'warning'> = {
  todo: 'default',
  in_progress: 'info',
  done: 'success',
  skipped: 'warning',
}

function TaskRow({ task, onStatusChange, onDelete }: {
  task: Task
  onStatusChange: (id: number, status: TaskStatus) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={(e) => onStatusChange(task.id, e.target.checked ? 'done' : 'todo')}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', task.status === 'done' && 'line-through text-slate-400')}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-slate-400">{task.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {task.estimated_minutes}m
        </span>
        <Badge variant={statusVariant[task.status]}>{task.status.replace('_', ' ')}</Badge>
        <button
          onClick={() => onDelete(task.id)}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function AddTaskModal({ userID, onClose }: { userID: number; onClose: () => void }) {
  const { createTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [minutes, setMinutes] = useState(30)
  const [needsFocus, setNeedsFocus] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await createTask(userID, {
        title,
        description,
        priority,
        estimated_minutes: minutes,
        needs_focus: needsFocus,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Task title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Description (optional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3">
            <select
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex flex-1 items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <input
                type="number"
                min={5}
                step={5}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
              <span className="text-xs text-slate-400">min</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={needsFocus}
              onChange={(e) => setNeedsFocus(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            Requires deep focus
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" loading={saving}>Create</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { currentUser } = useUserStore()
  const { tasks, fetchTasks, updateTask, deleteTask, loading } = useTaskStore()
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (currentUser) fetchTasks(currentUser.id)
  }, [currentUser, fetchTasks])

  const handleStatusChange = (id: number, status: TaskStatus) => {
    updateTask(id, { status })
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : tasks.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No tasks yet. Add your first task!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {showAdd && currentUser && (
        <AddTaskModal userID={currentUser.id} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}
