import clsx from 'clsx'
import { ChevronDown, CalendarDays, CheckSquare, Sparkles, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tag } from '@/components/ui/Tag'
import type { AgentMessage } from '@/store/rhythmiqStore'

interface MessageBubbleProps {
  message: AgentMessage
}

function TextBubble({ text, role }: { text: string; role: 'user' | 'assistant' }) {
  return (
    <Card
      className={clsx(
        'max-w-[82%]',
        role === 'user'
          ? 'ml-auto border-sky-200 bg-sky-600 text-white shadow-[0_16px_40px_rgba(2,132,199,0.22)]'
          : 'border-slate-200 bg-white text-slate-900',
      )}
    >
      <p className="whitespace-pre-line text-sm leading-6">{text}</p>
    </Card>
  )
}

function PlanSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="group rounded-3xl border border-slate-200 bg-white p-4" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.content.type === 'text') {
    return <TextBubble text={message.content.text} role={message.role} />
  }

  return (
    <Card className="border-sky-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Tag variant="primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                系统计划
              </Tag>
              <Tag variant="neutral">Agent 生成</Tag>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">{message.content.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{message.content.summary}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Target className="h-6 w-6" />
          </div>
        </div>

        <PlanSection title="Goal" icon={Target} defaultOpen>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{message.content.goal.title}</p>
              <p className="mt-1 text-sm text-slate-500">{message.content.goal.description}</p>
            </div>
            <ProgressBar value={message.content.goal.progress} tone="primary" label="Goal progress" />
            <div className="flex flex-wrap gap-2">
              <Tag variant="primary">{message.content.goal.type}</Tag>
              <Tag variant={message.content.goal.priority === 'high' ? 'warning' : 'neutral'}>
                {message.content.goal.priority}
              </Tag>
              <Tag variant={message.content.goal.status === 'completed' ? 'success' : 'primary'}>
                {message.content.goal.status}
              </Tag>
            </div>
          </div>
        </PlanSection>

        <PlanSection title="Plan" icon={Sparkles}>
          <ol className="space-y-2">
            {message.content.plan.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
        </PlanSection>

        <PlanSection title="Tasks" icon={CheckSquare}>
          <div className="space-y-2">
            {message.content.tasks.map((task) => (
              <div key={task.id} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.estimated_minutes} min · {task.priority}</p>
                </div>
                <Tag variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'neutral'}>
                  {task.status}
                </Tag>
              </div>
            ))}
          </div>
        </PlanSection>

        <PlanSection title="Schedule" icon={CalendarDays} defaultOpen={false}>
          <div className="space-y-2">
            {message.content.schedule.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="rounded-xl bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                  {item.start} - {item.end}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                    <Tag variant={item.kind === 'habit' ? 'success' : item.kind === 'task' ? 'warning' : 'neutral'}>
                      {item.kind}
                    </Tag>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.day}{item.note ? ` · ${item.note}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PlanSection>
      </div>
    </Card>
  )
}
