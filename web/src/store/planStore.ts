import { create } from 'zustand'
import type {
  DailyPlan,
  HabitRule,
  PlanningConstraints,
  ScheduleRule,
} from '@/types'
import {
  planApi,
  planningConstraintsApi,
  type GeneratePlanPayload,
  type HabitRulePayload,
  type ScheduleRulePayload,
} from '@/api'

interface PlanState {
  targetPlan: DailyPlan | null
  constraints: PlanningConstraints
  loading: boolean
  error: string | null
  fetchPlan: (userID: number, date?: string) => Promise<void>
  generatePlan: (userID: number, payload: GeneratePlanPayload) => Promise<void>
  confirmPlan: (planID: number) => Promise<void>
  fetchConstraints: (userID: number) => Promise<void>
  createScheduleRule: (userID: number, payload: ScheduleRulePayload) => Promise<ScheduleRule>
  deleteScheduleRule: (id: number, userID: number) => Promise<void>
  createHabitRule: (userID: number, payload: HabitRulePayload) => Promise<HabitRule>
  deleteHabitRule: (id: number, userID: number) => Promise<void>
  clearError: () => void
}

const emptyConstraints: PlanningConstraints = {
  schedule_rules: [],
  habit_rules: [],
}

export const usePlanStore = create<PlanState>()((set) => ({
  targetPlan: null,
  constraints: emptyConstraints,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchPlan: async (userID, date) => {
    set({ loading: true, error: null })
    try {
      const plan = await planApi.byDate(userID, date)
      set({ targetPlan: plan })
    } catch (error) {
      const message = (error as Error).message
      set({ targetPlan: null, error: message === 'plan not found' ? null : message })
    } finally {
      set({ loading: false })
    }
  },

  generatePlan: async (userID, payload) => {
    set({ loading: true, error: null })
    try {
      const plan = await planApi.generate(userID, payload)
      set({ targetPlan: plan })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  confirmPlan: async (planID) => {
    const plan = await planApi.confirm(planID)
    set({ targetPlan: plan })
  },

  fetchConstraints: async (userID) => {
    set({ loading: true, error: null })
    try {
      const constraints = await planningConstraintsApi.list(userID)
      set({ constraints })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  createScheduleRule: async (userID, payload) => {
    const rule = await planningConstraintsApi.createScheduleRule(userID, payload)
    set((state) => ({
      constraints: {
        ...state.constraints,
        schedule_rules: [...state.constraints.schedule_rules, rule],
      },
    }))
    return rule
  },

  deleteScheduleRule: async (id, userID) => {
    await planningConstraintsApi.deleteScheduleRule(id)
    const constraints = await planningConstraintsApi.list(userID)
    set({ constraints })
  },

  createHabitRule: async (userID, payload) => {
    const rule = await planningConstraintsApi.createHabitRule(userID, payload)
    set((state) => ({
      constraints: {
        ...state.constraints,
        habit_rules: [...state.constraints.habit_rules, rule],
      },
    }))
    return rule
  },

  deleteHabitRule: async (id, userID) => {
    await planningConstraintsApi.deleteHabitRule(id)
    const constraints = await planningConstraintsApi.list(userID)
    set({ constraints })
  },
}))
