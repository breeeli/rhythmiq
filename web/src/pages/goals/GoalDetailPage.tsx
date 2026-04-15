import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Sparkles, Target, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { Tag } from '@/components/ui/Tag'
import { labelGoalStatus, labelGoalType, labelPriority } from '@/lib/display'
import { buildGoalDetailView } from '@/lib/goalPresentation'
import { useGoalStore, useUserStore } from '@/store'

function formatDeadline(value?: string) {
  if (!value) return '暂无截止日期'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string
  value: string
  hint: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border-slate-200 bg-white/90">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default function GoalDetailPage() {
  const navigate = useNavigate()
  const { goalId } = useParams()
  const currentUser = useUserStore((state) => state.currentUser)
  const goals = useGoalStore((state) => state.goals)
  const loading = useGoalStore((state) => state.loading)
  const error = useGoalStore((state) => state.error)
  const fetchGoalById = useGoalStore((state) => state.fetchGoalById)
  const updateGoal = useGoalStore((state) => state.updateGoal)
  const requestedGoalIdRef = useRef<number | null>(null)

  const numericGoalId = Number(goalId)
  const goal = goals.find((item) => item.id === numericGoalId)

  useEffect(() => {
    if (!currentUser || !Number.isFinite(numericGoalId)) return
    if (goal || requestedGoalIdRef.current === numericGoalId) return
    requestedGoalIdRef.current = numericGoalId
    fetchGoalById(numericGoalId).catch(() => undefined)
  }, [currentUser, fetchGoalById, goal, numericGoalId])

  const detail = useMemo(() => (goal ? buildGoalDetailView(goal) : null), [goal])

  const urgencyText = useMemo(() => {
    if (!goal) return '暂无目标'
    if (goal.status === 'completed') return '已完成'
    if (goal.priority === 'high' && goal.progress < 45) return '需要优先处理'
    if (goal.priority === 'high') return '高优先级'
    if (goal.progress >= 80) return '接近完成'
    return '正常推进'
  }, [goal])

  if (!Number.isFinite(numericGoalId)) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <p className="text-sm text-slate-500">这个目标编号无效。</p>
          <Button className="mt-4" onClick={() => navigate('/goals')}>
            返回总览
          </Button>
        </Card>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <p className="text-sm text-slate-500">{loading ? '正在加载目标详情...' : '没有找到这个目标。'}</p>
          {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
          <Button className="mt-4" onClick={() => navigate('/goals')}>
            返回总览
          </Button>
        </Card>
      </div>
    )
  }

  if (!detail) return null

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f5f7fb_100%)]">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 lg:px-8 lg:py-8">
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/goals')}>
            <ArrowLeft className="h-4 w-4" />
            返回总览
          </Button>
          <Badge variant={goal.priority === 'high' ? 'warning' : goal.priority === 'medium' ? 'primary' : 'default'}>
            {urgencyText}
          </Badge>
        </div>

        <Card className="border-0 bg-[linear-gradient(135deg,#eff8ff_0%,#ffffff_48%,#f7fbff_100%)] shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 p-6 xl:grid-cols-[1.18fr_0.82fr] xl:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Tag variant={goal.priority === 'high' ? 'warning' : goal.priority === 'medium' ? 'primary' : 'neutral'}>
                  {labelPriority(goal.priority)}优先级
                </Tag>
                <Tag variant="neutral">{labelGoalType(goal.type)}</Tag>
                <Tag variant="neutral">{labelGoalStatus(goal.status)}</Tag>
                {goal.tasks?.length ? <Badge variant="info">{goal.tasks.length} 个任务</Badge> : null}
              </div>

              <div className="space-y-3">
                <input
                  value={goal.title}
                  onChange={(event) => updateGoal(goal.id, { title: event.target.value })}
                  className="w-full rounded-[1.75rem] border border-white/60 bg-white/90 px-5 py-4 text-3xl font-semibold text-slate-900 outline-none shadow-sm transition focus:border-sky-300"
                />
                <textarea
                  value={goal.description ?? ''}
                  onChange={(event) => updateGoal(goal.id, { description: event.target.value })}
                  rows={3}
                  className="w-full rounded-[1.75rem] border border-white/60 bg-white/90 px-5 py-4 text-sm leading-7 text-slate-600 outline-none shadow-sm transition focus:border-sky-300"
                  placeholder="补充这个目标为什么重要"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">优先级</span>
                  <select
                    value={goal.priority}
                    onChange={(event) => updateGoal(goal.id, { priority: event.target.value as typeof goal.priority })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                  >
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">截止日期</span>
                  <input
                    type="date"
                    value={goal.deadline ?? ''}
                    onChange={(event) => updateGoal(goal.id, { deadline: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                  />
                </label>
                <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">进度</span>
                    <span className="font-semibold text-slate-900">{goal.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={goal.progress}
                    onChange={(event) => updateGoal(goal.id, { progress: Number(event.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <StatCard
                title="目标进度"
                value={`${goal.progress}%`}
                hint="目标当前完成情况"
                icon={<Target className="h-5 w-5" />}
              />
              <StatCard
                title="当前阶段"
                value={detail.currentStage}
                hint="系统根据进度自动判断"
                icon={<Sparkles className="h-5 w-5" />}
              />
              <StatCard
                title="截止日期"
                value={formatDeadline(goal.deadline)}
                hint="有截止日期时，系统会优先提醒"
                icon={<CalendarDays className="h-5 w-5" />}
              />
              <StatCard
                title="任务数量"
                value={String(detail.taskCount)}
                hint="后端返回的关联任务数"
                icon={<Clock3 className="h-5 w-5" />}
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionBlock
            title="下一步行动"
            description="目标详情页最重要的部分，打开后应该能立刻开始做。"
            action={<Badge variant="primary">1 个行动</Badge>}
          >
            <Card className="border-sky-100 bg-white/95">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">下一步行动</p>
                </div>
                <p className="text-xl font-semibold leading-8 text-slate-950">{detail.nextAction}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button">现在开始</Button>
                  <Button type="button" variant="secondary">
                    稍后提醒
                  </Button>
                </div>
              </div>
            </Card>
          </SectionBlock>

          <SectionBlock
            title="执行拆解"
            description="不是任务清单，而是把目标拆成更容易开始的动作。"
            action={<Badge variant="default">{detail.steps.length} 步</Badge>}
          >
            <div className="space-y-3">
              {detail.steps.map((step, index) => (
                <Card key={step} className="border-slate-200 bg-white/90">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-slate-700">{step}</p>
                  </div>
                </Card>
              ))}
            </div>
          </SectionBlock>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
          <SectionBlock title="可能阻塞点" description="提前看到问题，才能减少拖延。">
            <Card className="border-amber-100 bg-amber-50/60">
              <div className="space-y-3">
                {detail.blockers.map((blocker) => (
                  <div key={blocker} className="flex items-start gap-2">
                    <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                    <p className="text-sm leading-7 text-amber-900">{blocker}</p>
                  </div>
                ))}
              </div>
            </Card>
          </SectionBlock>

          <SectionBlock title="排期建议" description="让目标有具体的落点，而不是停留在想法里。">
            <Card className="border-slate-200 bg-white/90">
              <div className="space-y-3">
                {detail.scheduleHints.map((hint) => (
                  <div key={hint} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <p className="text-sm leading-7 text-slate-700">{hint}</p>
                  </div>
                ))}
              </div>
            </Card>
          </SectionBlock>

          <SectionBlock title="当前状态" description="把这个目标放到更明确的决策上下文里。">
            <Card className="border-slate-200 bg-white/90">
              <div className="space-y-3">
                <ProgressBar value={goal.progress} tone={goal.progress > 70 ? 'success' : 'primary'} label="目标进度" />
                <p className="text-sm leading-7 text-slate-600">
                  {goal.priority === 'high'
                    ? '这个目标应该优先获得时间和注意力。'
                    : goal.priority === 'medium'
                      ? '这个目标需要稳定推进，但可以和其他事项并行。'
                      : '这个目标可以保持推进，不必占据最优先的位置。'}
                </p>
              </div>
            </Card>
          </SectionBlock>
        </div>
      </div>
    </main>
  )
}
