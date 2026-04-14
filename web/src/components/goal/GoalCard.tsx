import { ChevronRight } from 'lucide-react'
import type { Goal } from '@/types'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'

interface GoalCardProps {
  goal: Goal
  onClick: () => void
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Tag variant={goal.priority === 'high' ? 'warning' : goal.priority === 'low' ? 'neutral' : 'primary'}>
                  {goal.priority}
                </Tag>
                <Tag variant={goal.status === 'completed' ? 'success' : 'primary'}>{goal.status}</Tag>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{goal.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{goal.description}</p>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 text-slate-300" />
          </div>
          <ProgressBar value={goal.progress} label="Progress" tone={goal.progress > 70 ? 'success' : 'primary'} />
        </div>
      </Card>
    </button>
  )
}
