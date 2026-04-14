import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import type { ScheduleItem } from '@/store/rhythmiqStore'

interface SchedulePreviewProps {
  items: ScheduleItem[]
}

const toneMap: Record<ScheduleItem['kind'], 'primary' | 'success' | 'warning' | 'neutral'> = {
  routine: 'neutral',
  habit: 'success',
  task: 'warning',
}

export function SchedulePreview({ items }: SchedulePreviewProps) {
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Schedule preview</h3>
          <Tag variant="neutral">{items.length} blocks</Tag>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="rounded-xl bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                {item.start} - {item.end}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                  <Tag variant={toneMap[item.kind]}>{item.kind}</Tag>
                </div>
                <p className="text-xs text-slate-500">{item.day}{item.note ? ` · ${item.note}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
