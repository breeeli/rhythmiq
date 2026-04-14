import { useMemo } from 'react'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { Tag } from '@/components/ui/Tag'
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar'
import { useRhythmiqStore } from '@/store/rhythmiqStore'

function getWeekDates(anchor = new Date()) {
  const day = anchor.getDay()
  const sunday = new Date(anchor)
  sunday.setDate(anchor.getDate() - day)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + index)
    return date
  })
}

export default function CalendarPage() {
  const schedules = useRhythmiqStore((state) => state.schedules)
  const itemsByDay = useMemo(
    () =>
      schedules.reduce<Record<string, typeof schedules>>((acc, item) => {
        acc[item.day] = acc[item.day] ?? []
        acc[item.day].push(item)
        return acc
      }, {}),
    [schedules],
  )
  const days = useMemo(
    () =>
      getWeekDates().map((date) => ({
        key: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()],
        label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        date: date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      })),
    [],
  )

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock
        title="Calendar"
        description="周视图只展示结构化时间块：Routine、Habit 和 Task。"
        action={<Tag variant="primary">{schedules.length} items</Tag>}
      />

      <WeeklyCalendar days={days} itemsByDay={itemsByDay} />
    </div>
  )
}
