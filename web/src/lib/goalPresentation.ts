import type { Goal, GoalStatus } from '@/types'

export interface GoalCardView {
  id: number
  title: string
  description?: string
  priority: Goal['priority']
  progress: number
  currentStage: string
  nextAction: string
  deadline?: string
  status: GoalStatus
}

export interface GoalDetailView extends GoalCardView {
  steps: string[]
  blockers: string[]
  scheduleHints: string[]
  taskCount: number
}

function formatTaskTitle(title: string) {
  const trimmed = title.trim()
  return trimmed.endsWith('。') ? trimmed : `${trimmed}`
}

export function getGoalCurrentStage(goal: Goal) {
  if (goal.status === 'completed' || goal.progress >= 100) return '已完成'
  if (goal.status === 'archived') return '已归档'
  if (goal.progress >= 80) return '收尾阶段'
  if (goal.progress >= 50) return '稳定推进'
  if (goal.progress >= 20) return '正在建立节奏'
  return '刚开始启动'
}

export function getGoalNextAction(goal: Goal) {
  const firstTask = goal.tasks?.find((task) => task.title.trim())
  if (goal.status === 'completed') {
    return '保持当前结果，并把经验沉淀成下一轮规则。'
  }

  if (firstTask) {
    return `先推进：${formatTaskTitle(firstTask.title)}`
  }

  if (goal.progress >= 80) {
    return '优先完成收尾动作，避免把交付拖长。'
  }

  if (goal.progress >= 50) {
    return '确认当前阶段最关键的一步，然后继续推进。'
  }

  return `把「${goal.title}」缩小成一个 15 分钟内可以开始的动作。`
}

export function getGoalSteps(goal: Goal) {
  const taskTitles = goal.tasks?.map((task) => task.title.trim()).filter(Boolean) ?? []
  if (taskTitles.length > 0) {
    return taskTitles.slice(0, 3)
  }

  return [
    '明确目标边界和完成标准',
    '找出最小的下一步动作',
    '安排一个可检查的回顾点',
  ]
}

export function getGoalBlockers(goal: Goal) {
  const blockers: string[] = []

  if (goal.status === 'active' && goal.progress < 30) {
    blockers.push('当前还处在启动阶段，容易被其他事情打断。')
  }

  if (goal.deadline) {
    blockers.push('需要注意截止时间，避免把关键动作留到最后。')
  } else {
    blockers.push('没有明确截止日期时，推进节奏容易变慢。')
  }

  blockers.push('如果下一步动作太大，执行意愿会明显下降。')

  return blockers.slice(0, 3)
}

export function getGoalScheduleHints(goal: Goal) {
  const hints: string[] = []

  if (goal.priority === 'high') {
    hints.push('把这个目标放到最稳的专注时间段。')
  } else {
    hints.push('给这个目标保留一段固定的推进窗口。')
  }

  if (goal.progress >= 70) {
    hints.push('优先安排收尾和检查，而不是再拆新工作。')
  } else {
    hints.push('先把今天能开始的一步排进去。')
  }

  return hints.slice(0, 2)
}

export function buildGoalCardView(goal: Goal): GoalCardView {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    priority: goal.priority,
    progress: goal.progress,
    currentStage: getGoalCurrentStage(goal),
    nextAction: getGoalNextAction(goal),
    deadline: goal.deadline,
    status: goal.status,
  }
}

export function buildGoalDetailView(goal: Goal): GoalDetailView {
  return {
    ...buildGoalCardView(goal),
    steps: getGoalSteps(goal),
    blockers: getGoalBlockers(goal),
    scheduleHints: getGoalScheduleHints(goal),
    taskCount: goal.tasks?.length ?? 0,
  }
}
