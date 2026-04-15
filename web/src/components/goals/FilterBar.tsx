import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export type GoalSortKey = 'priority' | 'deadline' | 'progress'

interface FilterBarProps {
  sortBy: GoalSortKey
  showHighPriorityOnly: boolean
  showNearDeadlineOnly: boolean
  onSortChange: (sortBy: GoalSortKey) => void
  onToggleHighPriority: () => void
  onToggleNearDeadline: () => void
  nearDeadlineCount: number
}

export function FilterBar({
  sortBy,
  showHighPriorityOnly,
  showNearDeadlineOnly,
  onSortChange,
  onToggleHighPriority,
  onToggleNearDeadline,
  nearDeadlineCount,
}: FilterBarProps) {
  const sortOptions: Array<{ value: GoalSortKey; label: string }> = [
    { value: 'priority', label: '优先级' },
    { value: 'deadline', label: '截止日期' },
    { value: 'progress', label: '进度' },
  ]

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">排序</span>
        {sortOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={sortBy === option.value ? 'primary' : 'secondary'}
            onClick={() => onSortChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">筛选</span>
        <Button
          type="button"
          size="sm"
          variant={showHighPriorityOnly ? 'primary' : 'secondary'}
          onClick={onToggleHighPriority}
        >
          只看高优先级
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showNearDeadlineOnly ? 'primary' : 'secondary'}
          onClick={onToggleNearDeadline}
        >
          只看临近截止
        </Button>
        <Badge variant="default">{nearDeadlineCount} 条在 7 天内</Badge>
      </div>
    </section>
  )
}
