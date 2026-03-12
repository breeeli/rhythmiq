import http from './http'
import type { ApiResponse, DailyPlan } from '@/types'

export interface GeneratePlanPayload {
  date?: string  // YYYY-MM-DD, defaults to today
  hint?: string
}

export const planApi = {
  generate: (userID: number, data?: GeneratePlanPayload) =>
    http
      .post<ApiResponse<DailyPlan>>(`/u/${userID}/plans/generate`, data ?? {})
      .then((r) => r.data.data),

  today: (userID: number) =>
    http.get<ApiResponse<DailyPlan>>(`/u/${userID}/plans/today`).then((r) => r.data.data),

  confirm: (planID: number) =>
    http.put<ApiResponse<DailyPlan>>(`/plans/${planID}/confirm`).then((r) => r.data.data),
}
