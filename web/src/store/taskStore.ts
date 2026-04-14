import { create } from 'zustand'
import type { Subtask, Task } from '@/types'
import {
  taskApi,
  type CreateSubtaskPayload,
  type CreateTaskPayload,
  type UpdateSubtaskPayload,
  type UpdateTaskPayload,
} from '@/api'

interface TaskState {
  tasks: Task[]
  loading: boolean
  fetchTasks: (userID: number) => Promise<void>
  createTask: (userID: number, data: CreateTaskPayload) => Promise<Task>
  updateTask: (id: number, data: UpdateTaskPayload) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  createSubtask: (taskID: number, data: CreateSubtaskPayload) => Promise<Subtask>
  updateSubtask: (id: number, data: UpdateSubtaskPayload) => Promise<void>
  decomposeTask: (taskID: number) => Promise<Task>
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

  createSubtask: async (taskID, data) => {
    const subtask = await taskApi.createSubtask(taskID, data)
    set({
      tasks: get().tasks.map((task) =>
        task.id === taskID
          ? { ...task, subtasks: [...(task.subtasks ?? []), subtask] }
          : task,
      ),
    })
    return subtask
  },

  updateSubtask: async (id, data) => {
    const updated = await taskApi.updateSubtask(id, data)
    set({
      tasks: get().tasks.map((task) => ({
        ...task,
        subtasks: (task.subtasks ?? []).map((subtask) => (subtask.id === id ? updated : subtask)),
      })),
    })
  },

  decomposeTask: async (taskID) => {
    const task = await taskApi.decompose(taskID)
    set({ tasks: get().tasks.map((item) => (item.id === task.id ? task : item)) })
    return task
  },
}))
