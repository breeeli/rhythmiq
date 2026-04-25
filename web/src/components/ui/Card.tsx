import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-md border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]',
        padding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
