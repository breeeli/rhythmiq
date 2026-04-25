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

export type GoalStatus = 'draft' | 'active' | 'completed' | 'archived' | 'abandoned'
export type GoalSource = 'manual' | 'llm'
export type GoalPriority = 'high' | 'medium' | 'low'

export interface Goal {
  id: number
  created_at: string
  updated_at: string
  user_id: number
  parent_goal_id?: number
  title: string
  description: string
  status: GoalStatus
  source: GoalSource
  priority: GoalPriority
  deadline?: string
  start_date?: string
  target_date?: string
  review_date?: string
  outcome: string
  success_criteria: string[]
  motivation: string
  progress: number
  child_goals?: Goal[]
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
  expected_output: string
  status: TaskStatus
  priority: TaskPriority
  estimated_minutes: number
  actual_minutes: number
  due_date?: string
  prefer_morning: boolean
  needs_focus: boolean
  sequence: number
  tags: string
}

export type PlanStatus = 'draft' | 'confirmed' | 'completed'
export type TimeBlockType = 'work' | 'break' | 'personal' | 'buffer'
export type ScheduleRuleKind = 'fixed' | 'blocked'
export type HabitTimePreference = 'morning' | 'afternoon' | 'evening' | 'any'
export type PlanBlockSourceType =
  | 'schedule_rule'
  | 'habit_rule'
  | 'anchored_item'
  | 'task'
  | 'context_item'
  | 'system_review'

export interface ScheduleRule {
  id: number
  created_at: string
  updated_at: string
  user_id: number
  title: string
  kind: ScheduleRuleKind
  start_time: string
  end_time: string
  days: string[]
  locked: boolean
}

export interface HabitRule {
  id: number
  created_at: string
  updated_at: string
  user_id: number
  title: string
  duration_minutes: number
  days: string[]
  preferred_time: HabitTimePreference
  preferred_start: string
  required: boolean
}

export interface PlanningConstraints {
  schedule_rules: ScheduleRule[]
  habit_rules: HabitRule[]
}

export interface AnchoredPlanningItem {
  title: string
  date: string
  start_time: string
  end_time: string
  note: string
}

export interface FocusPlanningItem {
  title: string
  description: string
  estimated_minutes: number
  tag: string
  priority: string
  prefer_window: string
}

export interface TimeBlock {
  id: number
  plan_id: number
  task_id?: number
  type: TimeBlockType
  title: string
  start_time: string
  end_time: string
  note: string
  description: string
  goal: string
  expected_output: string
  source_type: PlanBlockSourceType
  is_locked: boolean
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
  context: string
  time_blocks: TimeBlock[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
