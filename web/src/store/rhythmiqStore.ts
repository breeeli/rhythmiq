import { create } from 'zustand'
import type { Goal, GoalPriority, Task, TaskStatus } from '@/types'

export interface Habit {
  id: number
  name: string
  streak: number
  completion: number
  active: boolean
  category: 'routine' | 'habit'
}

export interface ScheduleItem {
  id: number
  day: string
  date?: string
  start: string
  end: string
  title: string
  kind: 'routine' | 'habit' | 'task'
  goalId?: number
  taskId?: number
  note?: string
}

type GoalDraft = Partial<Goal> & Pick<Goal, 'title'>
type TaskDraft = Partial<Task> & Pick<Task, 'title'>
type ScheduleDraft = Omit<ScheduleItem, 'id'>

export interface AgentPlan {
  goal: Goal
  summary: string
  plan: string[]
  tasks: Task[]
  schedule: ScheduleItem[]
}

export interface AgentTextMessage {
  id: number
  role: 'user' | 'assistant'
  content: {
    type: 'text'
    text: string
  }
  createdAt: string
}

export interface AgentPlanMessage {
  id: number
  role: 'assistant'
  content: {
    type: 'system_plan'
    title: string
    summary: string
    goal: Goal
    plan: string[]
    tasks: Task[]
    schedule: ScheduleItem[]
  }
  createdAt: string
}

export type AgentMessage = AgentTextMessage | AgentPlanMessage

function nowIso() {
  return new Date().toISOString()
}

function makeGoal(overrides: Partial<Goal> & Pick<Goal, 'id' | 'title'>): Goal {
  return {
    created_at: nowIso(),
    updated_at: nowIso(),
    user_id: 1,
    parent_goal_id: undefined,
    description: '',
    status: 'active',
    source: 'manual',
    priority: 'medium',
    outcome: '',
    success_criteria: [],
    motivation: '',
    progress: 0,
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title' | 'goal_id'>): Task {
  return {
    created_at: nowIso(),
    updated_at: nowIso(),
    user_id: 1,
    description: '',
    expected_output: '',
    status: 'todo',
    priority: 'medium',
    estimated_minutes: 30,
    actual_minutes: 0,
    prefer_morning: false,
    needs_focus: false,
    sequence: 1,
    tags: '',
    ...overrides,
  }
}

function getWeekdayLabel(date: Date) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]
}

function getWeekDates(anchor = new Date()) {
  const day = anchor.getDay()
  const sunday = new Date(anchor)
  sunday.setDate(anchor.getDate() - day)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + index)
    return date
  })
}

function makePlanMessage(id: number, draft: AgentPlan): AgentPlanMessage {
  return {
    id,
    role: 'assistant',
    content: {
      type: 'system_plan',
      title: draft.goal.title,
      summary: draft.summary,
      goal: draft.goal,
      plan: draft.plan,
      tasks: draft.tasks,
      schedule: draft.schedule,
    },
    createdAt: nowIso(),
  }
}

function buildPlan(prompt: string, modifier: 'draft' | 'refine' | 'fresh' = 'draft'): AgentPlan {
  const text = prompt.toLowerCase()
  const theme =
    text.includes('健康') || text.includes('运动')
      ? {
          title: '建立稳定运动节奏',
          description: '把运动、恢复和日常节奏整合到一个更稳定的系统里。',
          priority: 'high' as GoalPriority,
        }
      : text.includes('学习')
        ? {
            title: '推进学习与输出系统',
            description: '围绕学习、复盘和输出建立可持续节奏。',
            priority: 'medium' as GoalPriority,
          }
        : {
            title: '推进核心目标系统',
            description: '把目标拆成可执行的任务与日程安排。',
            priority: 'medium' as GoalPriority,
          }

  const goalId = modifier === 'fresh' ? 3000 + Math.floor(Math.random() * 1000) : 2001
  const taskSeed =
    modifier === 'refine'
      ? ['缩小范围', '优先关键动作', '降低阻力', '保留弹性']
      : ['明确目标', '拆分任务', '安排节奏', '每周复盘']
  const scheduleWeek = getWeekDates()

  const goal = makeGoal({
    id: goalId,
    title: modifier === 'refine' ? `${theme.title}（优化版）` : theme.title,
    description: theme.description,
    outcome: theme.description,
    success_criteria: ['目标定义清楚', '行动项可以执行', '每周有回看点'],
    priority: theme.priority,
    status: 'active',
    progress: modifier === 'refine' ? 42 : 35,
    start_date: scheduleWeek[0].toISOString().slice(0, 10),
    target_date: scheduleWeek[6].toISOString().slice(0, 10),
  })

  const tasks = taskSeed.map((label, index) =>
    makeTask({
      id: goalId * 10 + index + 1,
      goal_id: goalId,
      title: label,
      description: modifier === 'refine' ? '调整为更低阻力的执行方式。' : '自动生成的执行步骤。',
      expected_output: `${label}的可检查结果`,
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      estimated_minutes: 20 + index * 15,
      prefer_morning: index < 2,
      status: index === 0 ? 'in_progress' : 'todo',
      sequence: index + 1,
      tags: index === 0 ? 'agent' : 'sprint',
    }),
  )

  const plan = [
    '先锁定一个清晰目标，再把它转成周节奏。',
    '把高阻力步骤拆到更短的执行窗口。',
    '保留固定日程和习惯位置，避免被任务挤占。',
    '每周检查一次进度，重新校准优先级。',
  ]

  const schedule: ScheduleItem[] = scheduleWeek.slice(1, 6).map((date, index) => ({
    id: goalId * 100 + index,
    day: getWeekdayLabel(date),
    date: date.toISOString().slice(0, 10),
    start: index < 2 ? '09:30' : '20:30',
    end: index < 2 ? '10:15' : '21:15',
    title: tasks[index % tasks.length].title,
    kind: 'task',
    goalId,
    taskId: tasks[index % tasks.length].id,
    note: 'Agent draft',
  }))

  return {
    goal,
    summary: '这是一份本地模拟的结构化计划，用于展示目标、行动项和日程之间的关系。',
    plan,
    tasks,
    schedule,
  }
}

const initialGoals: Goal[] = [
  makeGoal({
    id: 1,
    title: '完成 Rhythmiq MVP',
    description: '先跑通目标和行动项的本地闭环。',
    outcome: '用户可以管理目标，并把目标拆成可执行行动项。',
    success_criteria: ['目标可 CRUD', '行动项可 CRUD', '状态可维护'],
    priority: 'high',
    progress: 35,
    start_date: nowIso().slice(0, 10),
  }),
]

const initialTasks: Task[] = [
  makeTask({
    id: 1,
    goal_id: 1,
    title: '设计 Goal 模型',
    expected_output: '确定字段、状态和页面行为',
    priority: 'high',
    sequence: 1,
    status: 'done',
  }),
  makeTask({
    id: 2,
    goal_id: 1,
    title: '实现行动项管理',
    expected_output: '目标详情页可以维护行动项',
    priority: 'medium',
    sequence: 2,
  }),
]

const initialHabits: Habit[] = [
  { id: 1, name: '晚间复盘', streak: 5, completion: 1, active: true, category: 'routine' },
  { id: 2, name: '力量训练', streak: 3, completion: 0, active: true, category: 'habit' },
]

const initialSchedules: ScheduleItem[] = [
  { id: 1, day: getWeekdayLabel(new Date()), start: '09:30', end: '10:30', title: '目标推进', kind: 'task', goalId: 1, taskId: 2 },
  { id: 2, day: getWeekdayLabel(new Date()), start: '21:00', end: '21:30', title: '晚间复盘', kind: 'habit' },
]

const initialDraft = buildPlan('我想优化我的节奏')

const initialMessages: AgentMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content: {
      type: 'text',
      text: '告诉我你想推进的目标，我会先生成本地结构化草稿。真实 LLM 放到第二期。',
    },
    createdAt: nowIso(),
  },
  makePlanMessage(2, initialDraft),
]

interface RhythmiqState {
  goals: Goal[]
  tasks: Task[]
  habits: Habit[]
  schedules: ScheduleItem[]
  messages: AgentMessage[]
  draftPlan: AgentPlan | null
  selectedGoalId: number | null
  todayProgress: number
  sendPrompt: (prompt: string) => void
  acceptPlan: () => void
  modifyPlan: () => void
  regeneratePlan: () => void
  updateDraftPlan: (updater: (plan: AgentPlan) => AgentPlan) => void
  createGoal: (goal: GoalDraft) => Goal
  updateGoal: (goalId: number, patch: Partial<Goal>) => void
  deleteGoal: (goalId: number) => void
  addSchedule: (schedule: ScheduleDraft) => ScheduleItem
  updateSchedule: (scheduleId: number, patch: Partial<ScheduleItem>) => void
  deleteSchedule: (scheduleId: number) => void
  createTask: (goalId: number, task: TaskDraft) => Task
  updateTask: (taskId: number, patch: Partial<Task>) => void
  deleteTask: (taskId: number) => void
  toggleGoalTask: (goalId: number, taskId: number) => void
  toggleHabit: (habitId: number) => void
  selectGoal: (goalId: number) => void
}

function recalcProgress(tasks: Task[], goalId: number) {
  const goalTasks = tasks.filter((task) => task.goal_id === goalId)
  if (!goalTasks.length) return 0
  return Math.round((goalTasks.filter((task) => task.status === 'done').length / goalTasks.length) * 100)
}

function todayCompletion(habits: Habit[], tasks: Task[]) {
  const habitScore = habits.filter((habit) => habit.completion > 0).length
  const taskScore = tasks.filter((task) => task.status === 'done').length
  return Math.round(((habitScore + taskScore) / Math.max(1, habits.length + tasks.length)) * 100)
}

function nextId(items: Array<{ id: number }>, seed = 1) {
  return items.reduce((max, item) => Math.max(max, item.id), seed - 1) + 1
}

function recalcGoalProgress(goals: Goal[], tasks: Task[], goalId: number) {
  const progress = recalcProgress(tasks, goalId)
  return goals.map((goal) =>
    goal.id === goalId ? { ...goal, progress, updated_at: nowIso() } : goal,
  )
}

function planToMessage(draft: AgentPlan, id = Date.now()): AgentPlanMessage {
  return makePlanMessage(id, draft)
}

export const useRhythmiqStore = create<RhythmiqState>()((set, get) => ({
  goals: initialGoals,
  tasks: initialTasks,
  habits: initialHabits,
  schedules: initialSchedules,
  messages: initialMessages,
  draftPlan: initialDraft,
  selectedGoalId: 1,
  todayProgress: todayCompletion(initialHabits, initialTasks),

  sendPrompt: (prompt) => {
    const nextDraft = buildPlan(prompt)
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now(),
          role: 'user',
          content: { type: 'text', text: prompt },
          createdAt: nowIso(),
        },
        planToMessage(nextDraft, Date.now() + 1),
      ],
      draftPlan: nextDraft,
      selectedGoalId: nextDraft.goal.id,
    }))
  },

  acceptPlan: () => {
    const draft = get().draftPlan
    if (!draft) return

    set((state) => {
      const mergedGoals = [draft.goal, ...state.goals.filter((goal) => goal.id !== draft.goal.id)]
      const mergedTasks = [...draft.tasks, ...state.tasks.filter((task) => task.goal_id !== draft.goal.id)]
      const progress = recalcProgress(mergedTasks, draft.goal.id)
      const nextGoal = { ...draft.goal, progress, tasks: draft.tasks }

      return {
        goals: mergedGoals.map((goal) => (goal.id === draft.goal.id ? nextGoal : goal)),
        tasks: mergedTasks,
        schedules: [...draft.schedule, ...state.schedules.filter((item) => item.goalId !== draft.goal.id)],
        selectedGoalId: draft.goal.id,
        draftPlan: { ...draft, goal: nextGoal },
        todayProgress: todayCompletion(state.habits, mergedTasks),
        messages: [
          ...state.messages,
          {
            id: Date.now(),
            role: 'assistant',
            content: {
              type: 'text',
              text: '这版计划已经被纳入你的目标系统，后续可以继续微调。',
            },
            createdAt: nowIso(),
          },
        ],
      }
    })
  },

  modifyPlan: () => {
    const draft = get().draftPlan
    if (!draft) return

    set({
      draftPlan: {
        ...draft,
        goal: {
          ...draft.goal,
          title: `${draft.goal.title}（更稳态）`,
          progress: Math.min(100, draft.goal.progress + 8),
        },
        summary: '已把节奏调得更保守一些，优先降低阻力。',
      },
    })
  },

  regeneratePlan: () => {
    const lastUserMessage = [...get().messages].reverse().find((message) => message.role === 'user')
    const prompt = lastUserMessage?.content.type === 'text' ? lastUserMessage.content.text : '我想推进一个目标'
    const nextDraft = buildPlan(prompt, 'fresh')

    set((state) => ({
      draftPlan: nextDraft,
      selectedGoalId: nextDraft.goal.id,
      messages: [...state.messages, planToMessage(nextDraft)],
    }))
  },

  updateDraftPlan: (updater) => {
    const draft = get().draftPlan
    if (!draft) return

    const nextDraft = updater(draft)
    set((state) => {
      const nextMessages = [...state.messages]
      for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
        const message = nextMessages[index]
        if (message.role === 'assistant' && message.content.type === 'system_plan') {
          nextMessages[index] = planToMessage(nextDraft, message.id)
          break
        }
      }

      return {
        draftPlan: nextDraft,
        messages: nextMessages,
      }
    })
  },

  createGoal: (goal) => {
    const created = makeGoal({
      id: nextId(get().goals, 1000),
      title: goal.title,
      parent_goal_id: goal.parent_goal_id,
      description: goal.description ?? '',
      outcome: goal.outcome ?? '',
      success_criteria: goal.success_criteria ?? [],
      status: goal.status ?? 'active',
      priority: goal.priority ?? 'medium',
      start_date: goal.start_date,
      target_date: goal.target_date,
      review_date: goal.review_date,
      progress: goal.progress ?? 0,
    })

    set((state) => ({
      goals: [created, ...state.goals],
      selectedGoalId: created.id,
    }))

    return created
  },

  updateGoal: (goalId, patch) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === goalId ? { ...goal, ...patch, updated_at: nowIso() } : goal,
      ),
    }))
  },

  deleteGoal: (goalId) => {
    set((state) => {
      const goals = state.goals.filter((goal) => goal.id !== goalId)
      const tasks = state.tasks.filter((task) => task.goal_id !== goalId)
      const schedules = state.schedules.filter((item) => item.goalId !== goalId)

      return {
        goals,
        tasks,
        schedules,
        selectedGoalId: state.selectedGoalId === goalId ? goals[0]?.id ?? null : state.selectedGoalId,
        todayProgress: todayCompletion(state.habits, tasks),
      }
    })
  },

  addSchedule: (schedule) => {
    const created = { ...schedule, id: Date.now() }
    set((state) => ({ schedules: [created, ...state.schedules] }))
    return created
  },

  updateSchedule: (scheduleId, patch) => {
    set((state) => ({
      schedules: state.schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, ...patch } : schedule,
      ),
    }))
  },

  deleteSchedule: (scheduleId) => {
    set((state) => ({
      schedules: state.schedules.filter((schedule) => schedule.id !== scheduleId),
    }))
  },

  createTask: (goalId, task) => {
    const created = makeTask({
      id: nextId(get().tasks, 2000),
      goal_id: goalId,
      title: task.title,
      description: task.description ?? '',
      expected_output: task.expected_output ?? '',
      status: task.status ?? 'todo',
      priority: task.priority ?? 'medium',
      estimated_minutes: task.estimated_minutes ?? 30,
      actual_minutes: task.actual_minutes ?? 0,
      due_date: task.due_date,
      prefer_morning: task.prefer_morning ?? false,
      needs_focus: task.needs_focus ?? false,
      sequence: task.sequence ?? get().tasks.filter((item) => item.goal_id === goalId).length + 1,
      tags: task.tags ?? '',
    })

    set((state) => {
      const tasks = [created, ...state.tasks]
      return {
        tasks,
        goals: recalcGoalProgress(state.goals, tasks, goalId),
        todayProgress: todayCompletion(state.habits, tasks),
      }
    })

    return created
  },

  updateTask: (taskId, patch) => {
    set((state) => {
      const tasks = state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch, updated_at: nowIso() } : task,
      )
      const changed = tasks.find((task) => task.id === taskId)
      const goals = changed?.goal_id != null ? recalcGoalProgress(state.goals, tasks, changed.goal_id) : state.goals

      return {
        tasks,
        goals,
        todayProgress: todayCompletion(state.habits, tasks),
      }
    })
  },

  deleteTask: (taskId) => {
    set((state) => {
      const task = state.tasks.find((item) => item.id === taskId)
      const tasks = state.tasks.filter((item) => item.id !== taskId)
      const goals = task?.goal_id != null ? recalcGoalProgress(state.goals, tasks, task.goal_id) : state.goals
      return {
        tasks,
        goals,
        todayProgress: todayCompletion(state.habits, tasks),
      }
    })
  },

  toggleGoalTask: (goalId, taskId) => {
    set((state) => {
      const tasks = state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === 'done' ? ('todo' as TaskStatus) : ('done' as TaskStatus), updated_at: nowIso() }
          : task,
      )
      return {
        tasks,
        goals: recalcGoalProgress(state.goals, tasks, goalId),
        todayProgress: todayCompletion(state.habits, tasks),
      }
    })
  },

  toggleHabit: (habitId) => {
    set((state) => {
      const habits = state.habits.map((habit) =>
        habit.id === habitId
          ? { ...habit, completion: habit.completion ? 0 : 1, streak: habit.completion ? habit.streak : habit.streak + 1 }
          : habit,
      )
      return {
        habits,
        todayProgress: todayCompletion(habits, state.tasks),
      }
    })
  },

  selectGoal: (goalId) => set({ selectedGoalId: goalId }),
}))

export function useSelectedGoal() {
  const selectedGoalId = useRhythmiqStore((state) => state.selectedGoalId)
  const goals = useRhythmiqStore((state) => state.goals)
  return goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null
}
