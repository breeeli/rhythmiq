import http from './http'
import type { ApiResponse, Goal, GoalPriority, GoalSource, GoalStatus } from '@/types'

export interface CreateGoalPayload {
  title: string
  parent_goal_id?: number
  description?: string
  status?: GoalStatus
  source?: GoalSource
  priority?: GoalPriority
  deadline?: string
  start_date?: string
  target_date?: string
  review_date?: string
  outcome?: string
  success_criteria?: string[]
  motivation?: string
  progress?: number
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {
  status?: Goal['status']
  progress?: number
}

export interface GenerateGoalPayload {
  prompt: string
  context_text?: string
}

function normalizeDate(value?: string) {
  if (!value) return undefined
  if (value.includes('T')) return value
  return new Date(`${value}T00:00:00Z`).toISOString()
}

function normalizeGoalDates<T extends CreateGoalPayload | UpdateGoalPayload>(data: T): T {
  return {
    ...data,
    deadline: normalizeDate(data.deadline),
    start_date: normalizeDate(data.start_date),
    target_date: normalizeDate(data.target_date),
    review_date: normalizeDate(data.review_date),
  }
}

export const goalApi = {
  list: (userID: number) =>
    http.get<ApiResponse<Goal[]>>(`/u/${userID}/goals`).then((r) => r.data.data),

  create: (userID: number, data: CreateGoalPayload) =>
    http.post<ApiResponse<Goal>>(`/u/${userID}/goals`, normalizeGoalDates(data)).then((r) => r.data.data),

  generate: (userID: number, data: GenerateGoalPayload) =>
    http.post<ApiResponse<Goal>>(`/u/${userID}/goals/generate`, data).then((r) => r.data.data),

  getById: (id: number) =>
    http.get<ApiResponse<Goal>>(`/goals/${id}`).then((r) => r.data.data),

  update: (id: number, data: UpdateGoalPayload) =>
    http.put<ApiResponse<Goal>>(`/goals/${id}`, normalizeGoalDates(data)).then((r) => r.data.data),

  delete: (id: number) => http.delete(`/goals/${id}`),
}
