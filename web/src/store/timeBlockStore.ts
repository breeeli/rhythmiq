import { create } from 'zustand'
import { timeBlockApi, type TimeBlock as ApiTimeBlock, type TimeBlockPayload, type TimeBlockRecurrenceType } from '@/api/timeBlock'

export type RecurrenceType = TimeBlockRecurrenceType
export type TimeBlock = ApiTimeBlock

interface TimeBlockState {
  timeBlocks: TimeBlock[]
  loading: boolean
  fetchTimeBlocks: (userID: number) => Promise<void>
  createTimeBlock: (userID: number, payload: TimeBlockPayload) => Promise<TimeBlock>
  updateTimeBlock: (id: number, payload: TimeBlockPayload) => Promise<TimeBlock>
  deleteTimeBlock: (id: number) => Promise<void>
}

export const useTimeBlockStore = create<TimeBlockState>()((set, get) => ({
  timeBlocks: [],
  loading: false,

  fetchTimeBlocks: async (userID) => {
    set({ loading: true })
    try {
      const timeBlocks = await timeBlockApi.list(userID)
      set({ timeBlocks: timeBlocks ?? [] })
    } finally {
      set({ loading: false })
    }
  },

  createTimeBlock: async (userID, payload) => {
    const timeBlock = await timeBlockApi.create(userID, payload)
    set({ timeBlocks: [...get().timeBlocks, timeBlock] })
    return timeBlock
  },

  updateTimeBlock: async (id, payload) => {
    const timeBlock = await timeBlockApi.update(id, payload)
    set({ timeBlocks: get().timeBlocks.map((item) => (item.id === id ? timeBlock : item)) })
    return timeBlock
  },

  deleteTimeBlock: async (id) => {
    await timeBlockApi.delete(id)
    set({ timeBlocks: get().timeBlocks.filter((item) => item.id !== id) })
  },
}))
