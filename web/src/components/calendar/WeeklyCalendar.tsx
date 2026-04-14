import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import type { ScheduleItem } from '@/store/rhythmiqStore'

interface WeeklyCalendarProps {
  days: { key: string; label: string; date: string }[]
  itemsByDay: Record<string, ScheduleItem[]>
}

const toneMap: Record<ScheduleItem['kind'], 'neutral' | 'success' | 'warning'> = {
  routine: 'neutral',
  habit: 'success',
  task: 'warning',
}

export function WeeklyCalendar({ days, itemsByDay }: WeeklyCalendarProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-7">
      {days.map((day) => (
        <Card key={day.key}>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{day.label}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{day.date}</h3>
            </div>
            <div className="space-y-2">
              {(itemsByDay[day.key] ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <Tag variant={toneMap[item.kind]}>{item.kind}</Tag>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.start} - {item.end}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
