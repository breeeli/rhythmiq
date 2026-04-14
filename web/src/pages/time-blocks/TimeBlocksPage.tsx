import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { CalendarRange, Clock3, Plus, Repeat } from 'lucide-react'
import { useUserStore } from '@/store'
import { useTimeBlockStore, type RecurrenceType, type TimeBlock } from '@/store/timeBlockStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { Tag } from '@/components/ui/Tag'

type TabKey = 'DAILY' | 'WEEKLY' | 'NONE'

const tabs: Array<{ key: TabKey; label: string; hint: string }> = [
  { key: 'DAILY', label: '每日', hint: '每天都会占用的时间块' },
  { key: 'WEEKLY', label: '每周', hint: '按星期重复出现的时间块' },
  { key: 'NONE', label: '一次性', hint: '只在某一天生效的时间块' },
]

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

function recurrenceIcon(type: RecurrenceType) {
  if (type === 'DAILY') return <Repeat className="h-4 w-4" />
  if (type === 'WEEKLY') return <CalendarRange className="h-4 w-4" />
  return <Clock3 className="h-4 w-4" />
}

function weekDayLabel(value: string) {
  return weekDays.find((day) => day.key === value)?.label ?? value
}

function formatDate(value?: string) {
  if (!value) return '未设置日期'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${year}年${month}月${day}日`
}

function TimeBlockCard({
  block,
  onDelete,
}: {
  block: TimeBlock
  onDelete: (id: number) => void
}) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tag variant={block.recurrence_type === 'DAILY' ? 'success' : block.recurrence_type === 'WEEKLY' ? 'primary' : 'neutral'}>
            {recurrenceLabel(block.recurrence_type)}
          </Tag>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {block.start_time} - {block.end_time}
          </span>
        </div>
        <h3 className="text-base font-semibold text-slate-900">{block.title}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-slate-500">
          {block.recurrence_type === 'WEEKLY' && (
            <span>{block.days_of_week?.map(weekDayLabel).join('，') || '未设置星期'}</span>
          )}
          {block.recurrence_type === 'NONE' && <span>{formatDate(block.date)}</span>}
          {block.recurrence_type === 'DAILY' && <span>每天重复</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          {recurrenceIcon(block.recurrence_type)}
        </div>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          className="text-xs font-medium text-slate-400 transition hover:text-rose-600"
        >
          删除
        </button>
      </div>
    </Card>
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

  const [activeTab, setActiveTab] = useState<TabKey>('DAILY')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('DAILY')
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['mon'])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    void fetchTimeBlocks(userID)
  }, [fetchTimeBlocks, userID])

  const filteredBlocks = useMemo(
    () => timeBlocks.filter((block) => block.recurrence_type === activeTab),
    [activeTab, timeBlocks],
  )

  const counts = useMemo(
    () => ({
      DAILY: timeBlocks.filter((block) => block.recurrence_type === 'DAILY').length,
      WEEKLY: timeBlocks.filter((block) => block.recurrence_type === 'WEEKLY').length,
      NONE: timeBlocks.filter((block) => block.recurrence_type === 'NONE').length,
    }),
    [timeBlocks],
  )

  const openModal = () => {
    setTitle('')
    setStartTime('08:00')
    setEndTime('09:00')
    setRecurrenceType(activeTab)
    setDaysOfWeek(['mon'])
    setDate(new Date().toISOString().slice(0, 10))
    setIsModalOpen(true)
  }

  const submit = async () => {
    if (!title.trim()) return

    await createTimeBlock(userID, {
      title: title.trim(),
      start_time: startTime,
      end_time: endTime,
      recurrence_type: recurrenceType,
      ...(recurrenceType === 'WEEKLY' ? { days_of_week: daysOfWeek } : {}),
      ...(recurrenceType === 'NONE' ? { date } : {}),
    })
    setIsModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    await deleteTimeBlock(id)
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock
        title="时间块"
        description="这里管理的是不可被安排的时间约束，不是任务。可按每日、每周和一次性三类查看。"
        action={
          <Button onClick={openModal}>
            <Plus className="h-4 w-4" />
            新增
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'rounded-2xl border px-4 py-3 text-left transition',
                activeTab === tab.key
                  ? 'border-sky-200 bg-sky-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{tab.label}</span>
                <Tag variant={activeTab === tab.key ? 'primary' : 'neutral'}>{counts[tab.key]}</Tag>
              </div>
              <p className="mt-1 text-xs text-slate-500">{tab.hint}</p>
            </button>
          ))}
        </div>
      </SectionBlock>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <p className="text-sm text-slate-500">正在加载时间块...</p>
          </Card>
        ) : filteredBlocks.length > 0 ? (
          filteredBlocks.map((block) => <TimeBlockCard key={block.id} block={block} onDelete={handleDelete} />)
        ) : (
          <Card>
            <p className="text-sm text-slate-500">当前分类下还没有时间块。</p>
          </Card>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-2xl border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">新增时间块</h2>
                  <p className="mt-1 text-sm text-slate-500">创建一个不可被安排的时间约束。</p>
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
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
                      if (next === 'WEEKLY') setDaysOfWeek((current) => (current.length ? current : ['mon']))
                      if (next === 'NONE') setDate(new Date().toISOString().slice(0, 10))
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">结束时间</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
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
                              current.includes(day.key) ? current.filter((item) => item !== day.key) : [...current, day.key],
                            )
                          }
                          className={clsx(
                            'rounded-full border px-3 py-2 text-sm transition',
                            selected ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600',
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                  />
                </label>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  取消
                </Button>
                <Button onClick={submit}>新增时间块</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
