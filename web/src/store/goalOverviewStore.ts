import { create } from 'zustand'
import { createGoalItem, initialGoalItems, type CreateGoalInput, type GoalDetailItem } from '@/data/goalMockData'

interface GoalOverviewState {
  goals: GoalDetailItem[]
  addGoal: (input: CreateGoalInput) => GoalDetailItem
  updateGoal: (goalId: string, patch: Partial<GoalDetailItem>) => void
}

export const useGoalOverviewStore = create<GoalOverviewState>()((set) => ({
  goals: initialGoalItems,

  addGoal: (input) => {
    const created = createGoalItem(input)
    set((state) => ({ goals: [created, ...state.goals] }))
    return created
  },

  updateGoal: (goalId, patch) => {
    set((state) => ({
      goals: state.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)),
    }))
  },
}))
