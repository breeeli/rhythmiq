import { useEffect, useMemo, useState, useCallback } from 'react'
import clsx from 'clsx'
import { CalendarRange, ChevronRight, Clock3, Plus, Repeat, Sun, Calendar, Timer } from 'lucide-react'
import { useUserStore } from '@/store'
import { useTimeBlockStore, type RecurrenceType, type TimeBlock } from '@/store/timeBlockStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type TypeFilter = RecurrenceType | 'ALL'
type DateFilter = 'ALL' | 'TODAY' | 'NEXT_7_DAYS'
type ViewMode = 'LIST' | 'TIMELINE'

const weekDays = [
  { key: 'mon', label: '周一' },
  { key: 'tue', label: '周二' },
  { key: 'wed', label: '周三' },
  { key: 'thu', label: '周四' },
  { key: 'fri', label: '周五' },
  { key: 'sat', label: '周六' },
  { key: 'sun', label: '周日' },
]

function weekDayLabel(value: string) {
  return weekDays.find((day) => day.key === value)?.label ?? value
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function calcTotalMinutes(blocks: TimeBlock[]): number {
  return blocks.reduce((sum, b) => {
    const diff = timeToMinutes(b.end_time) - timeToMinutes(b.start_time)
    return sum + Math.max(0, diff)
  }, 0)
}

function formatMinutesAsHM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

function blockDescription(block: TimeBlock): string {
  if (block.recurrence_type === 'DAILY') return '工作日前准备与通勤时间'
  if (block.recurrence_type === 'WEEKLY') {
    const days = block.days_of_week?.map(weekDayLabel).join('、') ?? ''
    return `每${days}重复`
  }
  if (block.date) {
    const [y, mo, d] = block.date.split('-')
    return `${y}年${mo}月${d}日`
  }
  return ''
}

function isTodayEffective(block: TimeBlock): boolean {
  const now = new Date()
  if (block.recurrence_type === 'DAILY') return true
  if (block.recurrence_type === 'WEEKLY') {
    const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
    return block.days_of_week?.some((d) => dayMap[d] === now.getDay()) ?? false
  }
  if (block.recurrence_type === 'NONE' && block.date) {
    return block.date === now.toISOString().slice(0, 10)
  }
  return false
}

function isNext7DaysEffective(block: TimeBlock): boolean {
  if (block.recurrence_type === 'DAILY' || block.recurrence_type === 'WEEKLY') return true
  if (block.recurrence_type === 'NONE' && block.date) {
    const now = new Date()
    const target = new Date(block.date)
    const diff = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }
  return false
}

const TIMELINE_COLORS = [
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-teal-400', text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-teal-600', text: 'text-white' },
]

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-200 text-teal-600">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function TimelinePreview({ blocks }: { blocks: TimeBlock[] }) {
  const todayBlocks = blocks
    .filter(isTodayEffective)
    .toSorted((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

  const hours = Array.from({ length: 7 }, (_, i) => i * 4)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">今日时间预览</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex justify-between text-xs text-slate-400">
            {hours.map((h) => (
              <span key={h}>{String(h).padStart(2, '0')}:00</span>
            ))}
            <span>24:00</span>
          </div>
          <div className="relative mt-1 h-8 rounded bg-slate-100">
            {todayBlocks.map((block, i) => {
              const start = timeToMinutes(block.start_time)
              const end = timeToMinutes(block.end_time)
              const left = (start / 1440) * 100
              const width = ((end - start) / 1440) * 100
              const color = TIMELINE_COLORS[i % TIMELINE_COLORS.length]
              return (
                <div
                  key={block.id}
                  className={clsx('absolute top-0 h-full rounded', color.bg)}
                  style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
                  title={`${block.title}: ${block.start_time} - ${block.end_time}`}
                />
              )
            })}
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">今天</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {todayBlocks.map((block, i) => {
              const color = TIMELINE_COLORS[i % TIMELINE_COLORS.length]
              return (
                <div key={block.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={clsx('inline-block h-2.5 w-2.5 rounded-sm', color.bg)} />
                  {block.start_time} - {block.end_time}
                  <span className="ml-1 text-slate-400">{block.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TimeBlocksPage() {
  const currentUser = useUserStore((state) => state.currentUser)
  const userID = currentUser?.id ?? 1
  const timeBlocks = useTimeBlockStore((state) => state.timeBlocks)
  const loading = useTimeBlockStore((state) => state.loading)
  const fetchTimeBlocks = useTimeBlockStore((state) => state.fetchTimeBlocks)
  const createTimeBlock = useTimeBlockStore((state) => state.createTimeBlock)
  const deleteTimeBlock = useTimeBlockStore((state) => state.deleteTimeBlock)

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('DAILY')
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('LIST')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('DAILY')
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['mon'])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    void fetchTimeBlocks(userID)
  }, [fetchTimeBlocks, userID])

  const counts = useMemo(() => {
    const daily = timeBlocks.filter((b) => b.recurrence_type === 'DAILY')
    const weekly = timeBlocks.filter((b) => b.recurrence_type === 'WEEKLY')
    const once = timeBlocks.filter((b) => b.recurrence_type === 'NONE')
    return { DAILY: daily.length, WEEKLY: weekly.length, NONE: once.length }
  }, [timeBlocks])

  const todayTotalMinutes = useMemo(
    () => calcTotalMinutes(timeBlocks.filter(isTodayEffective)),
    [timeBlocks],
  )

  const filteredBlocks = useMemo(() => {
    let result = timeBlocks
    if (typeFilter !== 'ALL') {
      result = result.filter((b) => b.recurrence_type === typeFilter)
    }
    if (dateFilter === 'TODAY') {
      result = result.filter(isTodayEffective)
    } else if (dateFilter === 'NEXT_7_DAYS') {
      result = result.filter(isNext7DaysEffective)
    }
    return result
  }, [timeBlocks, typeFilter, dateFilter])

  const weeklyPreview = useMemo(() => {
    const wb = timeBlocks.filter((b) => b.recurrence_type === 'WEEKLY')
    if (wb.length === 0) return null
    const first = wb[0]
    const day = first.days_of_week?.[0] ? weekDayLabel(first.days_of_week[0]) : ''
    return `${day} ${first.start_time}-${first.end_time} ${first.title}`
  }, [timeBlocks])

  const oncePreview = useMemo(() => {
    const ob = timeBlocks.filter((b) => b.recurrence_type === 'NONE')
    if (ob.length === 0) return null
    const first = ob[0]
    const dateLabel = first.date ? `本周六` : ''
    return `${dateLabel} ${first.start_time}-${first.end_time} ${first.title}`
  }, [timeBlocks])

  const openCreateModal = useCallback(() => {
    setEditingBlock(null)
    setTitle('')
    setDescription('')
    setStartTime('08:00')
    setEndTime('09:00')
    setRecurrenceType(typeFilter === 'ALL' ? 'DAILY' : (typeFilter as RecurrenceType))
    setDaysOfWeek(['mon'])
    setDate(new Date().toISOString().slice(0, 10))
    setIsModalOpen(true)
  }, [typeFilter])

  const openEditModal = useCallback((block: TimeBlock) => {
    setEditingBlock(block)
    setTitle(block.title)
    setDescription('')
    setStartTime(block.start_time)
    setEndTime(block.end_time)
    setRecurrenceType(block.recurrence_type)
    setDaysOfWeek(block.days_of_week ?? ['mon'])
    setDate(block.date ?? new Date().toISOString().slice(0, 10))
    setIsModalOpen(true)
  }, [])

  const updateTimeBlock = useTimeBlockStore((state) => state.updateTimeBlock)

  const submit = async () => {
    if (!title.trim()) return
    const payload = {
      title: title.trim(),
      start_time: startTime,
      end_time: endTime,
      recurrence_type: recurrenceType,
      ...(recurrenceType === 'WEEKLY' ? { days_of_week: daysOfWeek } : {}),
      ...(recurrenceType === 'NONE' ? { date } : {}),
    }
    if (editingBlock) {
      await updateTimeBlock(editingBlock.id, payload)
    } else {
      await createTimeBlock(userID, payload)
    }
    setIsModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    await deleteTimeBlock(id)
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">时间块</h1>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          新建时间块
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Repeat className="h-5 w-5" />}
          label="每日"
          value={counts.DAILY}
        />
        <StatCard
          icon={<CalendarRange className="h-5 w-5" />}
          label="每周"
          value={counts.WEEKLY}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="一次性"
          value={counts.NONE}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="今日总计"
          value={formatMinutesAsHM(todayTotalMinutes)}
        />
      </div>

      {/* Main content: sidebar + content */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left sidebar */}
        <div className="space-y-6">
          {/* Type filter */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">时间块类型</h3>
            <div className="space-y-1">
              {([
                { key: 'DAILY' as TypeFilter, label: '每日', icon: <Sun className="h-4 w-4" />, count: counts.DAILY },
                { key: 'WEEKLY' as TypeFilter, label: '每周', icon: <CalendarRange className="h-4 w-4" />, count: counts.WEEKLY },
                { key: 'NONE' as TypeFilter, label: '一次性', icon: <Timer className="h-4 w-4" />, count: counts.NONE },
              ]).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTypeFilter(item.key)}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition',
                    typeFilter === item.key
                      ? 'bg-teal-50 font-medium text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  <span
                    className={clsx(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
                      typeFilter === item.key ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date filter */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">筛选</h3>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'ALL' as DateFilter, label: '全部' },
                { key: 'TODAY' as DateFilter, label: '今天生效' },
                { key: 'NEXT_7_DAYS' as DateFilter, label: '未来 7 天' },
              ]).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setDateFilter(item.key)}
                  className={clsx(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                    dateFilter === item.key
                      ? 'border-teal-200 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other type previews */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">其他类型预览</h3>
            <div className="space-y-1">
              <button
                onClick={() => setTypeFilter('WEEKLY')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <CalendarRange className="h-4 w-4 text-slate-400" />
                    每周预览
                  </div>
                  {weeklyPreview && (
                    <p className="mt-0.5 pl-6 text-xs text-slate-400">{weeklyPreview}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
              <button
                onClick={() => setTypeFilter('NONE')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <Timer className="h-4 w-4 text-slate-400" />
                    一次性预览
                  </div>
                  {oncePreview && (
                    <p className="mt-0.5 pl-6 text-xs text-slate-400">{oncePreview}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">点击类型查看对应的时间块</p>
          </div>
        </div>

        {/* Right content */}
        <div className="space-y-4">
          {/* View tabs */}
          <div className="flex gap-4 border-b border-slate-200">
            <button
              onClick={() => setViewMode('LIST')}
              className={clsx(
                'border-b-2 px-1 pb-2 text-sm font-medium transition',
                viewMode === 'LIST'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              列表视图
            </button>
            <button
              onClick={() => setViewMode('TIMELINE')}
              className={clsx(
                'border-b-2 px-1 pb-2 text-sm font-medium transition',
                viewMode === 'TIMELINE'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              时间轴视图
            </button>
          </div>

          {/* List view */}
          {viewMode === 'LIST' && (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">标题</th>
                      <th className="px-5 py-3">时间范围</th>
                      <th className="px-5 py-3">说明</th>
                      <th className="px-5 py-3">状态</th>
                      <th className="px-5 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                          正在加载时间块...
                        </td>
                      </tr>
                    ) : filteredBlocks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                          当前分类下还没有时间块。
                        </td>
                      </tr>
                    ) : (
                      filteredBlocks.map((block) => (
                        <tr key={block.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-5 py-4 font-medium text-slate-900">{block.title}</td>
                          <td className="px-5 py-4 text-slate-600">
                            {block.start_time} - {block.end_time}
                          </td>
                          <td className="px-5 py-4 text-slate-500">{blockDescription(block)}</td>
                          <td className="px-5 py-4">
                            <span
                              className={clsx(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                isTodayEffective(block)
                                  ? 'bg-teal-50 text-teal-700'
                                  : 'bg-slate-100 text-slate-500',
                              )}
                            >
                              {isTodayEffective(block) ? '生效中' : '未生效'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEditModal(block)}
                                className="text-xs font-medium text-teal-600 hover:text-teal-800"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(block.id)}
                                className="text-xs font-medium text-rose-500 hover:text-rose-700"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Timeline view */}
          {viewMode === 'TIMELINE' && (
            <Card>
              <TimelinePreview blocks={timeBlocks} />
            </Card>
          )}

          {/* Today timeline preview (always shown in list view) */}
          {viewMode === 'LIST' && (
            <Card>
              <TimelinePreview blocks={timeBlocks} />
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-2xl border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingBlock ? '编辑时间块' : '新增时间块'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingBlock ? '修改时间块的信息。' : '创建一个不可被安排的时间约束。'}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  关闭
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">标题</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                    placeholder="例如：朋友来访"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">重复类型</span>
                  <select
                    value={recurrenceType}
                    onChange={(e) => {
                      const next = e.target.value as RecurrenceType
                      setRecurrenceType(next)
                      if (next === 'WEEKLY') setDaysOfWeek((c) => (c.length > 0 ? c : ['mon']))
                      if (next === 'NONE') setDate(new Date().toISOString().slice(0, 10))
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                  >
                    <option value="NONE">一次性</option>
                    <option value="DAILY">每日</option>
                    <option value="WEEKLY">每周</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">开始时间</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">结束时间</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  />
                </label>
              </div>

              {recurrenceType === 'WEEKLY' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">选择星期</p>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => {
                      const selected = daysOfWeek.includes(day.key)
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() =>
                            setDaysOfWeek((current) =>
                              current.includes(day.key)
                                ? current.filter((item) => item !== day.key)
                                : [...current, day.key],
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-2 text-sm transition',
                            selected
                              ? 'border-teal-200 bg-teal-50 text-teal-700'
                              : 'border-slate-200 bg-white text-slate-600',
                          )}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {recurrenceType === 'NONE' && (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">日期</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  />
                </label>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  取消
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={submit}>
                  {editingBlock ? '保存修改' : '新增时间块'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
