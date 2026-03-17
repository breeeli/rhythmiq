import http from './http'
import type {
  ApiResponse,
  HabitRule,
  PlanningConstraints,
  ScheduleRule,
} from '@/types'

export interface ScheduleRulePayload {
  title: string
  kind: 'fixed' | 'blocked'
  start_time: string
  end_time: string
  days: string[]
  locked: boolean
}

export interface HabitRulePayload {
  title: string
  duration_minutes: number
  days: string[]
  preferred_time: 'morning' | 'afternoon' | 'evening' | 'any'
  preferred_start?: string
  required: boolean
}

export const planningConstraintsApi = {
  list: (userID: number) =>
    http
      .get<ApiResponse<PlanningConstraints>>(`/u/${userID}/planning-constraints`)
      .then((r) => r.data.data),

  createScheduleRule: (userID: number, payload: ScheduleRulePayload) =>
    http
      .post<ApiResponse<ScheduleRule>>(`/u/${userID}/schedule-rules`, payload)
      .then((r) => r.data.data),

  deleteScheduleRule: (id: number) =>
    http.delete(`/schedule-rules/${id}`).then(() => undefined),

  createHabitRule: (userID: number, payload: HabitRulePayload) =>
    http
      .post<ApiResponse<HabitRule>>(`/u/${userID}/habit-rules`, payload)
      .then((r) => r.data.data),

  deleteHabitRule: (id: number) =>
    http.delete(`/habit-rules/${id}`).then(() => undefined),
}
