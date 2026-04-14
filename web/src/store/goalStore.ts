import { create } from 'zustand'
import type { Goal } from '@/types'
import { goalApi, type CreateGoalPayload, type GenerateGoalPayload, type UpdateGoalPayload } from '@/api'

interface GoalState {
  goals: Goal[]
  loading: boolean
  fetchGoals: (userID: number) => Promise<void>
  createGoal: (userID: number, data: CreateGoalPayload) => Promise<Goal>
  generateGoal: (userID: number, data: GenerateGoalPayload) => Promise<Goal>
  updateGoal: (id: number, data: UpdateGoalPayload) => Promise<void>
  deleteGoal: (id: number) => Promise<void>
}

export const useGoalStore = create<GoalState>()((set, get) => ({
  goals: [],
  loading: false,

  fetchGoals: async (userID) => {
    set({ loading: true })
    try {
      const goals = await goalApi.list(userID)
      set({ goals: goals ?? [] })
    } finally {
      set({ loading: false })
    }
  },

  createGoal: async (userID, data) => {
    const goal = await goalApi.create(userID, data)
    set({ goals: [goal, ...get().goals] })
    return goal
  },

  generateGoal: async (userID, data) => {
    const goal = await goalApi.generate(userID, data)
    set({ goals: [goal, ...get().goals] })
    return goal
  },

  updateGoal: async (id, data) => {
    const updated = await goalApi.update(id, data)
    set({ goals: get().goals.map((g) => (g.id === id ? updated : g)) })
  },

  deleteGoal: async (id) => {
    await goalApi.delete(id)
    set({ goals: get().goals.filter((g) => g.id !== id) })
  },
}))
