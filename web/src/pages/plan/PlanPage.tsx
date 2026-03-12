import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUserStore, usePlanStore } from '@/store'
import type { TimeBlockType } from '@/types'
import clsx from 'clsx'

const blockColors: Record<TimeBlockType, string> = {
  work: 'border-l-indigo-500 bg-indigo-50',
  break: 'border-l-emerald-500 bg-emerald-50',
  personal: 'border-l-amber-500 bg-amber-50',
  buffer: 'border-l-slate-300 bg-slate-50',
}

const blockBadge: Record<TimeBlockType, 'info' | 'success' | 'warning' | 'default'> = {
  work: 'info',
  break: 'success',
  personal: 'warning',
  buffer: 'default',
}

export default function PlanPage() {
  const { currentUser } = useUserStore()
  const { todayPlan, loading, fetchToday, generatePlan, confirmPlan } = usePlanStore()
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (currentUser) fetchToday(currentUser.id)
  }, [currentUser, fetchToday])

  const handleGenerate = () => {
    if (currentUser) generatePlan(currentUser.id, hint || undefined)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Today's Plan</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {todayPlan && todayPlan.status === 'draft' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => confirmPlan(todayPlan.id)}
          >
            <CheckCircle className="h-4 w-4" /> Confirm Plan
          </Button>
        )}
      </div>

      {/* Generate panel */}
      <Card className="mb-6">
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder='Hint for AI, e.g. "I have a meeting at 15:00"'
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button loading={loading} onClick={handleGenerate}>
            <Sparkles className="h-4 w-4" />
            {todayPlan ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
      </Card>

      {/* Plan status */}
      {todayPlan && (
        <div className="mb-4 flex items-center gap-3">
          <Badge variant={todayPlan.status === 'confirmed' ? 'success' : 'warning'}>
            {todayPlan.status}
          </Badge>
          <p className="text-sm text-slate-500">{todayPlan.summary}</p>
        </div>
      )}

      {/* Time blocks */}
      {todayPlan?.time_blocks?.length ? (
        <div className="space-y-2">
          {todayPlan.time_blocks.map((block) => (
            <div
              key={block.id}
              className={clsx(
                'flex items-center gap-4 rounded-lg border-l-4 px-4 py-3',
                blockColors[block.type],
              )}
            >
              <span className="w-28 shrink-0 font-mono text-xs text-slate-500">
                {block.start_time} – {block.end_time}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{block.title}</p>
                {block.note && <p className="text-xs text-slate-400">{block.note}</p>}
              </div>
              <Badge variant={blockBadge[block.type]}>{block.type}</Badge>
              {block.done && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />}
            </div>
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-slate-400">Click "Generate" to create your AI-powered daily plan.</p>
        </Card>
      )}
    </div>
  )
}
