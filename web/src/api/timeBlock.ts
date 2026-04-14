import http from './http'
import type { ApiResponse } from '@/types'

export type TimeBlockRecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY'

export interface TimeBlock {
  id: number
  title: string
  start_time: string
  end_time: string
  recurrence_type: TimeBlockRecurrenceType
  days_of_week?: string[]
  date?: string
  user_id: number
  created_at: string
  updated_at: string
}

export interface TimeBlockPayload {
  title: string
  start_time: string
  end_time: string
  recurrence_type: TimeBlockRecurrenceType
  days_of_week?: string[]
  date?: string
}

export const timeBlockApi = {
  list: (userID: number) =>
    http
      .get<ApiResponse<TimeBlock[]>>(`/u/${userID}/time-blocks`)
      .then((r) => r.data.data),

  create: (userID: number, payload: TimeBlockPayload) =>
    http
      .post<ApiResponse<TimeBlock>>(`/u/${userID}/time-blocks`, payload)
      .then((r) => r.data.data),

  update: (id: number, payload: TimeBlockPayload) =>
    http
      .put<ApiResponse<TimeBlock>>(`/time-blocks/${id}`, payload)
      .then((r) => r.data.data),

  delete: (id: number) => http.delete(`/time-blocks/${id}`).then(() => undefined),
}
