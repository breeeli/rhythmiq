import { useEffect } from 'react'
import { Target, CheckSquare, CalendarDays, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatChineseDate } from '@/lib/display'
import { useUserStore, useGoalStore, useTaskStore, usePlanStore } from '@/store'

function tomorrowDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { currentUser } = useUserStore()
  const { goals, fetchGoals } = useGoalStore()
  const { tasks, fetchTasks } = useTaskStore()
  const { targetPlan, fetchPlan, generatePlan, loading } = usePlanStore()
  const targetDate = tomorrowDate()

  useEffect(() => {
    if (!currentUser) return
    fetchGoals(currentUser.id)
    fetchTasks(currentUser.id)
    fetchPlan(currentUser.id, targetDate)
  }, [currentUser, fetchGoals, fetchTasks, fetchPlan, targetDate])

  const activeGoals = goals.filter((g) => g.status === 'active').length
  const pendingTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length
  const doneTasks = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          {currentUser ? `你好，${currentUser.name}` : '你好'}
        </h1>
        <p className="mt-1 text-slate-500">
          {formatChineseDate(new Date(), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="进行中目标" value={activeGoals} icon={Target} color="bg-indigo-500" />
        <StatCard label="待处理任务" value={pendingTasks} icon={CheckSquare} color="bg-amber-500" />
        <StatCard label="已完成任务" value={doneTasks} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard
          label="明日时间块"
          value={targetPlan?.time_blocks?.length ?? 0}
          icon={CalendarDays}
          color="bg-violet-500"
        />
      </div>

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">明日计划</h2>
          <Button
            size="sm"
            loading={loading}
            onClick={() => currentUser && generatePlan(currentUser.id, { date: targetDate })}
          >
            {targetPlan ? '重新生成' : '生成计划'}
          </Button>
        </div>

        {targetPlan?.time_blocks?.length ? (
          <ol className="space-y-2">
            {targetPlan.time_blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
              >
                <span className="w-24 shrink-0 font-mono text-xs text-slate-500">
                  {block.start_time} - {block.end_time}
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    block.type === 'work'
                      ? 'bg-indigo-500'
                      : block.type === 'break'
                        ? 'bg-emerald-400'
                        : block.type === 'personal'
                          ? 'bg-amber-400'
                          : 'bg-slate-300'
                  }`}
                />
                <span className="text-sm text-slate-700">{block.title}</span>
                {block.note && (
                  <span className="ml-auto text-xs text-slate-400">{block.note}</span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">
            还没有计划，生成明日计划后会显示在这里。
          </p>
        )}
      </Card>
    </div>
  )
}
