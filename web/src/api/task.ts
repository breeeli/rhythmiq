import http from './http'
import type { ApiResponse, Task, TaskPriority, TaskStatus } from '@/types'

export interface CreateTaskPayload {
  title: string
  description?: string
  goal_id?: number
  priority?: TaskPriority
  estimated_minutes?: number
  due_date?: string
  prefer_morning?: boolean
  needs_focus?: boolean
  tags?: string
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  status?: TaskStatus
  actual_minutes?: number
}

export const taskApi = {
  list: (userID: number) =>
    http.get<ApiResponse<Task[]>>(`/u/${userID}/tasks`).then((r) => r.data.data),

  create: (userID: number, data: CreateTaskPayload) =>
    http.post<ApiResponse<Task>>(`/u/${userID}/tasks`, data).then((r) => r.data.data),

  getById: (id: number) =>
    http.get<ApiResponse<Task>>(`/tasks/${id}`).then((r) => r.data.data),

  update: (id: number, data: UpdateTaskPayload) =>
    http.put<ApiResponse<Task>>(`/tasks/${id}`, data).then((r) => r.data.data),

  delete: (id: number) => http.delete(`/tasks/${id}`),
}
