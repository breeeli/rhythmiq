import clsx from 'clsx'

type TagVariant = 'primary' | 'success' | 'warning' | 'neutral' | 'danger'

interface TagProps {
  variant?: TagVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<TagVariant, string> = {
  primary: 'bg-sky-50 text-sky-700 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export function Tag({ variant = 'neutral', children, className }: TagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
