import { create } from 'zustand'
import type { Goal } from '@/types'
import { goalApi, type CreateGoalPayload, type GenerateGoalPayload, type UpdateGoalPayload } from '@/api'

interface GoalState {
  goals: Goal[]
  loading: boolean
  error: string | null
  fetchGoals: (userID: number) => Promise<void>
  fetchGoalById: (id: number) => Promise<Goal>
  createGoal: (userID: number, data: CreateGoalPayload) => Promise<Goal>
  generateGoal: (userID: number, data: GenerateGoalPayload) => Promise<Goal>
  updateGoal: (id: number, data: UpdateGoalPayload) => Promise<Goal>
  deleteGoal: (id: number) => Promise<void>
}

export const useGoalStore = create<GoalState>()((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async (userID) => {
    set({ loading: true, error: null })
    try {
      const goals = await goalApi.list(userID)
      set({ goals: goals ?? [] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载目标失败' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchGoalById: async (id) => {
    set({ loading: true, error: null })
    try {
      const goal = await goalApi.getById(id)
      set((state) => {
        const exists = state.goals.some((item) => item.id === goal.id)
        return {
          goals: exists ? state.goals.map((item) => (item.id === goal.id ? goal : item)) : [goal, ...state.goals],
        }
      })
      return goal
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载目标失败' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  createGoal: async (userID, data) => {
    set({ error: null })
    try {
      const goal = await goalApi.create(userID, data)
      set({ goals: [goal, ...get().goals] })
      return goal
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建目标失败' })
      throw error
    }
  },

  generateGoal: async (userID, data) => {
    set({ error: null })
    try {
      const goal = await goalApi.generate(userID, data)
      set({ goals: [goal, ...get().goals] })
      return goal
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '生成目标失败' })
      throw error
    }
  },

  updateGoal: async (id, data) => {
    set({ error: null })
    try {
      const updated = await goalApi.update(id, data)
      set({ goals: get().goals.map((g) => (g.id === id ? updated : g)) })
      return updated
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新目标失败' })
      throw error
    }
  },

  deleteGoal: async (id) => {
    set({ error: null })
    try {
      await goalApi.delete(id)
      set({ goals: get().goals.filter((g) => g.id !== id) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除目标失败' })
      throw error
    }
  },
}))
