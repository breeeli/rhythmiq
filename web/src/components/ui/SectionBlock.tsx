import clsx from 'clsx'

interface SectionBlockProps {
  title: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function SectionBlock({ title, description, action, children, className }: SectionBlockProps) {
  return (
    <section className={clsx('space-y-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
