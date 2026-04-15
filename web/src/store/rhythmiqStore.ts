import { create } from 'zustand'
import type { Goal, GoalPriority, GoalType, Subtask, Task, TaskStatus } from '@/types'

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
type SubtaskDraft = Partial<Subtask> & Pick<Subtask, 'title'>
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
    description: '',
    type: 'short_term',
    status: 'active',
    priority: 'medium',
    progress: 0,
    ...overrides,
  }
}

function makeSubtask(overrides: Partial<Subtask> & Pick<Subtask, 'id' | 'task_id' | 'title'>): Subtask {
  return {
    created_at: nowIso(),
    updated_at: nowIso(),
    description: '',
    status: 'todo',
    priority: 'medium',
    estimated_minutes: 15,
    actual_minutes: 0,
    prefer_window: 'any',
    sequence: 1,
    llm_generated: false,
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title' | 'goal_id'>): Task {
  return {
    created_at: nowIso(),
    updated_at: nowIso(),
    user_id: 1,
    description: '',
    status: 'todo',
    priority: 'medium',
    estimated_minutes: 30,
    actual_minutes: 0,
    prefer_morning: false,
    needs_focus: false,
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
          type: 'short_term' as GoalType,
        }
      : text.includes('学习')
        ? {
            title: '推进学习与输出系统',
            description: '围绕学习、复盘和输出建立可持续节奏。',
            priority: 'medium' as GoalPriority,
            type: 'short_term' as GoalType,
          }
        : {
            title: '推进核心目标系统',
            description: '把目标拆成可执行的任务与日程安排。',
            priority: 'medium' as GoalPriority,
            type: 'short_term' as GoalType,
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
    type: theme.type,
    priority: theme.priority,
    status: 'active',
    progress: modifier === 'refine' ? 42 : 35,
    deadline: scheduleWeek[6].toISOString().slice(0, 10),
  })

  const tasks = taskSeed.map((label, index) =>
    makeTask({
      id: goalId * 10 + index + 1,
      goal_id: goalId,
      title: label,
      description: modifier === 'refine' ? '调整为更低阻力的执行方式。' : '自动生成的执行步骤。',
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      estimated_minutes: 20 + index * 15,
      prefer_morning: index < 2,
      status: index === 0 ? 'in_progress' : 'todo',
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
    start: `${8 + index}:30`,
    end: `${9 + index}:30`,
    title: tasks[index % tasks.length].title,
    kind: index === 1 ? 'habit' : index === 3 ? 'routine' : 'task',
    goalId,
    taskId: tasks[index % tasks.length].id,
    note: index === 1 ? '稳定习惯窗口' : '节奏块',
  }))

  return {
    goal,
    summary:
      modifier === 'refine'
        ? '已根据你的反馈把节奏收紧，并保留了核心动作。'
        : modifier === 'fresh'
          ? '已重新生成一版更清晰的计划。'
          : '我已经把你的想法拆成了目标、任务和排期。',
    plan,
    tasks,
    schedule,
  }
}

const initialGoals: Goal[] = [
  makeGoal({
    id: 1,
    title: '建立稳定运动习惯',
    description: '把运动、饮食和恢复串成一个持续推进的系统。',
    type: 'short_term',
    priority: 'high',
    status: 'active',
    progress: 64,
    deadline: '2026-05-31',
  }),
  makeGoal({
    id: 2,
    title: '推进产品学习输出',
    description: '围绕学习、整理和复盘形成稳定输出节奏。',
    type: 'short_term',
    priority: 'medium',
    status: 'active',
    progress: 41,
    deadline: '2026-06-20',
  }),
  makeGoal({
    id: 3,
    title: '优化工作日排布',
    description: '让固定日程、任务和个人恢复更平衡。',
    type: 'long_term',
    priority: 'low',
    status: 'archived',
    progress: 100,
    deadline: '2026-03-18',
  }),
]

const initialTasks: Task[] = [
  makeTask({
    id: 11,
    goal_id: 1,
    title: '周一晚间力量训练',
    description: '30 分钟低门槛动作。',
    status: 'done',
    priority: 'high',
    estimated_minutes: 30,
    prefer_morning: false,
    needs_focus: true,
    tags: 'habit',
  }),
  makeTask({
    id: 12,
    goal_id: 1,
    title: '整理一周饮食结构',
    description: '减少选择成本。',
    status: 'in_progress',
    priority: 'medium',
    estimated_minutes: 45,
    prefer_morning: true,
    needs_focus: true,
    tags: 'planning',
    subtasks: [
      makeSubtask({
        id: 121,
        task_id: 12,
        title: '整理早餐模板',
        description: '先压缩最容易犹豫的一餐。',
        priority: 'high',
        estimated_minutes: 15,
        prefer_window: 'morning',
        sequence: 1,
        llm_generated: true,
      }),
      makeSubtask({
        id: 122,
        task_id: 12,
        title: '确认午晚餐采购清单',
        description: '减少临时决策。',
        priority: 'medium',
        estimated_minutes: 20,
        prefer_window: 'afternoon',
        sequence: 2,
        llm_generated: true,
      }),
    ],
  }),
  makeTask({
    id: 13,
    goal_id: 1,
    title: '周末长距离步行',
    description: '提升恢复和耐力。',
    status: 'todo',
    priority: 'low',
    estimated_minutes: 60,
    prefer_morning: true,
    needs_focus: false,
    tags: 'outdoor',
  }),
  makeTask({
    id: 21,
    goal_id: 2,
    title: '阅读并输出一个主题',
    description: '形成可复用笔记。',
    status: 'todo',
    priority: 'high',
    estimated_minutes: 50,
    prefer_morning: true,
    needs_focus: true,
    tags: 'learning',
    subtasks: [
      makeSubtask({
        id: 211,
        task_id: 21,
        title: '挑选主题与资料',
        priority: 'high',
        estimated_minutes: 20,
        prefer_window: 'morning',
        sequence: 1,
        llm_generated: true,
      }),
      makeSubtask({
        id: 212,
        task_id: 21,
        title: '输出一页摘要',
        priority: 'medium',
        estimated_minutes: 30,
        prefer_window: 'afternoon',
        sequence: 2,
        llm_generated: true,
      }),
    ],
  }),
  makeTask({
    id: 22,
    goal_id: 2,
    title: '整理学习卡片',
    description: '把零散材料归档。',
    status: 'done',
    priority: 'medium',
    estimated_minutes: 25,
    prefer_morning: false,
    needs_focus: false,
    tags: 'review',
  }),
  makeTask({
    id: 23,
    goal_id: 2,
    title: '复盘本周成果',
    description: '保持输出闭环。',
    status: 'todo',
    priority: 'medium',
    estimated_minutes: 30,
    prefer_morning: false,
    needs_focus: true,
    tags: 'review',
  }),
]

const initialHabits: Habit[] = [
  { id: 1, name: '早起冥想', streak: 12, completion: 1, active: true, category: 'habit' },
  { id: 2, name: '晚间复盘', streak: 7, completion: 1, active: true, category: 'habit' },
  { id: 3, name: '午间散步', streak: 3, completion: 0, active: true, category: 'routine' },
  { id: 4, name: '固定拉伸', streak: 18, completion: 1, active: false, category: 'habit' },
]

const initialSchedules: ScheduleItem[] = [
  { id: 1, day: 'mon', start: '09:00', end: '10:00', title: '周例会', kind: 'routine', note: '固定日程' },
  { id: 2, day: 'mon', start: '18:30', end: '19:00', title: '晚间拉伸', kind: 'habit', note: '每日习惯' },
  { id: 3, day: 'tue', start: '08:30', end: '09:30', title: '深度工作块', kind: 'task', goalId: 1, taskId: 12, note: '推进目标' },
  { id: 4, day: 'wed', start: '12:30', end: '13:00', title: '午间散步', kind: 'habit', note: '恢复节奏' },
  { id: 5, day: 'thu', start: '15:00', end: '16:30', title: '研究与整理', kind: 'task', goalId: 2, taskId: 21, note: '目标推进' },
  { id: 6, day: 'fri', start: '10:00', end: '11:00', title: '固定复盘会', kind: 'routine', note: '周固定安排' },
]

const initialMessages: AgentMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content: {
      type: 'text',
      text: '我会先帮你把想法整理成目标、计划、任务和排期，然后再放进你的习惯系统里。',
    },
    createdAt: nowIso(),
  },
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
  createSubtask: (taskId: number, subtask: SubtaskDraft) => Subtask
  updateSubtask: (subtaskId: number, patch: Partial<Subtask>) => void
  deleteSubtask: (subtaskId: number) => void
  decomposeTask: (taskId: number) => Subtask[]
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

function removeTaskSubtask(tasks: Task[], subtaskId: number) {
  return tasks.map((task) => ({
    ...task,
    subtasks: (task.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId),
  }))
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
  draftPlan: buildPlan('我想优化我的节奏'),
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
      const nextDraft = {
        ...draft,
        goal: { ...draft.goal, progress, tasks: draft.tasks },
      }

      return {
        goals: mergedGoals.map((goal) => (goal.id === draft.goal.id ? nextDraft.goal : goal)),
        tasks: mergedTasks,
        schedules: [...draft.schedule, ...state.schedules.filter((item) => item.goalId !== draft.goal.id)],
        selectedGoalId: draft.goal.id,
        draftPlan: nextDraft,
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
      description: goal.description ?? '',
      type: goal.type ?? 'short_term',
      status: goal.status ?? 'active',
      priority: goal.priority ?? 'medium',
      deadline: goal.deadline,
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
        goal.id === goalId
          ? {
              ...goal,
              ...patch,
              updated_at: nowIso(),
            }
          : goal,
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
    set((state) => ({
      schedules: [created, ...state.schedules],
    }))
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
      status: task.status ?? 'todo',
      priority: task.priority ?? 'medium',
      estimated_minutes: task.estimated_minutes ?? 30,
      actual_minutes: task.actual_minutes ?? 0,
      due_date: task.due_date,
      prefer_morning: task.prefer_morning ?? false,
      needs_focus: task.needs_focus ?? false,
      tags: task.tags ?? '',
      subtasks: task.subtasks,
    })

    set((state) => ({
      tasks: [created, ...state.tasks],
      goals: recalcGoalProgress(state.goals, [created, ...state.tasks], goalId),
      todayProgress: todayCompletion(state.habits, [created, ...state.tasks]),
    }))

    return created
  },

  updateTask: (taskId, patch) => {
    set((state) => {
      const tasks = state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
              updated_at: nowIso(),
            }
          : task,
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

  createSubtask: (taskId, subtask) => {
    const created = makeSubtask({
      id: nextId(get().tasks.flatMap((task) => task.subtasks ?? []), 5000),
      task_id: taskId,
      title: subtask.title,
      description: subtask.description ?? '',
      status: subtask.status ?? 'todo',
      priority: subtask.priority ?? 'medium',
      estimated_minutes: subtask.estimated_minutes ?? 15,
      actual_minutes: subtask.actual_minutes ?? 0,
      prefer_window: subtask.prefer_window ?? 'any',
      sequence: subtask.sequence ?? (get().tasks.find((task) => task.id === taskId)?.subtasks?.length ?? 0) + 1,
      depends_on_subtask_id: subtask.depends_on_subtask_id,
      llm_generated: subtask.llm_generated ?? false,
    })

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [...(task.subtasks ?? []), created],
              updated_at: nowIso(),
            }
          : task,
      ),
    }))

    return created
  },

  updateSubtask: (subtaskId, patch) => {
    set((state) => {
      const tasks = state.tasks.map((task) => ({
        ...task,
        subtasks: (task.subtasks ?? []).map((subtask) =>
          subtask.id === subtaskId
            ? {
                ...subtask,
                ...patch,
                updated_at: nowIso(),
              }
            : subtask,
        ),
      }))

      const owningTask = tasks.find((task) => (task.subtasks ?? []).some((subtask) => subtask.id === subtaskId))
      const goals =
        owningTask?.goal_id != null ? recalcGoalProgress(state.goals, tasks, owningTask.goal_id) : state.goals

      return {
        tasks,
        goals,
      }
    })
  },

  deleteSubtask: (subtaskId) => {
    set((state) => {
      const task = state.tasks.find((item) => (item.subtasks ?? []).some((subtask) => subtask.id === subtaskId))
      const tasks = removeTaskSubtask(state.tasks, subtaskId)
      const goals = task?.goal_id != null ? recalcGoalProgress(state.goals, tasks, task.goal_id) : state.goals

      return {
        tasks,
        goals,
      }
    })
  },

  decomposeTask: (taskId) => {
    const task = get().tasks.find((item) => item.id === taskId)
    if (!task) return []

    const seed = task.title.replace(/[：:]/g, ' ').trim()
    const subtasks = [
      `${seed} - 梳理范围`,
      `${seed} - 形成执行动作`,
      `${seed} - 检查完成条件`,
    ]

    const created = subtasks.map((title, index) =>
      makeSubtask({
        id: nextId(get().tasks.flatMap((item) => item.subtasks ?? []), 6000) + index,
        task_id: taskId,
        title,
        description: index === 0 ? '先收窄问题边界。' : index === 1 ? '把动作拆到更小颗粒度。' : '确认什么算完成。',
        priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
        estimated_minutes: 10 + index * 10,
        prefer_window: index === 0 ? 'morning' : index === 1 ? 'afternoon' : 'any',
        sequence: index + 1,
        llm_generated: true,
      }),
    )

    set((state) => {
      const tasks = state.tasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              subtasks: [...(item.subtasks ?? []), ...created],
              updated_at: nowIso(),
            }
          : item,
      )

      return {
        tasks,
        goals: task.goal_id != null ? recalcGoalProgress(state.goals, tasks, task.goal_id) : state.goals,
      }
    })

    return created
  },

  toggleGoalTask: (goalId, taskId) => {
    set((state) => {
      const tasks = state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'done' ? ('todo' as TaskStatus) : ('done' as TaskStatus),
              updated_at: nowIso(),
            }
          : task,
      )

      return {
        tasks,
        goals: state.goals.map((goal) =>
          goal.id === goalId ? { ...goal, progress: recalcProgress(tasks, goalId), updated_at: nowIso() } : goal,
        ),
        todayProgress: todayCompletion(state.habits, tasks),
      }
    })
  },

  toggleHabit: (habitId) => {
    set((state) => {
      const habits = state.habits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              completion: habit.completion ? 0 : 1,
              streak: habit.completion ? habit.streak : habit.streak + 1,
            }
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
