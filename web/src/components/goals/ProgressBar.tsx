import clsx from 'clsx'

type ProgressTone = 'primary' | 'success' | 'warning' | 'neutral'

interface ProgressBarProps {
  value: number
  tone?: ProgressTone
  showLabel?: boolean
  label?: string
  className?: string
}

const tones: Record<ProgressTone, string> = {
  primary: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  neutral: 'bg-slate-400',
}

export function ProgressBar({ value, tone = 'primary', showLabel = true, label, className }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value))

  return (
    <div className={clsx('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">{label ?? '进度'}</span>
          <span className="font-semibold text-slate-900">{Math.round(normalized)}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={clsx('h-2.5 rounded-full transition-[width] duration-700 ease-out', tones[tone])}
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  )
}
