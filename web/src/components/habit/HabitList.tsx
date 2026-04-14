import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'
import type { Habit } from '@/store/rhythmiqStore'

interface HabitListProps {
  habits: Habit[]
  onToggle: (id: number) => void
}

export function HabitList({ habits, onToggle }: HabitListProps) {
  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <Card key={habit.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{habit.name}</h3>
                <Tag variant={habit.category === 'habit' ? 'success' : 'neutral'}>{habit.category}</Tag>
              </div>
              <p className="text-sm text-slate-500">连胜 {habit.streak} 天</p>
              <ProgressBar value={habit.completion ? 100 : 0} tone={habit.completion ? 'success' : 'neutral'} label="Today" />
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={habit.completion > 0} onChange={() => onToggle(habit.id)} />
              完成
            </label>
          </div>
        </Card>
      ))}
    </div>
  )
}
