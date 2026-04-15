export type GoalPriority = 'low' | 'medium' | 'high'

export interface GoalOverviewItem {
  id: string
  title: string
  description?: string
  priority: GoalPriority
  progress: number
  currentStage: string
  nextAction: string
  deadline?: string
}

export interface GoalDetailItem extends GoalOverviewItem {
  steps: string[]
  blockers: string[]
  scheduleHints: string[]
}

export interface CreateGoalInput {
  title: string
  description?: string
  priority: GoalPriority
  progress: number
  currentStage: string
  nextAction: string
  deadline?: string
}

function makeId() {
  return `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function createGoalItem(input: CreateGoalInput): GoalDetailItem {
  const title = input.title.trim()
  return {
    id: makeId(),
    title,
    description: input.description?.trim() || '请补充这个目标的背景、边界和完成标准。',
    priority: input.priority,
    progress: Math.max(0, Math.min(100, input.progress)),
    currentStage: input.currentStage.trim() || '正在确定执行节奏',
    nextAction: input.nextAction.trim() || '先写出下一步最小动作。',
    deadline: input.deadline || undefined,
    steps: [
      `把「${title}」拆成 3 个最小执行步骤`,
      '先做最容易启动的一步，建立推进感',
      '今天结束前确认下一次检查点',
    ],
    blockers: ['信息太多，暂时不确定优先级', '没有把下一步缩小到能立即开始'],
    scheduleHints: ['把高强度动作放到最稳的时间段', '每周保留一次回顾窗口'],
  }
}

export const initialGoalItems: GoalDetailItem[] = [
  {
    id: 'goal-1',
    title: '建立稳定运动习惯',
    description: '把运动、饮食和恢复串成一个更轻的执行系统。',
    priority: 'high',
    progress: 64,
    currentStage: '保持节奏，避免再增加新目标',
    nextAction: '今晚先完成 30 分钟力量训练，不要补充额外目标。',
    deadline: '2026-05-31',
    steps: ['完成今晚训练', '把明天的饮食安排好', '周末复盘执行感受'],
    blockers: ['容易临时加任务，挤掉运动时间', '恢复和睡眠没有完全固定下来'],
    scheduleHints: ['把训练放进晚间固定时段', '留出 15 分钟恢复缓冲'],
  },
  {
    id: 'goal-2',
    title: '推进产品学习输出',
    description: '围绕学习、整理和复盘形成稳定输出节奏。',
    priority: 'medium',
    progress: 41,
    currentStage: '整理笔记，准备输出成文',
    nextAction: '先把这周最有价值的 1 篇笔记整理成可发布提纲。',
    deadline: '2026-06-20',
    steps: ['筛选最有价值的笔记', '整理成 3 段提纲', '补充一个可发布的标题'],
    blockers: ['材料分散，没有一个输出模板', '很容易在整理阶段停住'],
    scheduleHints: ['把整理放在上午专注时段', '保留一个晚间轻量复盘窗口'],
  },
  {
    id: 'goal-3',
    title: '优化工作日排布',
    description: '让固定日程、任务和个人恢复更平衡。',
    priority: 'low',
    progress: 100,
    currentStage: '保持现有节奏，定期微调',
    nextAction: '只需保留现有节奏，周五做一次微调检查。',
    deadline: '2026-03-18',
    steps: ['保留现有时间块', '周五做一次回顾', '只调整最明显的冲突项'],
    blockers: ['过度优化容易打断稳定节奏', '新的变更必须尽量少'],
    scheduleHints: ['优先维护固定日程，不要频繁打断', '把复盘固定在周五'],
  },
  {
    id: 'goal-4',
    title: '完成新产品上线准备',
    description: '把未完成的发布事项收束到一个清晰的交付面。',
    priority: 'high',
    progress: 28,
    currentStage: '收敛阻塞项，准备上线',
    nextAction: '先确认发布检查单里剩下的 3 项阻塞项。',
    deadline: '2026-04-19',
    steps: ['确认阻塞项', '补齐发布检查单', '模拟一次完整上线流程'],
    blockers: ['上线前的收尾项容易被琐事打断', '需要非常明确的优先级'],
    scheduleHints: ['把收尾动作集中到连续时间段', '给发布检查留一个专门窗口'],
  },
  {
    id: 'goal-5',
    title: '提升内容复盘效率',
    description: '减少重复劳动，把复盘变成固定模板。',
    priority: 'medium',
    progress: 57,
    currentStage: '模板成型中，等待稳定复用',
    nextAction: '把复盘模板简化成 3 个问题，今晚就能用。',
    deadline: '2026-04-28',
    steps: ['压缩复盘问题数量', '确定固定结构', '先做一次真实复盘'],
    blockers: ['模板太长会降低复盘意愿', '复盘结果没有固定出口'],
    scheduleHints: ['把复盘放到低压力时间段', '优先保证模板足够短'],
  },
  {
    id: 'goal-6',
    title: '搭建周计划节奏',
    description: '把周计划固定成可重复的决策流程。',
    priority: 'high',
    progress: 18,
    currentStage: '正在定义周计划规则',
    nextAction: '先写出“本周只做什么”的一句话原则。',
    deadline: '2026-04-17',
    steps: ['写出本周原则', '确定 3 个优先动作', '安排第一次周复盘'],
    blockers: ['如果没有规则，就会变成随机选任务', '很容易被临时事项冲掉'],
    scheduleHints: ['把周计划放在周一早晨', '复盘固定在周五收尾前'],
  },
]
