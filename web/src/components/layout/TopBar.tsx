import { Bell, Search, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useUserStore } from '@/store'

export function TopBar() {
  const currentUser = useUserStore((state) => state.currentUser)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-600">Rhythmiq</p>
          <h1 className="text-xl font-semibold text-slate-900">智能目标与排期系统</h1>
        </div>

        <div className="flex items-center gap-3">
          <Card padding={false} className="flex items-center gap-2 rounded-full px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500">搜索目标、任务、习惯</span>
          </Card>
          <Badge variant="primary">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            智能体在线
          </Badge>
          <Button variant="secondary" size="sm">
            <Bell className="h-4 w-4" />
            通知
          </Button>
          <div className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            {currentUser?.name ?? '访客'}
          </div>
        </div>
      </div>
    </header>
  )
}
