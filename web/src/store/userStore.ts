import { create } from 'zustand'
import type { User } from '@/types'

const mockUser: User = {
  id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  name: 'Lynn',
  email: 'lynn@rhythmiq.app',
  timezone: 'Asia/Shanghai',
  wake_up_time: '07:30',
  sleep_time: '23:30',
  focus_start: '09:30',
  focus_end: '17:30',
  max_daily_work_hours: 6,
}

interface UserState {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  fetchUser: (id: number) => Promise<void>
  createUser: (data: Partial<User>) => Promise<User>
  updateUser: (id: number, data: Partial<User>) => Promise<void>
}

export const useUserStore = create<UserState>()((set) => ({
  currentUser: mockUser,
  setCurrentUser: (user) => set({ currentUser: user }),
  fetchUser: async () => {
    set({ currentUser: mockUser })
  },
  createUser: async (data) => {
    const user = { ...mockUser, ...data, id: mockUser.id }
    set({ currentUser: user })
    return user
  },
  updateUser: async (_id, data) => {
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...data } : mockUser,
    }))
  },
}))
