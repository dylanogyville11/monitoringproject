import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentService } from '../services/documentService'
import { jobService } from '../services/jobService'
import type { AuditLog, DocumentUpdateData } from '../types'
import { jobKeys } from './useJobs'

export const useUpdateDocument = (jobId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdateData }) =>
      documentService.updateDocument(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export const useUploadFile = (jobId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; file: File }) =>
      documentService.uploadFile(documentId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export const useDeleteFile = (jobId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => documentService.deleteFile(fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export const useAddNote = (jobId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => jobService.addNote(jobId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export const useAuditLogs = (jobId: string) => {
  return useQuery({
    queryKey: ['auditLogs', jobId],
    queryFn: () => jobService.getAuditLogs(jobId) as Promise<AuditLog[]>,
    enabled: !!jobId,
  })
}

export const useAddCustomDocument = (jobId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stageId, nama_dokumen }: { stageId: string; nama_dokumen: string }) =>
      documentService.addCustomDocument(stageId, nama_dokumen),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}
