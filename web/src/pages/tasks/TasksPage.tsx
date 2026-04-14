import { useEffect, useState } from 'react'
import { Bot, Clock3, Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { Tag } from '@/components/ui/Tag'
import { useTaskStore, useUserStore } from '@/store'
import {
  labelPriority,
  labelTaskStatus,
  labelTimeWindow,
} from '@/lib/display'
import type { SubtaskStatus, Task, TaskPriority, TaskStatus } from '@/types'
import clsx from 'clsx'

function TaskCard({
  task,
  onStatusChange,
  onSubtaskStatusChange,
  onCreateSubtask,
  onDecompose,
  onDelete,
}: {
  task: Task
  onStatusChange: (id: number, status: TaskStatus) => void
  onSubtaskStatusChange: (id: number, status: SubtaskStatus) => void
  onCreateSubtask: (taskID: number, title: string) => void
  onDecompose: (taskID: number) => void
  onDelete: (id: number) => void
}) {
  const [subtaskTitle, setSubtaskTitle] = useState('')

  return (
    <Card className="border-sky-100 bg-white/90 shadow-[0_18px_40px_rgba(59,130,246,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.status === 'done'}
            onChange={(e) => onStatusChange(task.id, e.target.checked ? 'done' : 'todo')}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={clsx('text-lg font-semibold text-slate-900', task.status === 'done' && 'line-through text-slate-400')}>
                {task.title}
              </h3>
              <Tag
                variant={
                  task.status === 'done'
                    ? 'success'
                    : task.status === 'in_progress'
                      ? 'primary'
                      : task.status === 'skipped'
                        ? 'warning'
                        : 'neutral'
                }
              >
                {labelTaskStatus(task.status)}
              </Tag>
            </div>
            {task.description && <p className="mt-2 text-sm leading-6 text-slate-500">{task.description}</p>}
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="rounded-2xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">预计耗时</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            <Clock3 className="mr-1 inline-block h-4 w-4 text-sky-500" />
            {task.estimated_minutes} 分钟
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">优先级</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{labelPriority(task.priority)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
          <p className="text-xs text-slate-500">专注窗口</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{task.prefer_morning ? '上午' : labelTimeWindow('any')}</p>
        </div>
      </div>

      <ProgressBar
        value={
          task.subtasks?.length
            ? (task.subtasks.filter((subtask) => subtask.status === 'done').length / task.subtasks.length) * 100
            : task.status === 'done'
              ? 100
              : 0
        }
        tone={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'warning'}
        label="完成度"
      />

      <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">子任务</p>
            <p className="text-xs text-slate-500">支持手动补充，也能一键让 agent 拆解。</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => onDecompose(task.id)}>
            <Bot className="h-4 w-4" />
            自动拆解
          </Button>
        </div>

        <div className="space-y-2">
          {task.subtasks?.length ? (
            task.subtasks.map((subtask) => (
              <label
                key={subtask.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.status === 'done'}
                    onChange={(e) => onSubtaskStatusChange(subtask.id, e.target.checked ? 'done' : 'todo')}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <p className={clsx('text-sm font-medium text-slate-800', subtask.status === 'done' && 'line-through text-slate-400')}>
                      {subtask.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {subtask.estimated_minutes} 分钟 · {labelTimeWindow(subtask.prefer_window)}
                    </p>
                  </div>
                </div>
                <Tag variant={subtask.status === 'done' ? 'success' : 'primary'}>{labelTaskStatus(subtask.status)}</Tag>
              </label>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400">
              还没有子任务，点“自动拆解”让 agent 生成。
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300"
            placeholder="添加一个自定义子任务"
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!subtaskTitle.trim()) return
              onCreateSubtask(task.id, subtaskTitle.trim())
              setSubtaskTitle('')
            }}
          >
            <Plus className="h-4 w-4" />
            添加
          </Button>
        </div>
      </div>
    </Card>
  )
}

function AddTaskCard({ userID, onClose }: { userID: number; onClose: () => void }) {
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
    <Card className="border-sky-100 bg-white/90 shadow-[0_18px_40px_rgba(59,130,246,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">快速新增</p>
          <h2 className="text-2xl font-semibold text-slate-900">创建任务</h2>
        </div>
        <Badge variant="info">手动添加</Badge>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
          placeholder="任务标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
          placeholder="补充说明（可选）"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Clock3 className="h-4 w-4 text-sky-500" />
            <input
              type="number"
              min={5}
              step={5}
              className="w-full outline-none"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
            <span className="text-xs text-slate-400">分钟</span>
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={needsFocus}
              onChange={(e) => setNeedsFocus(e.target.checked)}
              className="rounded border-slate-300 text-sky-600"
            />
            需要深度专注
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={saving}>
            创建任务
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function TasksPage() {
  const { currentUser } = useUserStore()
  const { tasks, fetchTasks, updateTask, deleteTask, createSubtask, updateSubtask, decomposeTask, loading } =
    useTaskStore()
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (currentUser) fetchTasks(currentUser.id)
  }, [currentUser, fetchTasks])

  const handleTaskStatusChange = (id: number, status: TaskStatus) => {
    void updateTask(id, { status })
  }

  const handleSubtaskStatusChange = (id: number, status: SubtaskStatus) => {
    void updateSubtask(id, { status })
  }

  const handleCreateSubtask = (taskID: number, title: string) => {
    void createSubtask(taskID, { title })
  }

  const handleDecompose = async (taskID: number) => {
    await decomposeTask(taskID)
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock
        title="任务拆解"
        description="在这里查看任务、拆分子任务并持续推进。"
        action={
          <Button onClick={() => setShowAdd((value) => !value)}>
            <Plus className="h-4 w-4" />
            新建任务
          </Button>
        }
      />

      {showAdd && currentUser && <AddTaskCard userID={currentUser.id} onClose={() => setShowAdd(false)} />}

      {loading ? (
        <Card className="text-center text-sm text-slate-400">加载中...</Card>
      ) : tasks.length === 0 ? (
        <Card className="py-16 text-center text-slate-400">还没有任务，先让系统生成一个目标再来拆解。</Card>
      ) : (
        <div className="space-y-5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleTaskStatusChange}
              onSubtaskStatusChange={handleSubtaskStatusChange}
              onCreateSubtask={handleCreateSubtask}
              onDecompose={handleDecompose}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}
