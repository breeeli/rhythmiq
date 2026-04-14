import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, PencilLine, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { Tag } from '@/components/ui/Tag'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Composer } from '@/components/agent/Composer'
import { MessageBubble } from '@/components/agent/MessageBubble'
import { useRhythmiqStore, type ScheduleItem } from '@/store/rhythmiqStore'
import type { TaskStatus } from '@/types'

export default function AgentPage() {
  const [prompt, setPrompt] = useState('')
  const [editing, setEditing] = useState(false)
  const {
    messages,
    draftPlan,
    acceptPlan,
    modifyPlan,
    regeneratePlan,
    updateDraftPlan,
    sendPrompt,
  } = useRhythmiqStore()

  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalProgress, setGoalProgress] = useState(0)
  const [planSteps, setPlanSteps] = useState<string[]>([])
  const [taskDrafts, setTaskDrafts] = useState<Array<{ id: number; title: string; status: TaskStatus }>>([])
  const [scheduleDrafts, setScheduleDrafts] = useState<ScheduleItem[]>([])

  useEffect(() => {
    if (!draftPlan) return
    setGoalTitle(draftPlan.goal.title)
    setGoalDescription(draftPlan.goal.description)
    setGoalProgress(draftPlan.goal.progress)
    setPlanSteps(draftPlan.plan)
    setTaskDrafts(draftPlan.tasks.map((task) => ({ id: task.id, title: task.title, status: task.status })))
    setScheduleDrafts(draftPlan.schedule)
  }, [draftPlan])

  const activePromptHint = useMemo(() => {
    if (!draftPlan) return '先输入一个目标、问题或者约束，Agent 会生成系统方案。'
    return '你可以继续修改、确认或重新生成当前计划。'
  }, [draftPlan])

  const handleSubmit = () => {
    if (!prompt.trim()) return
    sendPrompt(prompt.trim())
    setPrompt('')
    setEditing(false)
  }

  const handleSaveEdits = () => {
    if (!draftPlan) return
    updateDraftPlan((plan) => ({
      ...plan,
      goal: {
        ...plan.goal,
        title: goalTitle.trim() || plan.goal.title,
        description: goalDescription.trim() || plan.goal.description,
        progress: Math.max(0, Math.min(100, goalProgress)),
      },
      plan: planSteps.filter((step) => step.trim().length > 0),
      tasks: plan.tasks.map((task, index) => {
        const next = taskDrafts[index]
        if (!next) return task
        return {
          ...task,
          title: next.title.trim() || task.title,
          status: next.status,
        }
      }),
      schedule: scheduleDrafts.map((item) => ({ ...item })),
    }))
    setEditing(false)
  }

  return (
    <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <SectionBlock
          title="Agent Control Center"
          description="这里不是普通聊天窗，而是系统计划的生成、审阅和执行中心。"
          action={<Tag variant="primary">Structured response</Tag>}
        >
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </SectionBlock>

        <Composer value={prompt} onChange={setPrompt} onSubmit={handleSubmit} />
        <p className="px-1 text-sm text-slate-500">{activePromptHint}</p>
      </div>

      <div className="space-y-6">
        {draftPlan ? (
          <Card className="border-sky-100 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Tag variant="primary">Generated system plan</Tag>
                    <Tag variant="neutral">Draft mode</Tag>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-900">{draftPlan.goal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{draftPlan.summary}</p>
                </div>
                <ProgressBar value={draftPlan.goal.progress} tone="primary" label="Goal progress" className="min-w-52" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button onClick={acceptPlan}>
                  <CheckCircle2 className="h-4 w-4" />
                  Accept Plan
                </Button>
                <Button
                  variant={editing ? 'primary' : 'secondary'}
                  onClick={() => {
                    if (editing) {
                      handleSaveEdits()
                    } else {
                      modifyPlan()
                      setEditing(true)
                    }
                  }}
                >
                  <PencilLine className="h-4 w-4" />
                  {editing ? 'Save Changes' : 'Modify'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    regeneratePlan()
                    setEditing(false)
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>

              <div className="space-y-3">
                <details open className="group rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Goal</p>
                      <p className="text-xs text-slate-500">目标定义、状态和完成率。</p>
                    </div>
                    <span className="text-xs text-slate-400">展开</span>
                  </summary>
                  <div className="mt-4 space-y-3">
                    {editing ? (
                      <>
                        <input
                          value={goalTitle}
                          onChange={(e) => setGoalTitle(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                        />
                        <textarea
                          value={goalDescription}
                          onChange={(e) => setGoalDescription(e.target.value)}
                          rows={3}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                        />
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={goalProgress}
                            onChange={(e) => setGoalProgress(Number(e.target.value))}
                            className="w-full"
                          />
                          <Tag variant="primary">{goalProgress}%</Tag>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-900">{draftPlan.goal.title}</p>
                        <p className="text-sm leading-6 text-slate-600">{draftPlan.goal.description}</p>
                        <ProgressBar value={draftPlan.goal.progress} tone="primary" />
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="primary">{draftPlan.goal.type}</Tag>
                          <Tag variant={draftPlan.goal.priority === 'high' ? 'warning' : 'neutral'}>{draftPlan.goal.priority}</Tag>
                          <Tag variant="neutral">{draftPlan.goal.status}</Tag>
                        </div>
                      </>
                    )}
                  </div>
                </details>

                <details open className="group rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Plan</p>
                      <p className="text-xs text-slate-500">结构化步骤，支持编辑。</p>
                    </div>
                    <span className="text-xs text-slate-400">展开</span>
                  </summary>
                  <div className="mt-4 space-y-2">
                    {editing ? (
                      <textarea
                        value={planSteps.join('\n')}
                        onChange={(e) => setPlanSteps(e.target.value.split('\n'))}
                        rows={8}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300"
                      />
                    ) : (
                      planSteps.map((step, index) => (
                        <div key={`${step}-${index}`} className="flex gap-3 rounded-2xl bg-white px-4 py-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-6 text-slate-700">{step}</p>
                        </div>
                      ))
                    )}
                  </div>
                </details>

                <details open className="group rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Tasks</p>
                      <p className="text-xs text-slate-500">任务列表，以系统方案形式输出。</p>
                    </div>
                    <span className="text-xs text-slate-400">展开</span>
                  </summary>
                  <div className="mt-4 space-y-3">
                    {editing
                      ? taskDrafts.map((task, index) => (
                          <div key={task.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                              <input
                                value={task.title}
                                onChange={(e) =>
                                  setTaskDrafts((items) =>
                                    items.map((item, currentIndex) =>
                                      currentIndex === index ? { ...item, title: e.target.value } : item,
                                    ),
                                  )
                                }
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
                              />
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  setTaskDrafts((items) =>
                                    items.map((item, currentIndex) =>
                                      currentIndex === index ? { ...item, status: e.target.value as TaskStatus } : item,
                                    ),
                                  )
                                }
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none"
                              >
                                <option value="todo">todo</option>
                                <option value="in_progress">in_progress</option>
                                <option value="done">done</option>
                                <option value="skipped">skipped</option>
                              </select>
                            </div>
                          </div>
                        ))
                      : draftPlan.tasks.map((task) => (
                          <div key={task.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{task.title}</p>
                              <p className="text-xs text-slate-500">{task.estimated_minutes} min</p>
                            </div>
                            <Tag variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'primary' : 'neutral'}>
                              {task.status}
                            </Tag>
                          </div>
                        ))}
                  </div>
                </details>

                <details open={false} className="group rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Schedule</p>
                      <p className="text-xs text-slate-500">结构化排期预览。</p>
                    </div>
                    <span className="text-xs text-slate-400">展开</span>
                  </summary>
                  <div className="mt-4 space-y-3">
                    {editing
                      ? scheduleDrafts.map((item, index) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
                              <input
                                value={item.title}
                                onChange={(e) =>
                                  setScheduleDrafts((items) =>
                                    items.map((current, currentIndex) =>
                                      currentIndex === index ? { ...current, title: e.target.value } : current,
                                    ),
                                  )
                                }
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
                              />
                              <input
                                value={item.start}
                                onChange={(e) =>
                                  setScheduleDrafts((items) =>
                                    items.map((current, currentIndex) =>
                                      currentIndex === index ? { ...current, start: e.target.value } : current,
                                    ),
                                  )
                                }
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
                              />
                              <input
                                value={item.end}
                                onChange={(e) =>
                                  setScheduleDrafts((items) =>
                                    items.map((current, currentIndex) =>
                                      currentIndex === index ? { ...current, end: e.target.value } : current,
                                    ),
                                  )
                                }
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
                              />
                            </div>
                          </div>
                        ))
                      : draftPlan.schedule.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3">
                            <div className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                              {item.start}-{item.end}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-500">{item.day}</p>
                            </div>
                          </div>
                        ))}
                  </div>
                </details>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">等待新的 Agent 计划。</p>
          </Card>
        )}
      </div>
    </div>
  )
}
