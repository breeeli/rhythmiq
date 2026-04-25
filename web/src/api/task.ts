import http from './http'
import type { ApiResponse, Task, TaskPriority, TaskStatus } from '@/types'

export interface CreateTaskPayload {
  title: string
  description?: string
  expected_output?: string
  goal_id?: number
  status?: TaskStatus
  priority?: TaskPriority
  estimated_minutes?: number
  due_date?: string
  prefer_morning?: boolean
  needs_focus?: boolean
  sequence?: number
  tags?: string
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  status?: TaskStatus
  actual_minutes?: number
}

function normalizeDate(value?: string) {
  if (!value) return undefined
  if (value.includes('T')) return value
  return new Date(`${value}T00:00:00Z`).toISOString()
}

function normalizeTaskDates<T extends CreateTaskPayload | UpdateTaskPayload>(data: T): T {
  return {
    ...data,
    due_date: normalizeDate(data.due_date),
  }
}

export const taskApi = {
  list: (userID: number) =>
    http.get<ApiResponse<Task[]>>(`/u/${userID}/tasks`).then((r) => r.data.data),

  create: (userID: number, data: CreateTaskPayload) =>
    http.post<ApiResponse<Task>>(`/u/${userID}/tasks`, normalizeTaskDates(data)).then((r) => r.data.data),

  getById: (id: number) =>
    http.get<ApiResponse<Task>>(`/tasks/${id}`).then((r) => r.data.data),

  update: (id: number, data: UpdateTaskPayload) =>
    http.put<ApiResponse<Task>>(`/tasks/${id}`, normalizeTaskDates(data)).then((r) => r.data.data),

  delete: (id: number) => http.delete(`/tasks/${id}`),

}
