import { Card } from '@/components/ui/Card'

interface MetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon: React.ElementType
}

export function MetricCard({ label, value, hint, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
        </div>
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
