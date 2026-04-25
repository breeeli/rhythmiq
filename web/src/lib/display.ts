import type {
  GoalPriority,
  GoalStatus,
  HabitTimePreference,
  PlanStatus,
  ScheduleRuleKind,
  TaskPriority,
  TaskStatus,
  TimeBlockType,
} from '@/types'

const weekdayLabels: Record<string, string> = {
  mon: '周一',
  tue: '周二',
  wed: '周三',
  thu: '周四',
  fri: '周五',
  sat: '周六',
  sun: '周日',
}

const goalStatusLabels: Record<GoalStatus, string> = {
  draft: '草稿',
  active: '进行中',
  completed: '已完成',
  archived: '已归档',
  abandoned: '已废弃',
}

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
  skipped: '已跳过',
}

const priorityLabels: Record<GoalPriority | TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const planStatusLabels: Record<PlanStatus, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
}

const timeBlockTypeLabels: Record<TimeBlockType, string> = {
  work: '工作',
  break: '休息',
  personal: '个人',
  buffer: '缓冲',
}

const scheduleRuleKindLabels: Record<ScheduleRuleKind, string> = {
  blocked: '不可占用',
  fixed: '固定安排',
}

const habitTimeLabels: Record<HabitTimePreference, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
  any: '任意时段',
}

const focusTagLabels: Record<string, string> = {
  work: '工作',
  learning: '学习',
  project: '项目',
}

export function labelWeekday(day: string) {
  return weekdayLabels[day] ?? day
}

export function formatWeekdays(days: string[]) {
  return days.map(labelWeekday).join('、')
}

export function labelGoalStatus(status: GoalStatus) {
  return goalStatusLabels[status]
}

export function labelTaskStatus(status: TaskStatus) {
  return taskStatusLabels[status]
}

export function labelPriority(priority: GoalPriority | TaskPriority) {
  return priorityLabels[priority]
}

export function labelPlanStatus(status: PlanStatus) {
  return planStatusLabels[status]
}

export function labelTimeBlockType(type: TimeBlockType) {
  return timeBlockTypeLabels[type]
}

export function labelScheduleRuleKind(kind: ScheduleRuleKind) {
  return scheduleRuleKindLabels[kind]
}

export function labelHabitTimePreference(preference: HabitTimePreference) {
  return habitTimeLabels[preference]
}

export function labelTimeWindow(window: string) {
  return habitTimeLabels[window as HabitTimePreference] ?? window
}

export function labelFocusTag(tag: string) {
  return focusTagLabels[tag] ?? tag
}

export function formatChineseDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString('zh-CN', options)
}
