import { api } from '../lib/api'
import type { ApiResponse, Profile, UserRole } from '../types'

export interface CreateUserData {
  username: string
  email: string
  password: string
  name: string
  nip?: string | null
  role: UserRole
  jabatan?: string | null
}

export interface UpdateUserData {
  name?: string
  nip?: string | null
  role?: UserRole
  jabatan?: string | null
  is_active?: boolean
  password?: string
}

export const userService = {
  getUsers: async (): Promise<Profile[]> => {
    const response = await api.get<ApiResponse<Profile[]>>('/users')
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Gagal mengambil data pengguna')
    }
    return response.data.data
  },

  getUserById: async (id: string): Promise<Profile> => {
    const response = await api.get<ApiResponse<Profile>>(`/users/${id}`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Pengguna tidak ditemukan')
    }
    return response.data.data
  },

  createUser: async (data: CreateUserData): Promise<Profile> => {
    const response = await api.post<ApiResponse<Profile>>('/users', data)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Gagal membuat pengguna')
    }
    return response.data.data
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<Profile> => {
    const response = await api.patch<ApiResponse<Profile>>(`/users/${id}`, data)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Gagal memperbarui pengguna')
    }
    return response.data.data
  },
}
