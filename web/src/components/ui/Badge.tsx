import clsx from 'clsx'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  children: React.ReactNode
  className?: string
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-700 ring-amber-200',
  danger: 'bg-rose-100 text-rose-700 ring-rose-200',
  info: 'bg-teal-100 text-teal-700 ring-teal-200',
  primary: 'bg-teal-100 text-teal-700 ring-teal-200',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
