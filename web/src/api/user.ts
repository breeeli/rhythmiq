import http from './http'
import type { ApiResponse, User } from '@/types'

export interface CreateUserPayload {
  name: string
  email: string
  timezone?: string
  wake_up_time?: string
  sleep_time?: string
  focus_start?: string
  focus_end?: string
  max_daily_work_hours?: number
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {}

export const userApi = {
  create: (data: CreateUserPayload) =>
    http.post<ApiResponse<User>>('/users', data).then((r) => r.data.data),

  getById: (id: number) =>
    http.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data.data),

  update: (id: number, data: UpdateUserPayload) =>
    http.put<ApiResponse<User>>(`/users/${id}`, data).then((r) => r.data.data),

  delete: (id: number) => http.delete(`/users/${id}`),
}
