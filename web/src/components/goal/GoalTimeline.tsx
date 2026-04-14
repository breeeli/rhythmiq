import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import type { ScheduleItem } from '@/store/rhythmiqStore'

interface GoalTimelineProps {
  items: ScheduleItem[]
}

export function GoalTimeline({ items }: GoalTimelineProps) {
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Schedule timeline</h3>
          <Tag variant="neutral">{items.length} items</Tag>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <Tag variant={item.kind === 'habit' ? 'success' : item.kind === 'task' ? 'warning' : 'neutral'}>
                    {item.kind}
                  </Tag>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {item.day} · {item.start}-{item.end}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
