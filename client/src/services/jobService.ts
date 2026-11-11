import { api } from '../lib/api'
import type {
  ApiResponse,
  Job,
  JobDetailFull,
  JobFilters,
  JobFormData,
  JobWithProgress,
  PaginatedResponse,
} from '../types'

export const jobService = {
  getJobs: async (filters?: JobFilters): Promise<PaginatedResponse<JobWithProgress>> => {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.tahun_anggaran) params.set('tahun_anggaran', String(filters.tahun_anggaran))
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.limit) params.set('limit', String(filters.limit))

    const response = await api.get<ApiResponse<PaginatedResponse<JobWithProgress>>>(
      `/jobs?${params.toString()}`
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  getJob: async (id: string): Promise<JobDetailFull> => {
    const response = await api.get<ApiResponse<JobDetailFull>>(`/jobs/${id}`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  createJob: async (data: JobFormData): Promise<Job> => {
    const response = await api.post<ApiResponse<Job>>('/jobs', data)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  updateJob: async (id: string, data: Partial<JobFormData>): Promise<Job> => {
    const response = await api.put<ApiResponse<Job>>(`/jobs/${id}`, data)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  deleteJob: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/jobs/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.message)
    }
  },

  addNote: async (jobId: string, content: string) => {
    const response = await api.post<ApiResponse<unknown>>(`/jobs/${jobId}/notes`, { content })
    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  getAuditLogs: async (jobId: string) => {
    const response = await api.get<ApiResponse<unknown[]>>(`/jobs/${jobId}/audit-logs`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },
}
