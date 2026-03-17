import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle, Clock3, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePlanStore, useUserStore } from '@/store'
import type {
  AnchoredPlanningItem,
  FocusPlanningItem,
  HabitTimePreference,
  TimeBlockType,
} from '@/types'
import clsx from 'clsx'

const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const blockColors: Record<TimeBlockType, string> = {
  work: 'border-l-indigo-500 bg-indigo-50',
  break: 'border-l-emerald-500 bg-emerald-50',
  personal: 'border-l-amber-500 bg-amber-50',
  buffer: 'border-l-slate-400 bg-slate-100',
}

const blockBadge: Record<TimeBlockType, 'info' | 'success' | 'warning' | 'default'> = {
  work: 'info',
  break: 'success',
  personal: 'warning',
  buffer: 'default',
}

function defaultTargetDate() {
  const now = new Date()
  now.setDate(now.getDate() + 1)
  return now.toISOString().slice(0, 10)
}

function DayPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (days: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {weekdays.map((day) => {
        const active = value.includes(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() =>
              onChange(active ? value.filter((item) => item !== day) : [...value, day])
            }
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors',
              active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}

export default function PlanPage() {
  const { currentUser } = useUserStore()
  const {
    targetPlan,
    constraints,
    loading,
    error,
    clearError,
    fetchPlan,
    fetchConstraints,
    generatePlan,
    confirmPlan,
    createScheduleRule,
    createHabitRule,
    deleteScheduleRule,
    deleteHabitRule,
  } = usePlanStore()

  const [targetDate, setTargetDate] = useState(defaultTargetDate)
  const [contextText, setContextText] = useState('')
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    kind: 'blocked' as 'fixed' | 'blocked',
    start_time: '09:00',
    end_time: '10:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'] as string[],
    locked: true,
  })
  const [habitForm, setHabitForm] = useState({
    title: '',
    duration_minutes: 20,
    days: ['mon', 'tue', 'wed', 'thu', 'fri'] as string[],
    preferred_time: 'evening' as HabitTimePreference,
    preferred_start: '',
    required: true,
  })
  const [anchoredItem, setAnchoredItem] = useState<AnchoredPlanningItem>({
    title: '',
    start_time: '15:00',
    end_time: '16:00',
    note: '',
  })
  const [focusItem, setFocusItem] = useState<FocusPlanningItem>({
    title: '',
    description: '',
    estimated_minutes: 60,
    tag: 'work',
    priority: 'high',
    prefer_window: 'afternoon',
  })
  const [anchoredItems, setAnchoredItems] = useState<AnchoredPlanningItem[]>([])
  const [focusItems, setFocusItems] = useState<FocusPlanningItem[]>([])

  useEffect(() => {
    if (!currentUser) return
    fetchConstraints(currentUser.id)
    fetchPlan(currentUser.id, targetDate)
  }, [currentUser, fetchConstraints, fetchPlan, targetDate])

  const handleCreateScheduleRule = async () => {
    if (!currentUser) return
    await createScheduleRule(currentUser.id, scheduleForm)
    setScheduleForm((state) => ({ ...state, title: '' }))
  }

  const handleCreateHabitRule = async () => {
    if (!currentUser) return
    await createHabitRule(currentUser.id, habitForm)
    setHabitForm((state) => ({ ...state, title: '', preferred_start: '' }))
  }

  const handleAddAnchoredItem = () => {
    if (!anchoredItem.title.trim()) return
    setAnchoredItems((items) => [...items, anchoredItem])
    setAnchoredItem({ title: '', start_time: '15:00', end_time: '16:00', note: '' })
  }

  const handleAddFocusItem = () => {
    if (!focusItem.title.trim()) return
    setFocusItems((items) => [...items, focusItem])
    setFocusItem({
      title: '',
      description: '',
      estimated_minutes: 60,
      tag: 'work',
      priority: 'high',
      prefer_window: 'afternoon',
    })
  }

  const handleGenerate = async () => {
    if (!currentUser) return
    clearError()
    await generatePlan(currentUser.id, {
      date: targetDate,
      context_text: contextText,
      anchored_items: anchoredItems,
      focus_items: focusItems,
    })
  }

  return (
    <div className="space-y-6 p-8">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#334155_100%)] text-white shadow-lg">
            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-300">Next-Day Planner</p>
                  <h1 className="text-3xl font-semibold">Build tomorrow before today ends.</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Save your fixed schedule, reserve recurring habits, then give the planner the context it needs to produce a usable next-day schedule.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <CalendarDays className="h-7 w-7 text-cyan-300" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                <label className="text-sm text-slate-300">
                  Target date
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Recent context
                  <textarea
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400"
                    placeholder="What matters tomorrow? Include progress, constraints, and expected outputs."
                  />
                </label>
                <div className="flex items-end">
                  <Button className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" loading={loading} onClick={handleGenerate}>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Fixed Schedule</h2>
                  <p className="text-sm text-slate-500">Protected blocks that the planner cannot overwrite.</p>
                </div>
                <Badge variant="info">{constraints.schedule_rules.length} saved</Badge>
              </div>

              <div className="space-y-3">
                <input
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm((state) => ({ ...state, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Commute / lunch / fixed meeting"
                />
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={scheduleForm.kind}
                    onChange={(e) =>
                      setScheduleForm((state) => ({ ...state, kind: e.target.value as 'fixed' | 'blocked' }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="blocked">Blocked</option>
                    <option value="fixed">Fixed</option>
                  </select>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm((state) => ({ ...state, start_time: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm((state) => ({ ...state, end_time: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <DayPicker
                  value={scheduleForm.days}
                  onChange={(days) => setScheduleForm((state) => ({ ...state, days }))}
                />
                <Button className="w-full" onClick={handleCreateScheduleRule}>
                  <Plus className="h-4 w-4" />
                  Save Schedule Rule
                </Button>
              </div>

              <div className="mt-5 space-y-2">
                {constraints.schedule_rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{rule.title}</p>
                      <p className="text-xs text-slate-500">
                        {rule.start_time} - {rule.end_time} · {rule.days.join(', ')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => currentUser && deleteScheduleRule(rule.id, currentUser.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Repeating Habits</h2>
                  <p className="text-sm text-slate-500">Reserve the routines you want tomorrow to respect.</p>
                </div>
                <Badge variant="warning">{constraints.habit_rules.length} saved</Badge>
              </div>

              <div className="space-y-3">
                <input
                  value={habitForm.title}
                  onChange={(e) => setHabitForm((state) => ({ ...state, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Dumbbell workout / reading"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    min={5}
                    value={habitForm.duration_minutes}
                    onChange={(e) =>
                      setHabitForm((state) => ({ ...state, duration_minutes: Number(e.target.value) }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={habitForm.preferred_time}
                    onChange={(e) =>
                      setHabitForm((state) => ({
                        ...state,
                        preferred_time: e.target.value as HabitTimePreference,
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="any">Any</option>
                  </select>
                  <input
                    type="time"
                    value={habitForm.preferred_start}
                    onChange={(e) => setHabitForm((state) => ({ ...state, preferred_start: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <DayPicker
                  value={habitForm.days}
                  onChange={(days) => setHabitForm((state) => ({ ...state, days }))}
                />
                <Button className="w-full" variant="secondary" onClick={handleCreateHabitRule}>
                  <Clock3 className="h-4 w-4" />
                  Save Habit Rule
                </Button>
              </div>

              <div className="mt-5 space-y-2">
                {constraints.habit_rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{rule.title}</p>
                      <p className="text-xs text-slate-500">
                        {rule.duration_minutes} min · {rule.preferred_start || rule.preferred_time} · {rule.days.join(', ')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => currentUser && deleteHabitRule(rule.id, currentUser.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Anchored Items</h2>
                <p className="text-sm text-slate-500">One-off fixed-time items for tomorrow.</p>
              </div>
              <div className="space-y-3">
                <input
                  value={anchoredItem.title}
                  onChange={(e) => setAnchoredItem((state) => ({ ...state, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Weekly sync / dentist / send draft"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={anchoredItem.start_time}
                    onChange={(e) => setAnchoredItem((state) => ({ ...state, start_time: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={anchoredItem.end_time}
                    onChange={(e) => setAnchoredItem((state) => ({ ...state, end_time: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  rows={2}
                  value={anchoredItem.note}
                  onChange={(e) => setAnchoredItem((state) => ({ ...state, note: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Short note for the planner"
                />
                <Button variant="secondary" className="w-full" onClick={handleAddAnchoredItem}>
                  <Plus className="h-4 w-4" />
                  Add Anchored Item
                </Button>
              </div>
              <div className="mt-5 space-y-2">
                {anchoredItems.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.start_time} - {item.end_time}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setAnchoredItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Focus Items</h2>
                <p className="text-sm text-slate-500">Flexible things you want tomorrow to advance.</p>
              </div>
              <div className="space-y-3">
                <input
                  value={focusItem.title}
                  onChange={(e) => setFocusItem((state) => ({ ...state, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Draft rules doc / DDIA reading / side project"
                />
                <textarea
                  rows={2}
                  value={focusItem.description}
                  onChange={(e) => setFocusItem((state) => ({ ...state, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="What should this block try to achieve?"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={focusItem.estimated_minutes}
                    onChange={(e) =>
                      setFocusItem((state) => ({ ...state, estimated_minutes: Number(e.target.value) }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={focusItem.tag}
                    onChange={(e) => setFocusItem((state) => ({ ...state, tag: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="work">Work</option>
                    <option value="learning">Learning</option>
                    <option value="project">Project</option>
                  </select>
                  <select
                    value={focusItem.priority}
                    onChange={(e) => setFocusItem((state) => ({ ...state, priority: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <select
                  value={focusItem.prefer_window}
                  onChange={(e) => setFocusItem((state) => ({ ...state, prefer_window: e.target.value }))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="morning">Prefer morning</option>
                  <option value="afternoon">Prefer afternoon</option>
                  <option value="evening">Prefer evening</option>
                  <option value="any">Any window</option>
                </select>
                <Button className="w-full" onClick={handleAddFocusItem}>
                  <Plus className="h-4 w-4" />
                  Add Focus Item
                </Button>
              </div>
              <div className="mt-5 space-y-2">
                {focusItems.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.estimated_minutes} min · {item.priority} · {item.prefer_window}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setFocusItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Generated Plan</h2>
                <p className="text-sm text-slate-500">{targetDate}</p>
              </div>
              {targetPlan && targetPlan.status === 'draft' && (
                <Button variant="secondary" size="sm" onClick={() => confirmPlan(targetPlan.id)}>
                  <CheckCircle className="h-4 w-4" />
                  Confirm
                </Button>
              )}
            </div>

            {targetPlan && (
              <div className="mb-4 flex items-center gap-3">
                <Badge variant={targetPlan.status === 'confirmed' ? 'success' : 'warning'}>
                  {targetPlan.status}
                </Badge>
                <p className="text-sm text-slate-500">{targetPlan.summary}</p>
              </div>
            )}

            {targetPlan?.time_blocks?.length ? (
              <div className="space-y-3">
                {targetPlan.time_blocks.map((block) => (
                  <div
                    key={block.id || `${block.start_time}-${block.title}`}
                    className={clsx('rounded-2xl border-l-4 px-4 py-4', blockColors[block.type])}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">{block.title}</p>
                        <p className="text-xs font-mono text-slate-500">
                          {block.start_time} - {block.end_time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {block.is_locked && <Badge variant="danger">locked</Badge>}
                        <Badge variant={blockBadge[block.type]}>{block.type}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>{block.description || block.note}</p>
                      <p>
                        <span className="font-medium text-slate-800">Goal:</span> {block.goal}
                      </p>
                      <p>
                        <span className="font-medium text-slate-800">Output:</span> {block.expected_output}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-16 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  Generate tomorrow&apos;s plan to see reserved blocks, work sessions, goals, and outputs.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
