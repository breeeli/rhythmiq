import { useEffect } from 'react'
import { Target, CheckSquare, CalendarDays, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useUserStore, useGoalStore, useTaskStore, usePlanStore } from '@/store'

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
  const { todayPlan, fetchToday, generatePlan, loading } = usePlanStore()

  useEffect(() => {
    if (!currentUser) return
    fetchGoals(currentUser.id)
    fetchTasks(currentUser.id)
    fetchToday(currentUser.id)
  }, [currentUser, fetchGoals, fetchTasks, fetchToday])

  const activeGoals = goals.filter((g) => g.status === 'active').length
  const pendingTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length
  const doneTasks = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Good morning{currentUser ? `, ${currentUser.name}` : ''} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Active Goals" value={activeGoals} icon={Target} color="bg-indigo-500" />
        <StatCard label="Pending Tasks" value={pendingTasks} icon={CheckSquare} color="bg-amber-500" />
        <StatCard label="Done Today" value={doneTasks} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard
          label="Today's Blocks"
          value={todayPlan?.time_blocks?.length ?? 0}
          icon={CalendarDays}
          color="bg-violet-500"
        />
      </div>

      {/* Today's plan preview */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Today's Plan</h2>
          <Button
            size="sm"
            loading={loading}
            onClick={() => currentUser && generatePlan(currentUser.id)}
          >
            {todayPlan ? 'Regenerate' : 'Generate Plan'}
          </Button>
        </div>

        {todayPlan?.time_blocks?.length ? (
          <ol className="space-y-2">
            {todayPlan.time_blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
              >
                <span className="w-24 shrink-0 text-xs font-mono text-slate-500">
                  {block.start_time} – {block.end_time}
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
            No plan yet — click "Generate Plan" to create one with AI.
          </p>
        )}
      </Card>
    </div>
  )
}
