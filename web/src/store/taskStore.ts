import { create } from 'zustand'
import type { Task } from '@/types'
import { taskApi, type CreateTaskPayload, type UpdateTaskPayload } from '@/api'

interface TaskState {
  tasks: Task[]
  loading: boolean
  fetchTasks: (userID: number) => Promise<void>
  createTask: (userID: number, data: CreateTaskPayload) => Promise<Task>
  updateTask: (id: number, data: UpdateTaskPayload) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (userID) => {
    set({ loading: true })
    try {
      const tasks = await taskApi.list(userID)
      set({ tasks: tasks ?? [] })
    } finally {
      set({ loading: false })
    }
  },

  createTask: async (userID, data) => {
    const task = await taskApi.create(userID, data)
    set({ tasks: [task, ...get().tasks] })
    return task
  },

  updateTask: async (id, data) => {
    const updated = await taskApi.update(id, data)
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
  },

  deleteTask: async (id) => {
    await taskApi.delete(id)
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
  },
}))
