import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { userApi, type CreateUserPayload, type UpdateUserPayload } from '@/api'

interface UserState {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  fetchUser: (id: number) => Promise<void>
  createUser: (data: CreateUserPayload) => Promise<User>
  updateUser: (id: number, data: UpdateUserPayload) => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,

      setCurrentUser: (user) => set({ currentUser: user }),

      fetchUser: async (id) => {
        const user = await userApi.getById(id)
        set({ currentUser: user })
      },

      createUser: async (data) => {
        const user = await userApi.create(data)
        set({ currentUser: user })
        return user
      },

      updateUser: async (id, data) => {
        const user = await userApi.update(id, data)
        set({ currentUser: user })
      },
    }),
    { name: 'rhythmiq-user' },
  ),
)
