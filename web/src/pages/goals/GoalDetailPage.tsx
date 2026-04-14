import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'
import { GoalTimeline } from '@/components/goal/GoalTimeline'
import { useRhythmiqStore } from '@/store/rhythmiqStore'

export default function GoalDetailPage() {
  const { goalId } = useParams()
  const goals = useRhythmiqStore((state) => state.goals)
  const tasks = useRhythmiqStore((state) => state.tasks)
  const schedules = useRhythmiqStore((state) => state.schedules)
  const toggleGoalTask = useRhythmiqStore((state) => state.toggleGoalTask)

  const goal = goals.find((item) => item.id === Number(goalId)) ?? goals[0]
  const goalTasks = useMemo(() => tasks.filter((task) => task.goal_id === goal?.id), [goal, tasks])
  const goalSchedule = schedules.filter((item) => item.goalId === goal?.id)

  if (!goal) {
    return <Card>没有找到目标。</Card>
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock
        title={goal.title}
        description={goal.description}
        action={<Tag variant={goal.status === 'completed' ? 'success' : 'primary'}>{goal.progress}%</Tag>}
      />

      <Card>
        <ProgressBar value={goal.progress} tone={goal.progress > 70 ? 'success' : 'primary'} label="Progress" />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <SectionBlock title="Plan" description="Agent 输出的计划会沉淀在这里。">
            <ol className="space-y-2">
              {(goal.tasks ?? goalTasks).map((task, index) => (
                <li key={task.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-700">{task.title}</p>
                </li>
              ))}
            </ol>
          </SectionBlock>
        </Card>

        <Card>
          <SectionBlock title="Task List" description="Checkbox 风格任务清单。">
            <div className="space-y-2">
              {goalTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleGoalTask(goal.id, task.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/40"
                >
                  <span
                    className={[
                      'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs',
                      task.status === 'done'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white text-transparent',
                    ].join(' ')}
                  >
                    ✓
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.estimated_minutes} min</p>
                  </div>
                  <Tag variant={task.status === 'done' ? 'success' : 'warning'}>{task.status}</Tag>
                </button>
              ))}
            </div>
          </SectionBlock>
        </Card>
      </div>

      <GoalTimeline items={goalSchedule} />
    </div>
  )
}
