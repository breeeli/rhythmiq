import type { Goal } from '@/types'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'

interface GoalCardProps {
  goal: Goal
}

export function GoalCard({ goal }: GoalCardProps) {
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proposed goal</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{goal.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{goal.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tag variant={goal.priority === 'high' ? 'warning' : goal.priority === 'low' ? 'neutral' : 'primary'}>
              {goal.priority}
            </Tag>
            <Tag variant={goal.status === 'completed' ? 'success' : 'primary'}>{goal.status}</Tag>
          </div>
        </div>
        <ProgressBar value={goal.progress} label="Goal progress" tone={goal.progress > 70 ? 'success' : 'primary'} />
      </div>
    </Card>
  )
}
