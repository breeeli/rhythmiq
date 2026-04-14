import { CheckCircle2, Clock3, Sparkles, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { useRhythmiqStore } from '@/store/rhythmiqStore'

export default function DashboardPage() {
  const { goals, habits, schedules, todayProgress } = useRhythmiqStore()

  const activeGoals = goals.filter((goal) => goal.status === 'active')
  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const todayItems = schedules.filter((item) => item.day === todayKey).slice(0, 5)
  const habitDone = habits.filter((habit) => habit.completion > 0).length

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock title="Dashboard" description="展示进度、节奏和 Agent 视角下的控制感。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Today Progress" value={`${todayProgress}%`} hint="综合任务与习惯完成情况" icon={Target} />
          <MetricCard label="Active Goals" value={activeGoals.length} hint="当前推进中的目标" icon={Sparkles} />
          <MetricCard label="Today Schedule" value={todayItems.length} hint="今天的时间块数量" icon={Clock3} />
          <MetricCard label="Habit Completion" value={`${habitDone}/${habits.length}`} hint="今日习惯完成数" icon={CheckCircle2} />
        </div>
      </SectionBlock>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <SectionBlock title="Active Goals" description="目标与进度条统一展示。">
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{goal.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{goal.description}</p>
                    </div>
                    <Tag variant="primary">{goal.progress}%</Tag>
                  </div>
                  <ProgressBar value={goal.progress} className="mt-3" />
                </div>
              ))}
            </div>
          </SectionBlock>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionBlock title="Today Schedule" description="只保留今天最关键的结构化安排。">
              <div className="space-y-3">
                {todayItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <Tag variant={item.kind === 'habit' ? 'success' : item.kind === 'task' ? 'warning' : 'neutral'}>
                        {item.kind}
                      </Tag>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.start} - {item.end}
                    </p>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </Card>

          <Card>
            <SectionBlock title="Agent Insights" description="简短、明确、可执行。">
              <p className="text-sm leading-6 text-slate-600">
                你现在最需要的是先稳住主目标，再让习惯和固定日程给任务让路。不要把所有事情都塞进一天，保持清晰会比堆满更有效。
              </p>
            </SectionBlock>
          </Card>
        </div>
      </div>
    </div>
  )
}
