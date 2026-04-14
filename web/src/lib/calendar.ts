export const weekdayShortLabels = ['一', '二', '三', '四', '五', '六', '日'] as const

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function buildMonthGrid(anchor: Date) {
  const firstDay = startOfMonth(anchor)
  const lastDay = endOfMonth(anchor)
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()
  const cells: Array<Date | null> = []

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), day))
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
}

export function formatDayLabel(date: Date) {
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function formatTimeRange(start: string, end: string) {
  return `${start} - ${end}`
}
