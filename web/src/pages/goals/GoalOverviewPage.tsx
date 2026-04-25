import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowUpDown, PencilLine, Plus, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GoalModal } from '@/components/goals/GoalModal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'
import { labelGoalStatus } from '@/lib/display'
import { useGoalStore, useUserStore } from '@/store'
import type { Goal, GoalStatus } from '@/types'

type StatusFilter = GoalStatus | 'all'
type SortKey = 'updated' | 'deadline' | 'progress'

const statusTabs: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'draft', label: '草稿' },
  { key: 'completed', label: '已完成' },
  { key: 'archived', label: '已归档' },
]

function toDateValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function primaryDate(goal: Goal) {
  return goal.target_date || goal.deadline || goal.review_date || goal.updated_at
}

function toTimestamp(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

function formatDate(value?: string) {
  return toDateValue(value) || '未设置'
}

function relativeTime(value?: string) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return toDateValue(value)
}

function statusTagVariant(status: GoalStatus) {
  if (status === 'active') return 'primary' as const
  if (status === 'completed') return 'success' as const
  if (status === 'draft') return 'warning' as const
  return 'neutral' as const
}

export default function GoalOverviewPage() {
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const goals = useGoalStore((s) => s.goals)
  const loading = useGoalStore((s) => s.loading)
  const error = useGoalStore((s) => s.error)
  const fetchGoals = useGoalStore((s) => s.fetchGoals)
  const deleteGoal = useGoalStore((s) => s.deleteGoal)
  const fetchedRef = useRef<number | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [searchValue, setSearchValue] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>()
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  useEffect(() => {
    if (!currentUser || fetchedRef.current === currentUser.id) return
    fetchedRef.current = currentUser.id
    fetchGoals(currentUser.id).catch(() => undefined)
  }, [currentUser, fetchGoals])

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: goals.length, draft: 0, active: 0, completed: 0, archived: 0, abandoned: 0 }
    for (const g of goals) c[g.status] = (c[g.status] ?? 0) + 1
    return c
  }, [goals])

  const filteredGoals = useMemo(() => {
    const search = searchValue.trim().toLowerCase()
    const byStatus = statusFilter === 'all' ? goals : goals.filter((g) => g.status === statusFilter)
    const bySearch = search
      ? byStatus.filter((g) => [g.title, g.description, g.outcome].some((v) => v?.toLowerCase().includes(search)))
      : byStatus
    return [...bySearch].sort((a, b) => {
      if (sortKey === 'progress') return b.progress - a.progress
      if (sortKey === 'deadline') return toTimestamp(primaryDate(a)) - toTimestamp(primaryDate(b))
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [goals, searchValue, sortKey, statusFilter])

  const openCreate = () => {
    setEditingGoal(undefined)
    setModalOpen(true)
  }

  const openEdit = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingGoal(goal)
    setModalOpen(true)
  }

  const handleDelete = async (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`删除目标「${goal.title}」？`)) return
    await deleteGoal(goal.id)
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col bg-white">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">目标</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          新建目标
        </button>
      </div>

      {/* Toolbar: status tabs + search/sort */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex gap-1">
          {statusTabs.map((tab) => {
            const active = tab.key === statusFilter
            const count = counts[tab.key]
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                )}
              >
                {tab.label}
                <span className={clsx('text-xs', active ? 'text-teal-500' : 'text-slate-400')}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          <label className="flex h-9 min-w-[220px] items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-500 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索目标..."
              className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <label className="flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-sm text-slate-500">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-transparent pr-4 text-slate-700 outline-none"
            >
              <option value="updated">最近更新</option>
              <option value="deadline">截止日期</option>
              <option value="progress">进度</option>
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-700 lg:px-8">{error}</div>
      ) : null}

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-6 py-3 font-semibold lg:px-8">目标名称</th>
              <th className="px-4 py-3 font-semibold">状态</th>
              <th className="px-4 py-3 font-semibold">进度</th>
              <th className="px-4 py-3 font-semibold">截止日期</th>
              <th className="px-4 py-3 font-semibold">更新时间</th>
              <th className="w-[100px] px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading && goals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500 lg:px-8">正在加载目标...</td>
              </tr>
            ) : filteredGoals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500 lg:px-8">当前筛选条件下没有目标。</td>
              </tr>
            ) : (
              filteredGoals.map((goal) => (
                <tr
                  key={goal.id}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                  onMouseEnter={() => setHoveredRow(goal.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-teal-50/40"
                >
                  <td className="px-6 py-3.5 align-top lg:px-8">
                    <div className="min-w-[240px]">
                      <p className="font-medium text-slate-900">{goal.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {goal.description || goal.outcome || '暂无说明'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <Tag variant={statusTagVariant(goal.status)}>{labelGoalStatus(goal.status)}</Tag>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex min-w-[120px] items-center gap-2">
                      <ProgressBar value={goal.progress} className="flex-1" />
                      <span className="text-xs text-slate-500">{goal.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top text-slate-600">{formatDate(primaryDate(goal))}</td>
                  <td className="px-4 py-3.5 align-top text-slate-500">{relativeTime(goal.updated_at)}</td>
                  <td className="px-4 py-3.5 align-top">
                    <div className={clsx('flex gap-1 transition', hoveredRow === goal.id ? 'opacity-100' : 'opacity-0')}>
                      <button
                        type="button"
                        onClick={(e) => openEdit(goal, e)}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        title="编辑"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(goal, e)}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <GoalModal
        open={modalOpen}
        goal={editingGoal}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
