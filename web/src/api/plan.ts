import http from './http'
import type {
  AnchoredPlanningItem,
  ApiResponse,
  DailyPlan,
  FocusPlanningItem,
} from '@/types'

export interface GeneratePlanPayload {
  date?: string
  context_text?: string
  anchored_items?: AnchoredPlanningItem[]
  focus_items?: FocusPlanningItem[]
}

export const planApi = {
  generate: (userID: number, data?: GeneratePlanPayload) =>
    http
      .post<ApiResponse<DailyPlan>>(`/u/${userID}/plans/generate`, data ?? {})
      .then((r) => r.data.data),

  byDate: (userID: number, date?: string) =>
    http
      .get<ApiResponse<DailyPlan>>(`/u/${userID}/plans/target`, {
        params: date ? { date } : undefined,
      })
      .then((r) => r.data.data),

  confirm: (planID: number) =>
    http.put<ApiResponse<DailyPlan>>(`/plans/${planID}/confirm`).then((r) => r.data.data),
}
