import { ArrowUpRight, Clock3, Sparkles, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { ProgressBar } from './ProgressBar'

interface SummaryMetricProps {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
}

function SummaryMetric({ label, value, hint, icon }: SummaryMetricProps) {
  return (
    <Card className="border-slate-200/70 bg-white/90">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface TopSummaryBarProps {
  totalGoals: number
  activeGoals: number
  averageProgress: number
  focusTitle: string
  focusAction: string
  focusStage: string
  focusPriority: 'low' | 'medium' | 'high'
  focusProgress: number
}

export function TopSummaryBar({
  totalGoals,
  activeGoals,
  averageProgress,
  focusTitle,
  focusAction,
  focusStage,
  focusPriority,
  focusProgress,
}: TopSummaryBarProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_1.3fr]">
        <SummaryMetric
          label="目标总数"
          value={String(totalGoals)}
          hint="当前所有目标的数量"
          icon={<Target className="h-5 w-5" />}
        />
        <SummaryMetric
          label="进行中目标"
          value={String(activeGoals)}
          hint="还需要继续推进的目标"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <SummaryMetric
          label="平均进度"
          value={`${Math.round(averageProgress)}%`}
          hint="所有目标的平均完成度"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <Card className="border-teal-200 bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(255,255,255,0.96))] shadow-[0_16px_40px_rgba(20,184,166,0.12)]">
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-teal-500">今日聚焦</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{focusTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{focusStage}</p>
              </div>
              <Tag variant={focusPriority === 'high' ? 'warning' : focusPriority === 'medium' ? 'primary' : 'neutral'}>
                {focusPriority === 'high' ? '高' : focusPriority === 'medium' ? '中' : '低'}
              </Tag>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-teal-100 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-500">下一步行动</p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-950">{focusAction}</p>
              </div>
              <ProgressBar value={focusProgress} tone={focusProgress > 70 ? 'success' : 'primary'} label="聚焦进度" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-teal-100 bg-white/80 px-4 py-3 text-sm text-slate-600">
              <span>系统自动挑选，减少决策时间</span>
              <ArrowUpRight className="h-4 w-4 text-teal-500" />
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
