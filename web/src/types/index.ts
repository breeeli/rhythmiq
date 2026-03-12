export interface User {
  id: number
  created_at: string
  updated_at: string
  name: string
  email: string
  timezone: string
  wake_up_time: string
  sleep_time: string
  focus_start: string
  focus_end: string
  max_daily_work_hours: number
}

export type GoalStatus = 'active' | 'completed' | 'archived'
export type GoalPriority = 'high' | 'medium' | 'low'
export type GoalType = 'long_term' | 'short_term'

export interface Goal {
  id: number
  created_at: string
  updated_at: string
  user_id: number
  title: string
  description: string
  type: GoalType
  status: GoalStatus
  priority: GoalPriority
  deadline?: string
  progress: number
  tasks?: Task[]
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: number
  created_at: string
  updated_at: string
  user_id: number
  goal_id?: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  estimated_minutes: number
  actual_minutes: number
  due_date?: string
  prefer_morning: boolean
  needs_focus: boolean
  tags: string
}

export type PlanStatus = 'draft' | 'confirmed' | 'completed'
export type TimeBlockType = 'work' | 'break' | 'personal' | 'buffer'

export interface TimeBlock {
  id: number
  plan_id: number
  task_id?: number
  type: TimeBlockType
  title: string
  start_time: string
  end_time: string
  note: string
  done: boolean
  task?: Task
}

export interface DailyPlan {
  id: number
  created_at: string
  updated_at: string
  user_id: number
  date: string
  status: PlanStatus
  summary: string
  time_blocks: TimeBlock[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
