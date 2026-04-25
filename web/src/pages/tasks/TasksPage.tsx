import { useEffect, useRef } from 'react'
import { ClipboardList } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { labelTaskStatus } from '@/lib/display'
import { useTaskStore, useUserStore } from '@/store'

export default function TasksPage() {
  const currentUser = useUserStore((state) => state.currentUser)
  const tasks = useTaskStore((state) => state.tasks)
  const loading = useTaskStore((state) => state.loading)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)
  const fetchedUserIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!currentUser || fetchedUserIdRef.current === currentUser.id) return
    fetchedUserIdRef.current = currentUser.id
    fetchTasks(currentUser.id).catch(() => undefined)
  }, [currentUser, fetchTasks])

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-5 py-5 lg:px-8 lg:py-7">
      <div>
        <p className="text-sm font-medium text-teal-700">Task list</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">行动项</h1>
        <p className="mt-2 text-sm text-slate-600">MVP 只保留 Goal 到 Task 两层，行动项按 sequence 排序。</p>
      </div>

      {loading && tasks.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">正在加载行动项...</p>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-slate-400" />
            <p className="text-sm text-slate-500">还没有行动项。请先在目标详情页创建。</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Tag variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'neutral'}>
                  {labelTaskStatus(task.status)}
                </Tag>
                <Tag variant="neutral">#{task.sequence || 0}</Tag>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-950">{task.title}</h2>
              {task.expected_output && <p className="mt-2 text-sm text-slate-600">产出：{task.expected_output}</p>}
              <p className="mt-2 text-xs text-slate-400">{task.estimated_minutes} 分钟</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
