import { useEffect, useState } from 'react'
import { Plus, Trash2, Clock, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { labelPriority, labelTaskStatus, labelTimeWindow } from '@/lib/display'
import { useUserStore, useTaskStore } from '@/store'
import type { SubtaskStatus, Task, TaskPriority, TaskStatus } from '@/types'
import clsx from 'clsx'

const statusVariant: Record<TaskStatus, 'default' | 'info' | 'success' | 'warning'> = {
  todo: 'default',
  in_progress: 'info',
  done: 'success',
  skipped: 'warning',
}

function TaskRow({
  task,
  onStatusChange,
  onSubtaskStatusChange,
  onCreateSubtask,
  onDelete,
}: {
  task: Task
  onStatusChange: (id: number, status: TaskStatus) => void
  onSubtaskStatusChange: (id: number, status: SubtaskStatus) => void
  onCreateSubtask: (taskID: number, title: string) => void
  onDelete: (id: number) => void
}) {
  const [subtaskTitle, setSubtaskTitle] = useState('')

  return (
    <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={task.status === 'done'}
          onChange={(e) => onStatusChange(task.id, e.target.checked ? 'done' : 'todo')}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={clsx('text-sm font-medium', task.status === 'done' && 'line-through text-slate-400')}>
              {task.title}
            </p>
            {!!task.subtasks?.length && (
              <Badge variant="info">
                {task.subtasks.filter((item) => item.status === 'done').length}/{task.subtasks.length} 个子任务
              </Badge>
            )}
          </div>
          {task.description && (
            <p className="mt-0.5 truncate text-xs text-slate-400">{task.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {task.estimated_minutes} 分钟
          </span>
          <Badge variant={statusVariant[task.status]}>{labelTaskStatus(task.status)}</Badge>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">子任务</p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Sparkles className="h-3 w-3" />
            为智能拆解预留
          </div>
        </div>

        {task.subtasks?.length ? (
          <div className="space-y-2">
            {task.subtasks.map((subtask) => (
              <label
                key={subtask.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.status === 'done'}
                    onChange={(e) =>
                      onSubtaskStatusChange(subtask.id, e.target.checked ? 'done' : 'todo')
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="min-w-0">
                    <p className={clsx('text-sm text-slate-700', subtask.status === 'done' && 'line-through text-slate-400')}>
                      {subtask.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {subtask.estimated_minutes} 分钟 · {labelTimeWindow(subtask.prefer_window)}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant[subtask.status as TaskStatus]}>
                  {labelTaskStatus(subtask.status as TaskStatus)}
                </Badge>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">还没有子任务。</p>
        )}

        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="添加一个子任务"
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (!subtaskTitle.trim()) return
              onCreateSubtask(task.id, subtaskTitle.trim())
              setSubtaskTitle('')
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
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
        <h2 className="mb-4 text-lg font-semibold text-slate-800">新建任务</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="任务标题 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="补充说明（可选）"
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
              <option value="high">{labelPriority('high')}</option>
              <option value="medium">{labelPriority('medium')}</option>
              <option value="low">{labelPriority('low')}</option>
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
              <span className="text-xs text-slate-400">分钟</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={needsFocus}
              onChange={(e) => setNeedsFocus(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            需要深度专注
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              创建
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { currentUser } = useUserStore()
  const { tasks, fetchTasks, updateTask, deleteTask, createSubtask, updateSubtask, loading } =
    useTaskStore()
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (currentUser) fetchTasks(currentUser.id)
  }, [currentUser, fetchTasks])

  const handleStatusChange = (id: number, status: TaskStatus) => {
    updateTask(id, { status })
  }

  const handleSubtaskStatusChange = (id: number, status: SubtaskStatus) => {
    updateSubtask(id, { status })
  }

  const handleCreateSubtask = (taskID: number, title: string) => {
    createSubtask(taskID, { title })
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">任务</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> 新建任务
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">加载中...</p>
      ) : tasks.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">还没有任务，先添加一个吧。</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onSubtaskStatusChange={handleSubtaskStatusChange}
              onCreateSubtask={handleCreateSubtask}
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
