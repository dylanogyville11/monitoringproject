import { api } from '../lib/api'
import type { ApiResponse, DocumentFile, DocumentItemWithFiles, DocumentUpdateData } from '../types'

export const documentService = {
  updateDocument: async (
    id: string,
    data: DocumentUpdateData
  ): Promise<DocumentItemWithFiles> => {
    const response = await api.patch<ApiResponse<DocumentItemWithFiles>>(
      `/documents/${id}`,
      data
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  uploadFile: async (documentId: string, file: File): Promise<DocumentFile> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<ApiResponse<DocumentFile>>(
      `/documents/${documentId}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },

  deleteFile: async (fileId: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/documents/files/${fileId}`)
    if (!response.data.success) {
      throw new Error(response.data.message)
    }
  },

  addCustomDocument: async (
    stageId: string,
    nama_dokumen: string
  ): Promise<DocumentItemWithFiles> => {
    const response = await api.post<ApiResponse<DocumentItemWithFiles>>(
      `/documents/${stageId}/items`,
      { nama_dokumen }
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },
}
