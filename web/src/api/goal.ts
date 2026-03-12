import http from './http'
import type { ApiResponse, Goal, GoalPriority, GoalType } from '@/types'

export interface CreateGoalPayload {
  title: string
  description?: string
  type?: GoalType
  priority?: GoalPriority
  deadline?: string
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {
  status?: Goal['status']
  progress?: number
}

export const goalApi = {
  list: (userID: number) =>
    http.get<ApiResponse<Goal[]>>(`/u/${userID}/goals`).then((r) => r.data.data),

  create: (userID: number, data: CreateGoalPayload) =>
    http.post<ApiResponse<Goal>>(`/u/${userID}/goals`, data).then((r) => r.data.data),

  getById: (id: number) =>
    http.get<ApiResponse<Goal>>(`/goals/${id}`).then((r) => r.data.data),

  update: (id: number, data: UpdateGoalPayload) =>
    http.put<ApiResponse<Goal>>(`/goals/${id}`, data).then((r) => r.data.data),

  delete: (id: number) => http.delete(`/goals/${id}`),
}
