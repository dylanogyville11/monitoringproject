import { api } from '../lib/api'
import type { ApiResponse, DashboardData } from '../types'

export const reportService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<ApiResponse<DashboardData>>('/reports/dashboard')
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  getJobReport: async (jobId: string) => {
    const response = await api.get<ApiResponse<unknown>>(`/reports/jobs/${jobId}`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  exportExcel: async (): Promise<void> => {
    const response = await api.get('/reports/export-excel', {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rekapitulasi_SIMON-KONTRAK_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
