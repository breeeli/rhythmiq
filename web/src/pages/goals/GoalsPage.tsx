import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  formatChineseDate,
  labelGoalStatus,
  labelGoalType,
  labelPriority,
} from '@/lib/display'
import { useUserStore, useGoalStore } from '@/store'
import type { Goal, GoalPriority, GoalType } from '@/types'

const priorityVariant: Record<GoalPriority, 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: number) => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">{goal.title}</p>
          {goal.description && <p className="mt-1 text-sm text-slate-500">{goal.description}</p>}
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={priorityVariant[goal.priority]}>{labelPriority(goal.priority)}</Badge>
        <Badge variant="info">{labelGoalType(goal.type)}</Badge>
        <Badge variant={goal.status === 'completed' ? 'success' : 'default'}>
          {labelGoalStatus(goal.status)}
        </Badge>
        {goal.deadline && (
          <span className="ml-auto text-xs text-slate-400">
            截止 {formatChineseDate(goal.deadline)}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">已完成 {goal.progress}%</span>
    </Card>
  )
}

function AddGoalModal({
  userID,
  onClose,
}: {
  userID: number
  onClose: () => void
}) {
  const { createGoal } = useGoalStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<GoalType>('short_term')
  const [priority, setPriority] = useState<GoalPriority>('medium')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await createGoal(userID, { title, description, type, priority })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">新建目标</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="目标标题 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="补充说明（可选）"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3">
            <select
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as GoalType)}
            >
              <option value="short_term">短期</option>
              <option value="long_term">长期</option>
            </select>
            <select
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as GoalPriority)}
            >
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              创建
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const { currentUser } = useUserStore()
  const { goals, fetchGoals, deleteGoal, loading } = useGoalStore()
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (currentUser) fetchGoals(currentUser.id)
  }, [currentUser, fetchGoals])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">目标</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> 新建目标
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">加载中...</p>
      ) : goals.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">还没有目标，先创建一个吧。</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} />
          ))}
        </div>
      )}

      {showAdd && currentUser && (
        <AddGoalModal userID={currentUser.id} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}
