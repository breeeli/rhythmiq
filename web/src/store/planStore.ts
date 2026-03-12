import { create } from 'zustand'
import type { DailyPlan } from '@/types'
import { planApi } from '@/api'

interface PlanState {
  todayPlan: DailyPlan | null
  loading: boolean
  fetchToday: (userID: number) => Promise<void>
  generatePlan: (userID: number, hint?: string) => Promise<void>
  confirmPlan: (planID: number) => Promise<void>
}

export const usePlanStore = create<PlanState>()((set) => ({
  todayPlan: null,
  loading: false,

  fetchToday: async (userID) => {
    set({ loading: true })
    try {
      const plan = await planApi.today(userID)
      set({ todayPlan: plan })
    } finally {
      set({ loading: false })
    }
  },

  generatePlan: async (userID, hint) => {
    set({ loading: true })
    try {
      const plan = await planApi.generate(userID, { hint })
      set({ todayPlan: plan })
    } finally {
      set({ loading: false })
    }
  },

  confirmPlan: async (planID) => {
    const plan = await planApi.confirm(planID)
    set({ todayPlan: plan })
  },
}))
