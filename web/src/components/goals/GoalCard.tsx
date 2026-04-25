import { ArrowRight, CalendarDays, Flame, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { ProgressBar } from './ProgressBar'
import { labelGoalStatus } from '@/lib/display'
import type { GoalCardView } from '@/lib/goalPresentation'

interface GoalCardProps {
  goal: GoalCardView
  selected?: boolean
  urgent?: boolean
  onClick?: () => void
}

function formatDeadline(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export function GoalCard({ goal, selected = false, urgent = false, onClick }: GoalCardProps) {
  const deadline = formatDeadline(goal.deadline)

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-full text-left"
      aria-label={`打开目标详情：${goal.title}`}
    >
      <Card
        className={clsx(
          'group h-full border-slate-200/80 bg-white/95 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.09)]',
          selected && 'ring-2 ring-teal-300 shadow-[0_20px_40px_rgba(20,184,166,0.12)]',
          urgent && 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.98))]',
        )}
      >
        <article className="flex h-full flex-col gap-4">
          <header className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag variant={goal.priority === 'high' ? 'warning' : goal.priority === 'medium' ? 'primary' : 'neutral'}>
                    {goal.priority === 'high' ? '高优先级' : goal.priority === 'medium' ? '中优先级' : '低优先级'}
                  </Tag>
                  {goal.status !== 'active' && <Tag variant="neutral">{labelGoalStatus(goal.status)}</Tag>}
                  {urgent && (
                    <Tag variant="danger" className="gap-1">
                      <Flame className="h-3.5 w-3.5" />
                      紧急
                    </Tag>
                  )}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{goal.title}</h3>
                {goal.description && <p className="max-w-2xl text-sm leading-6 text-slate-500">{goal.description}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">进度</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{goal.progress}%</p>
              </div>
            </div>

            <ProgressBar value={goal.progress} tone={goal.progress > 70 ? 'success' : 'primary'} />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">当前阶段</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{goal.currentStage}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">截止日期</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {deadline ?? '暂无截止日期'}
                </div>
              </div>
            </div>
          </header>

          <div className="rounded-[1.1rem] border border-teal-100 bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(255,255,255,0.98))] p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-500">下一步行动</p>
            </div>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-950">{goal.nextAction}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
              现在就做
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </article>
      </Card>
    </button>
  )
}
