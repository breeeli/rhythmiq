import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'

interface PlanListProps {
  items: string[]
}

export function PlanList({ items }: PlanListProps) {
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Plan</h3>
          <Tag variant="neutral">{items.length} steps</Tag>
        </div>
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
