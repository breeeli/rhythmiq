import { Sparkles, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function Composer({ value, onChange, onSubmit }: ComposerProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <WandSparkles className="h-4 w-4 text-teal-600" />
        让 Agent 帮你组织目标
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-300"
        placeholder="例如：帮我把本周工作和健身安排得更稳一点"
      />
      <div className="mt-3 flex items-center justify-end">
        <Button onClick={onSubmit}>
          <Sparkles className="h-4 w-4" />
          发送给 Agent
        </Button>
      </div>
    </div>
  )
}
