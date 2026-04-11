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
export type SubtaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped'

export interface Subtask {
  id: number
  created_at: string
  updated_at: string
  task_id: number
  title: string
  description: string
  status: SubtaskStatus
  priority: TaskPriority
  estimated_minutes: number
  actual_minutes: number
  prefer_window: string
  sequence: number
  depends_on_subtask_id?: number
  llm_generated: boolean
}

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
  subtasks?: Subtask[]
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
