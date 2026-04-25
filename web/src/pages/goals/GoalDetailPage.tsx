import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, PencilLine, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { taskApi, type CreateTaskPayload, type UpdateTaskPayload } from '@/api'
import { GoalModal } from '@/components/goals/GoalModal'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'
import { labelGoalStatus, labelPriority, labelTaskStatus } from '@/lib/display'
import { useGoalStore, useUserStore } from '@/store'
import type { Goal, Task, TaskStatus } from '@/types'

const taskStatuses: TaskStatus[] = ['todo', 'in_progress', 'done', 'skipped']

function toDateValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function formatDate(value?: string) {
  return toDateValue(value) || '未设置'
}

function primaryDate(goal: Goal) {
  return goal.target_date || goal.deadline || goal.review_date
}

function statusTagVariant(status: Goal['status']) {
  if (status === 'active') return 'primary' as const
  if (status === 'completed') return 'success' as const
  if (status === 'draft') return 'warning' as const
  if (status === 'abandoned') return 'danger' as const
  return 'neutral' as const
}

function taskStatusColor(status: TaskStatus) {
  if (status === 'done') return 'border-emerald-200 text-emerald-700'
  if (status === 'in_progress') return 'border-teal-200 text-teal-700'
  if (status === 'skipped') return 'border-slate-200 text-slate-500'
  return 'border-amber-200 text-amber-700'
}

export default function GoalDetailPage() {
  const navigate = useNavigate()
  const { goalId } = useParams()
  const currentUser = useUserStore((s) => s.currentUser)
  const goals = useGoalStore((s) => s.goals)
  const loading = useGoalStore((s) => s.loading)
  const error = useGoalStore((s) => s.error)
  const fetchGoals = useGoalStore((s) => s.fetchGoals)
  const fetchGoalById = useGoalStore((s) => s.fetchGoalById)
  const deleteGoal = useGoalStore((s) => s.deleteGoal)
  const requestedRef = useRef<number | null>(null)
  const fetchedUserRef = useRef<number | null>(null)

  const numericGoalId = Number(goalId)
  const goal = goals.find((g) => g.id === numericGoalId)

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [savingTask, setSavingTask] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [criteriaOpen, setCriteriaOpen] = useState(false)
  const [childGoalsOpen, setChildGoalsOpen] = useState(false)

  useEffect(() => {
    if (!currentUser || fetchedUserRef.current === currentUser.id) return
    fetchedUserRef.current = currentUser.id
    fetchGoals(currentUser.id).catch(() => undefined)
  }, [currentUser, fetchGoals])

  useEffect(() => {
    if (!currentUser || !Number.isFinite(numericGoalId)) return
    if (goal || requestedRef.current === numericGoalId) return
    requestedRef.current = numericGoalId
    fetchGoalById(numericGoalId).catch(() => undefined)
  }, [currentUser, fetchGoalById, goal, numericGoalId])

  const tasks = useMemo(() => {
    return [...(goal?.tasks ?? [])].sort((a, b) => {
      if (a.sequence !== b.sequence) return a.sequence - b.sequence
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }, [goal?.tasks])

  const taskStats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'done').length
    return { total: tasks.length, done }
  }, [tasks])

  const childGoals = useMemo(
    () => goals.filter((g) => g.parent_goal_id === goal?.id),
    [goals, goal?.id],
  )

  const parentGoal = useMemo(
    () => (goal?.parent_goal_id ? goals.find((g) => g.id === goal.parent_goal_id) : undefined),
    [goals, goal?.parent_goal_id],
  )

  const criteria = useMemo(
    () => (goal?.success_criteria ?? []).map((s) => s.trim()).filter(Boolean),
    [goal?.success_criteria],
  )

  if (!Number.isFinite(numericGoalId)) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-white">
        <p className="text-sm text-slate-500">目标编号无效。</p>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-white">
        <div className="text-center text-sm text-slate-500">
          {loading ? '正在加载目标...' : '没有找到这个目标。'}
          {error ? <p className="mt-2 text-amber-700">{error}</p> : null}
        </div>
      </div>
    )
  }

  const refreshGoal = () => fetchGoalById(goal.id)

  const addTask = async () => {
    if (!currentUser || !newTaskTitle.trim()) return
    setTaskError(null)
    setSavingTask(true)
    try {
      await taskApi.create(currentUser.id, {
        title: newTaskTitle.trim(),
        goal_id: goal.id,
        sequence: tasks.length + 1,
        estimated_minutes: 30,
      } satisfies CreateTaskPayload)
      setNewTaskTitle('')
      await refreshGoal()
    } catch (e) {
      setTaskError(e instanceof Error ? e.message : '创建任务失败')
    } finally {
      setSavingTask(false)
    }
  }

  const updateTask = async (task: Task, data: UpdateTaskPayload) => {
    setTaskError(null)
    try {
      await taskApi.update(task.id, data)
      await refreshGoal()
    } catch (e) {
      setTaskError(e instanceof Error ? e.message : '更新任务失败')
    }
  }

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`删除任务「${task.title}」？`)) return
    setTaskError(null)
    try {
      await taskApi.delete(task.id)
      await refreshGoal()
    } catch (e) {
      setTaskError(e instanceof Error ? e.message : '删除任务失败')
    }
  }

  const removeGoal = async () => {
    if (!window.confirm(`删除目标「${goal.title}」？`)) return
    await deleteGoal(goal.id)
    navigate('/goals')
  }

  const isCurrentTask = (task: Task) =>
    task.status === 'in_progress' || (task.status === 'todo' && tasks.find((t) => t.status === 'in_progress' || t.status === 'todo')?.id === task.id)

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col bg-white">
      {/* Breadcrumb + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <button
            type="button"
            onClick={() => navigate('/goals')}
            className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            目标
          </button>
          {parentGoal ? (
            <>
              <span>/</span>
              <button
                type="button"
                onClick={() => navigate(`/goals/${parentGoal.id}`)}
                className="text-slate-500 transition hover:text-slate-900"
              >
                {parentGoal.title}
              </button>
            </>
          ) : null}
          <span>/</span>
          <span className="text-slate-700">{goal.title}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <PencilLine className="h-4 w-4" />
            编辑
          </Button>
          <Button variant="danger" onClick={removeGoal}>
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-6 lg:px-8">
        {/* Header: tags + title + description + progress */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tag variant={statusTagVariant(goal.status)}>{labelGoalStatus(goal.status)}</Tag>
            <Tag variant={goal.priority === 'high' ? 'warning' : 'neutral'}>{labelPriority(goal.priority)}优先级</Tag>
            <span className="text-sm text-slate-400">截止 {formatDate(primaryDate(goal))}</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{goal.title}</h1>

          {goal.description || goal.outcome ? (
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              {goal.description || goal.outcome}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <ProgressBar value={goal.progress} className="max-w-md flex-1" />
            <span className="text-sm font-medium text-slate-700">{goal.progress}%</span>
            <span className="text-sm text-slate-400">
              {taskStats.done}/{taskStats.total} 任务完成
            </span>
          </div>
        </div>

        {/* Task table */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">任务</h2>

          {taskError ? (
            <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{taskError}</div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-semibold">标题</th>
                  <th className="w-[120px] px-4 py-3 font-semibold">状态</th>
                  <th className="w-[90px] px-4 py-3 font-semibold">预计</th>
                  <th className="w-[100px] px-4 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                      还没有任务，在下方添加第一个。
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const highlight = isCurrentTask(task) && task.status !== 'done' && task.status !== 'skipped'
                    return (
                      <tr
                        key={task.id}
                        className={clsx(
                          'border-b border-slate-100',
                          highlight && 'bg-teal-50/50',
                        )}
                      >
                        <td className="px-4 py-3 align-top">
                          <p className={clsx('font-medium', task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900')}>
                            {task.title}
                          </p>
                          {task.description ? (
                            <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task, { status: e.target.value as TaskStatus })}
                            className={clsx(
                              'rounded-md border bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-100',
                              taskStatusColor(task.status),
                            )}
                          >
                            {taskStatuses.map((s) => (
                              <option key={s} value={s}>{labelTaskStatus(s)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-500">
                          {task.estimated_minutes}min
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex gap-1">
                            {task.status !== 'done' ? (
                              <button
                                type="button"
                                onClick={() => updateTask(task, { status: 'done' })}
                                className="rounded p-1 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                                title="完成"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteTask(task)}
                              className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}

                {/* Inline add row */}
                <tr className="border-b border-slate-100">
                  <td colSpan={4} className="px-4 py-2.5">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        addTask()
                      }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm text-slate-400">+</span>
                      <input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="添加任务..."
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        disabled={savingTask}
                      />
                      {newTaskTitle.trim() ? (
                        <button
                          type="submit"
                          disabled={savingTask}
                          className="text-xs font-medium text-teal-600 hover:text-teal-700"
                        >
                          {savingTask ? '添加中...' : '回车添加'}
                        </button>
                      ) : null}
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Collapsible sections */}
        <div className="mt-8 space-y-1">
          <button
            type="button"
            onClick={() => setCriteriaOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {criteriaOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            成功标准 ({criteria.length})
          </button>
          {criteriaOpen ? (
            <div className="space-y-2 pb-2 pl-8">
              {criteria.length > 0 ? (
                criteria.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-teal-500" />
                    <span>{c}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">暂无成功标准。</p>
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setChildGoalsOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {childGoalsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            子目标 ({childGoals.length})
          </button>
          {childGoalsOpen ? (
            <div className="space-y-1 pb-2 pl-8">
              {childGoals.length > 0 ? (
                childGoals.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => navigate(`/goals/${g.id}`)}
                    className="block w-full rounded px-2 py-1.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    {g.title}
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-400">暂无子目标。</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <GoalModal
        open={modalOpen}
        goal={goal}
        onClose={() => setModalOpen(false)}
        onSaved={() => refreshGoal()}
      />
    </div>
  )
}
