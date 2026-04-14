import clsx from 'clsx'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { Tag } from '@/components/ui/Tag'
import { useUserStore } from '@/store'
import { useTimeBlockStore, type RecurrenceType, type TimeBlock as TimeBlockRule } from '@/store/timeBlockStore'
import {
  addMonths,
  buildMonthGrid,
  endOfMonth,
  formatDayShort,
  formatDayTitle,
  formatMonthTitle,
  fromDateKey,
  getWeekdayKey,
  isSameDay,
  isSameMonth,
  parseTime,
  startOfMonth,
  toDateKey,
  weekdayLabels,
} from '@/lib/calendar'

interface CalendarFormState {
  title: string
  startTime: string
  endTime: string
  recurrenceType: RecurrenceType
  daysOfWeek: string[]
  date: string
}

const recurrenceDot: Record<RecurrenceType, string> = {
  DAILY: 'bg-emerald-500',
  WEEKLY: 'bg-sky-500',
  NONE: 'bg-slate-400',
}

const weekDays = [
  { key: 'mon', label: '周一' },
  { key: 'tue', label: '周二' },
  { key: 'wed', label: '周三' },
  { key: 'thu', label: '周四' },
  { key: 'fri', label: '周五' },
  { key: 'sat', label: '周六' },
  { key: 'sun', label: '周日' },
]

function recurrenceLabel(type: RecurrenceType) {
  if (type === 'DAILY') return '每日'
  if (type === 'WEEKLY') return '每周'
  return '一次性'
}

function recurrenceHint(type: RecurrenceType) {
  if (type === 'DAILY') return '每天重复'
  if (type === 'WEEKLY') return '按星期重复'
  return '只在某天生效'
}

function weekDayLabel(value: string) {
  return weekDays.find((day) => day.key === value)?.label ?? value
}

function formatCompactTimeRange(startTime: string, endTime: string) {
  return `${startTime}~${endTime}`
}

function createDefaultForm(date = new Date()): CalendarFormState {
  const selected = new Date(date)

  return {
    title: '',
    startTime: '08:00',
    endTime: '09:00',
    recurrenceType: 'NONE',
    daysOfWeek: [getWeekdayKey(selected)],
    date: toDateKey(selected),
  }
}

function sortByStart(left: TimeBlockRule, right: TimeBlockRule) {
  return parseTime(left.start_time) - parseTime(right.start_time)
}

function matchesDate(block: TimeBlockRule, date: Date) {
  const weekday = getWeekdayKey(date)

  if (block.recurrence_type === 'DAILY') {
    return true
  }

  if (block.recurrence_type === 'WEEKLY') {
    return (block.days_of_week ?? []).includes(weekday)
  }

  return block.date === toDateKey(date)
}

function getDayBlocks(date: Date, blocks: TimeBlockRule[]) {
  return blocks.filter((block) => matchesDate(block, date)).sort(sortByStart)
}

function recurrenceRowClass(type: RecurrenceType) {
  if (type === 'DAILY') return 'border-emerald-100 bg-emerald-50/70'
  if (type === 'WEEKLY') return 'border-sky-100 bg-sky-50/70'
  return 'border-slate-200 bg-slate-50/80'
}

function ScheduleModal({
  open,
  dateLabel,
  form,
  onClose,
  onSubmit,
  onChange,
  loading,
  error,
}: {
  open: boolean
  dateLabel: string
  form: CalendarFormState
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (updater: (state: CalendarFormState) => CalendarFormState) => void
  loading: boolean
  error: string | null
}) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl">
        <Card className="relative overflow-hidden border-white/60 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Add schedule</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">新增日程</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{dateLabel}</p>
            </div>
            <Button variant="ghost" size="sm" type="button" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">名称</span>
                <input
                  required
                  value={form.title}
                  onChange={(event) => onChange((state) => ({ ...state, title: event.target.value }))}
                  placeholder="例如：午间散步、深度工作、项目复盘"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">重复类型</span>
                <select
                  value={form.recurrenceType}
                  onChange={(event) => {
                    const next = event.target.value as RecurrenceType
                    onChange((state) => ({
                      ...state,
                      recurrenceType: next,
                      daysOfWeek:
                        next === 'WEEKLY'
                          ? state.daysOfWeek.length > 0
                            ? state.daysOfWeek
                            : [getWeekdayKey(fromDateKey(state.date))]
                          : state.daysOfWeek,
                    }))
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="NONE">一次性</option>
                  <option value="DAILY">每日</option>
                  <option value="WEEKLY">每周</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">开始</span>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(event) => onChange((state) => ({ ...state, startTime: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">结束</span>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(event) => onChange((state) => ({ ...state, endTime: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>
            </div>

            {form.recurrenceType === 'WEEKLY' && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">重复星期</p>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const active = form.daysOfWeek.includes(day.key)

                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() =>
                          onChange((state) => ({
                            ...state,
                            daysOfWeek: state.daysOfWeek.includes(day.key)
                              ? state.daysOfWeek.filter((value) => value !== day.key)
                              : [...state.daysOfWeek, day.key],
                          }))
                        }
                        className={clsx(
                          'rounded-2xl border px-4 py-2 text-sm font-medium transition',
                          active
                            ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                        )}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400">至少选择一个星期几。</p>
              </div>
            )}

            {form.recurrenceType === 'DAILY' && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
                这个时间块会每天重复出现，不需要选择日期。
              </div>
            )}

            {form.recurrenceType === 'NONE' && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">日期</span>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => onChange((state) => ({ ...state, date: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className={clsx('h-2.5 w-2.5 rounded-full', recurrenceDot[form.recurrenceType])} />
                  <span>{recurrenceLabel(form.recurrenceType)}</span>
                  <span className="text-slate-300">·</span>
                  <span>{recurrenceHint(form.recurrenceType)}</span>
                </div>
                <div>
                  预览：{formatCompactTimeRange(form.startTime, form.endTime)} {form.title || '未命名安排'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  <Plus className="h-4 w-4" />
                  新增日程
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}
          </form>
        </Card>
      </div>
    </div>,
    document.body,
  )
}

export default function CalendarPage() {
  const currentUser = useUserStore((state) => state.currentUser)
  const userID = currentUser?.id ?? 1
  const timeBlocks = useTimeBlockStore((state) => state.timeBlocks)
  const loading = useTimeBlockStore((state) => state.loading)
  const fetchTimeBlocks = useTimeBlockStore((state) => state.fetchTimeBlocks)
  const createTimeBlock = useTimeBlockStore((state) => state.createTimeBlock)

  const today = useMemo(() => new Date(), [])
  const [anchorMonth, setAnchorMonth] = useState(() => startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState(today)
  const [scheduleForm, setScheduleForm] = useState<CalendarFormState>(() => createDefaultForm(today))
  const [composerOpen, setComposerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    void fetchTimeBlocks(userID)
  }, [fetchTimeBlocks, userID])

  const monthCells = useMemo(() => buildMonthGrid(anchorMonth), [anchorMonth])
  const selectedItems = useMemo(() => getDayBlocks(selectedDate, timeBlocks), [selectedDate, timeBlocks])

  const monthItemsByDate = useMemo(() => {
    const days = new Map<string, TimeBlockRule[]>()

    monthCells.forEach((cell) => {
      if (!cell) return
      days.set(toDateKey(cell), getDayBlocks(cell, timeBlocks))
    })

    return days
  }, [monthCells, timeBlocks])

  const openComposer = (date = selectedDate) => {
    const nextDate = new Date(date)
    setSelectedDate(nextDate)
    setAnchorMonth(startOfMonth(nextDate))
    setScheduleForm(createDefaultForm(nextDate))
    setSubmitError(null)
    setComposerOpen(true)
  }

  const closeComposer = () => {
    if (isSubmitting) return
    setComposerOpen(false)
    setSubmitError(null)
  }

  const handleNavigateMonth = (offset: number) => {
    const nextMonth = addMonths(anchorMonth, offset)
    setAnchorMonth(nextMonth)
    setSelectedDate((current) => {
      const day = Math.min(current.getDate(), endOfMonth(nextMonth).getDate())
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day)
    })
  }

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    setAnchorMonth(startOfMonth(date))
  }

  const handleAddSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    if (scheduleForm.recurrenceType === 'WEEKLY' && scheduleForm.daysOfWeek.length === 0) {
      setSubmitError('每周时间块至少选择一天。')
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createTimeBlock(userID, {
        title: scheduleForm.title.trim(),
        start_time: scheduleForm.startTime,
        end_time: scheduleForm.endTime,
        recurrence_type: scheduleForm.recurrenceType,
        ...(scheduleForm.recurrenceType === 'WEEKLY' ? { days_of_week: scheduleForm.daysOfWeek } : {}),
        ...(scheduleForm.recurrenceType === 'NONE' ? { date: scheduleForm.date } : {}),
      })

      if (created.recurrence_type === 'NONE' && created.date) {
        const nextDate = fromDateKey(created.date)
        setSelectedDate(nextDate)
        setAnchorMonth(startOfMonth(nextDate))
        setScheduleForm(createDefaultForm(nextDate))
      } else {
        setScheduleForm(createDefaultForm(selectedDate))
      }

      setComposerOpen(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '新增失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const jumpToToday = () => {
    const nextToday = new Date()
    setAnchorMonth(startOfMonth(nextToday))
    setSelectedDate(nextToday)
  }

  const selectedDateLabel = formatDayTitle(selectedDate)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock
        title="Calendar"
        description="月历格子用单行日程展示，右侧查看当天清单，并通过弹窗新增安排。"
        action={
          <div className="flex items-center gap-2">
            <Tag variant="primary">{timeBlocks.length} items</Tag>
            <Button size="sm" onClick={() => openComposer()}>
              <Plus className="h-4 w-4" />
              新增日程
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <Card padding={false} className="overflow-hidden">
          <div className="border-b border-slate-200/80 bg-white/80 p-5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Month view</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">{formatMonthTitle(anchorMonth)}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  点击某一天查看当天安排，点格子右上角的加号会直接打开新增弹窗。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={jumpToToday}>
                  Today
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleNavigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleNavigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                {label}
              </div>
            ))}
          </div>

          <div className="grid auto-rows-[11.5rem] grid-cols-7">
            {monthCells.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="border-r border-b border-slate-200/80 bg-white/40" />
              }

              const key = toDateKey(cell)
              const dayItems = monthItemsByDate.get(key) ?? []
              const isSelected = isSameDay(cell, selectedDate)
              const isCurrentMonth = isSameMonth(cell, anchorMonth)
              const isTodayCell = isSameDay(cell, today)

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectDate(cell)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleSelectDate(cell)
                    }
                  }}
                  className={clsx(
                    'group relative border-r border-b border-slate-200/80 p-3 text-left transition',
                    'cursor-pointer select-none hover:bg-slate-50/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400',
                    isSelected && 'bg-sky-50/90',
                    !isSelected && 'bg-white',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'text-xl font-medium',
                          isCurrentMonth ? 'text-slate-900' : 'text-slate-400',
                        )}
                      >
                        {cell.getDate()}
                      </span>
                      {isTodayCell && <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-label="Today" />}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        openComposer(cell)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-300 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-sky-200 hover:text-sky-500"
                      aria-label={`新增 ${formatDayShort(cell)} 的日程`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5 overflow-hidden">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={`${key}-${item.id}`}
                        className={clsx(
                          'flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-xs shadow-sm transition',
                          recurrenceRowClass(item.recurrence_type),
                        )}
                      >
                        <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', recurrenceDot[item.recurrence_type])} />
                        <p className="truncate font-medium text-slate-800">
                          {formatCompactTimeRange(item.start_time, item.end_time)} {item.title}
                        </p>
                      </div>
                    ))}

                    {dayItems.length > 3 && <p className="px-1 text-xs font-medium text-slate-400">+{dayItems.length - 3} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Day agenda</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedDateLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                当天安排按时间顺序展示，颜色区分重复类型，文字统一为“时间段 名称”。
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button variant="secondary" size="sm" onClick={jumpToToday}>
                <CalendarDays className="h-4 w-4" />
                Today
              </Button>
              <Tag variant="primary">{selectedItems.length} items</Tag>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80">
            <div className="border-b border-slate-200 px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Selected day
            </div>

            {loading && selectedItems.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
                <div>
                  <Clock3 className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-sm font-medium text-slate-700">正在加载时间块</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">正在从后端同步日历数据。</p>
                </div>
              </div>
            ) : selectedItems.length ? (
              <div className="space-y-2 p-4">
                {selectedItems.map((item) => (
                  <div key={item.id} className={clsx('rounded-2xl border px-4 py-3 shadow-sm', recurrenceRowClass(item.recurrence_type))}>
                    <div className="flex items-center gap-3">
                      <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', recurrenceDot[item.recurrence_type])} />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                        {formatCompactTimeRange(item.start_time, item.end_time)} {item.title}
                      </p>
                    </div>
                    <div className="mt-2 pl-[1.375rem] text-xs leading-5 text-slate-500">
                      {item.recurrence_type === 'WEEKLY' && (
                        <span>{(item.days_of_week ?? []).map(weekDayLabel).join('，') || '未设置星期'}</span>
                      )}
                      {item.recurrence_type === 'NONE' && item.date && <span>{item.date}</span>}
                      {item.recurrence_type === 'DAILY' && <span>每天重复</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
                <div>
                  <Clock3 className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-sm font-medium text-slate-700">这一天还没有安排</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">可以点击左侧某一天，或者用右上角新增日程。</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ScheduleModal
        open={composerOpen}
        dateLabel={selectedDateLabel}
        form={scheduleForm}
        onClose={closeComposer}
        onSubmit={handleAddSchedule}
        onChange={(updater) => setScheduleForm((state) => updater(state))}
        loading={isSubmitting}
        error={submitError}
      />
    </div>
  )
}
