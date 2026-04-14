import http from './http'
import type { ApiResponse, Subtask, SubtaskStatus, Task, TaskPriority, TaskStatus } from '@/types'

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

export interface CreateSubtaskPayload {
  title: string
  description?: string
  priority?: TaskPriority
  estimated_minutes?: number
  prefer_window?: string
  depends_on_subtask_id?: number
  llm_generated?: boolean
}

export interface UpdateSubtaskPayload extends Partial<CreateSubtaskPayload> {
  status?: SubtaskStatus
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

  listSubtasks: (taskID: number) =>
    http.get<ApiResponse<Subtask[]>>(`/tasks/${taskID}/subtasks`).then((r) => r.data.data),

  createSubtask: (taskID: number, data: CreateSubtaskPayload) =>
    http.post<ApiResponse<Subtask>>(`/tasks/${taskID}/subtasks`, data).then((r) => r.data.data),

  updateSubtask: (id: number, data: UpdateSubtaskPayload) =>
    http.put<ApiResponse<Subtask>>(`/subtasks/${id}`, data).then((r) => r.data.data),

  decompose: (taskID: number) =>
    http.post<ApiResponse<Task>>(`/tasks/${taskID}/decompose`).then((r) => r.data.data),
}
