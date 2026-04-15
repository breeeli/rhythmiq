import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { FilterBar, type GoalSortKey } from '@/components/goals/FilterBar'
import { GoalCard } from '@/components/goals/GoalCard'
import { TopSummaryBar } from '@/components/goals/TopSummaryBar'
import { useGoalStore, useUserStore } from '@/store'
import type { CreateGoalPayload } from '@/api'
import type { Goal } from '@/types'
import { buildGoalCardView } from '@/lib/goalPresentation'

const defaultCreateForm: CreateGoalPayload = {
  title: '',
  description: '',
  priority: 'medium',
  deadline: '',
}

function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysUntil(value?: string) {
  const date = parseDate(value)
  if (!date) return Number.POSITIVE_INFINITY
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function isNearDeadline(goal: Goal) {
  const remaining = daysUntil(goal.deadline)
  return remaining >= 0 && remaining <= 7
}

function isUrgent(goal: Goal) {
  return goal.priority === 'high' && (isNearDeadline(goal) || goal.progress < 45)
}

function priorityRank(priority: Goal['priority']) {
  if (priority === 'high') return 0
  if (priority === 'medium') return 1
  return 2
}

function focusScore(goal: Goal) {
  const deadlineUrgency = Number.isFinite(daysUntil(goal.deadline)) ? Math.max(0, 14 - daysUntil(goal.deadline)) : 0
  const statusWeight = goal.status === 'active' ? 0 : goal.status === 'completed' ? 150 : 100
  return priorityRank(goal.priority) * -100 + deadlineUrgency * 10 + (100 - goal.progress) - statusWeight
}

function sortGoals(goals: Goal[], sortBy: GoalSortKey) {
  return [...goals].sort((left, right) => {
    if (sortBy === 'priority') {
      const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority)
      if (priorityDelta !== 0) return priorityDelta
      return focusScore(right) - focusScore(left)
    }

    if (sortBy === 'deadline') {
      const leftDeadline = daysUntil(left.deadline)
      const rightDeadline = daysUntil(right.deadline)
      if (leftDeadline !== rightDeadline) return leftDeadline - rightDeadline
      return focusScore(right) - focusScore(left)
    }

    if (left.progress !== right.progress) return left.progress - right.progress
    return focusScore(right) - focusScore(left)
  })
}

function averageProgress(goals: Goal[]) {
  if (!goals.length) return 0
  return goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length
}

export default function GoalOverviewPage() {
  const navigate = useNavigate()
  const currentUser = useUserStore((state) => state.currentUser)
  const goals = useGoalStore((state) => state.goals)
  const loading = useGoalStore((state) => state.loading)
  const error = useGoalStore((state) => state.error)
  const fetchGoals = useGoalStore((state) => state.fetchGoals)
  const createGoal = useGoalStore((state) => state.createGoal)

  const [sortBy, setSortBy] = useState<GoalSortKey>('priority')
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false)
  const [showNearDeadlineOnly, setShowNearDeadlineOnly] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateGoalPayload>(defaultCreateForm)
  const fetchedUserIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!currentUser) return
    if (fetchedUserIdRef.current === currentUser.id) return
    fetchedUserIdRef.current = currentUser.id
    fetchGoals(currentUser.id).catch(() => undefined)
  }, [currentUser, fetchGoals])

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (showHighPriorityOnly && goal.priority !== 'high') return false
      if (showNearDeadlineOnly && !isNearDeadline(goal)) return false
      return true
    })
  }, [goals, showHighPriorityOnly, showNearDeadlineOnly])

  const visibleGoals = useMemo(() => sortGoals(filteredGoals, sortBy), [filteredGoals, sortBy])
  const focusCandidates = visibleGoals.length > 0 ? visibleGoals : sortGoals(goals, 'priority')
  const focusGoal = [...focusCandidates].sort((left, right) => focusScore(right) - focusScore(left))[0] ?? goals[0]
  const focusView = focusGoal ? buildGoalCardView(focusGoal) : null

  const totalGoals = goals.length
  const activeGoals = goals.filter((goal) => goal.status === 'active').length
  const averageGoalProgress = averageProgress(goals)
  const nearDeadlineCount = goals.filter(isNearDeadline).length

  const handleCreateGoal = async () => {
    if (!currentUser || !createForm.title.trim()) return
    setIsCreating(true)
    try {
      const created = await createGoal(currentUser.id, {
        title: createForm.title.trim(),
        description: createForm.description?.trim() || undefined,
        priority: createForm.priority,
        deadline: createForm.deadline || undefined,
      })

      setCreateForm(defaultCreateForm)
      setShowCreateForm(false)
      navigate(`/goals/${created.id}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f5f7fb_100%)]">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 lg:px-8 lg:py-8">
        <SectionBlock
          title="目标总览"
          description="这是一个决策页，不是任务页。先看目标，再决定下一步。"
          action={
            <Button type="button" onClick={() => setShowCreateForm((value) => !value)}>
              添加目标
            </Button>
          }
        />

        {showCreateForm && (
          <Card className="border-sky-100 bg-white/90 shadow-[0_14px_40px_rgba(14,165,233,0.08)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">添加目标</p>
                  <p className="text-xs text-slate-500">目标会自动进入后端，详情页会继续展示下一步行动。</p>
                </div>
                <Badge variant="info">后端接口</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">目标标题</span>
                  <input
                    value={createForm.title}
                    onChange={(event) => setCreateForm((state) => ({ ...state, title: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                    placeholder="例如：完成产品发布准备"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">优先级</span>
                  <select
                    value={createForm.priority}
                    onChange={(event) =>
                      setCreateForm((state) => ({ ...state, priority: event.target.value as CreateGoalPayload['priority'] }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                  >
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">目标描述</span>
                <textarea
                  value={createForm.description ?? ''}
                  onChange={(event) => setCreateForm((state) => ({ ...state, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                  placeholder="这个目标为什么重要？"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">截止日期</span>
                  <input
                    type="date"
                    value={createForm.deadline ?? ''}
                    onChange={(event) => setCreateForm((state) => ({ ...state, deadline: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowCreateForm(false)}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleCreateGoal}
                    disabled={isCreating || !createForm.title.trim()}
                  >
                    {isCreating ? '创建中' : '创建并查看'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <TopSummaryBar
          totalGoals={totalGoals}
          activeGoals={activeGoals}
          averageProgress={averageGoalProgress}
          focusTitle={focusGoal?.title ?? '暂无目标'}
          focusAction={focusView?.nextAction ?? '先添加一个目标。'}
          focusStage={focusView?.currentStage ?? '等待目标'}
          focusPriority={focusGoal?.priority ?? 'medium'}
          focusProgress={focusGoal?.progress ?? 0}
        />

        <FilterBar
          sortBy={sortBy}
          showHighPriorityOnly={showHighPriorityOnly}
          showNearDeadlineOnly={showNearDeadlineOnly}
          onSortChange={setSortBy}
          onToggleHighPriority={() => setShowHighPriorityOnly((value) => !value)}
          onToggleNearDeadline={() => setShowNearDeadlineOnly((value) => !value)}
          nearDeadlineCount={nearDeadlineCount}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              当前显示 {visibleGoals.length} 个目标，共 {goals.length} 个
            </p>
            <p className="text-sm font-medium text-slate-700">
              先看 <span className="text-slate-950">{focusGoal?.title ?? '暂无目标'}</span>
            </p>
          </div>

          {error && (
            <Card className="border-amber-200 bg-amber-50/70">
              <p className="text-sm text-amber-900">{error}</p>
            </Card>
          )}

          {loading && goals.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/80">
              <p className="text-sm text-slate-500">正在加载目标...</p>
            </Card>
          ) : visibleGoals.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={buildGoalCardView(goal)}
                  selected={goal.id === focusGoal?.id}
                  urgent={isUrgent(goal)}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-300 bg-white/80">
              <p className="text-sm text-slate-500">当前筛选条件下没有目标。</p>
            </Card>
          )}

          {showNearDeadlineOnly && (
            <p className="text-xs text-slate-400">
              “临近截止”表示 7 天内到期。只有存在截止日期的目标才会被统计。
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
