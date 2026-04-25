import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { labelGoalStatus } from '@/lib/display'
import { useGoalStore, useUserStore } from '@/store'
import type { CreateGoalPayload } from '@/api'
import type { Goal, GoalPriority, GoalStatus } from '@/types'

interface GoalModalProps {
  goal?: Goal
  open: boolean
  onClose: () => void
  onSaved?: (goal: Goal) => void
}

type GoalForm = {
  title: string
  description: string
  outcome: string
  status: GoalStatus
  priority: GoalPriority
  parent_goal_id: string
  target_date: string
  success_criteria: string[]
}

const defaultForm: GoalForm = {
  title: '',
  description: '',
  outcome: '',
  status: 'draft',
  priority: 'medium',
  parent_goal_id: '',
  target_date: '',
  success_criteria: [''],
}

const goalStatuses: GoalStatus[] = ['draft', 'active', 'completed', 'archived', 'abandoned']

function toDateValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function formFromGoal(goal: Goal): GoalForm {
  return {
    title: goal.title,
    description: goal.description ?? '',
    outcome: goal.outcome ?? '',
    status: goal.status,
    priority: goal.priority,
    parent_goal_id: goal.parent_goal_id ? String(goal.parent_goal_id) : '',
    target_date: toDateValue(goal.target_date || goal.deadline),
    success_criteria: goal.success_criteria?.length ? goal.success_criteria : [''],
  }
}

function cleanCriteria(values: string[]) {
  return values.map((v) => v.trim()).filter(Boolean)
}

export function GoalModal({ goal, open, onClose, onSaved }: GoalModalProps) {
  const currentUser = useUserStore((s) => s.currentUser)
  const goals = useGoalStore((s) => s.goals)
  const createGoal = useGoalStore((s) => s.createGoal)
  const updateGoal = useGoalStore((s) => s.updateGoal)

  const isEditing = !!goal
  const [form, setForm] = useState<GoalForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(goal ? formFromGoal(goal) : defaultForm)
    setError(null)
  }, [open, goal])

  const parentOptions = useMemo(
    () => goals.filter((g) => g.id !== goal?.id),
    [goals, goal?.id],
  )

  const save = async () => {
    if (!currentUser || !form.title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload: CreateGoalPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        outcome: form.outcome.trim(),
        status: form.status,
        priority: form.priority,
        parent_goal_id: form.parent_goal_id ? Number(form.parent_goal_id) : undefined,
        target_date: form.target_date || undefined,
        success_criteria: cleanCriteria(form.success_criteria),
      }
      const saved = isEditing
        ? await updateGoal(goal.id, payload)
        : await createGoal(currentUser.id, payload)
      onSaved?.(saved)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? '编辑目标' : '新建目标'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error ? (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</div>
          ) : null}

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">目标名称</span>
              <input
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                placeholder="请输入目标名称"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">描述</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={3}
                className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                placeholder="目标的背景和详细说明"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">预期结果</span>
              <textarea
                value={form.outcome}
                onChange={(e) => setForm((s) => ({ ...s, outcome: e.target.value }))}
                rows={2}
                className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                placeholder="完成后预期交付什么结果"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">状态</span>
              <select
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as GoalStatus }))}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                {goalStatuses.map((s) => (
                  <option key={s} value={s}>{labelGoalStatus(s)}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">优先级</span>
              <select
                value={form.priority}
                onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value as GoalPriority }))}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">截止日期</span>
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm((s) => ({ ...s, target_date: e.target.value }))}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">父目标</span>
              <select
                value={form.parent_goal_id}
                onChange={(e) => setForm((s) => ({ ...s, parent_goal_id: e.target.value }))}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">无父目标</option>
                {parentOptions.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">成功标准</span>
              <button
                type="button"
                onClick={() => setForm((s) => ({ ...s, success_criteria: [...s.success_criteria, ''] }))}
                className="text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                + 添加
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {form.success_criteria.map((c, i) => (
                <input
                  key={i}
                  value={c}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      success_criteria: s.success_criteria.map((v, j) => (j === i ? e.target.value : v)),
                    }))
                  }
                  className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  placeholder={`标准 ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button loading={saving} disabled={!form.title.trim()} onClick={save}>
              {isEditing ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
