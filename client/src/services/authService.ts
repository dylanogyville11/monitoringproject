import { api } from '../lib/api'
import type { ApiResponse, AuthResponse, LoginCredentials, Profile } from '../types'

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login gagal')
    }
    return response.data.data
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore logout errors
    }
  },

  getProfile: async (): Promise<Profile> => {
    const response = await api.get<ApiResponse<Profile>>('/auth/me')
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Gagal mengambil profil')
    }
    return response.data.data
  },
}
