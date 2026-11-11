import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import type { JobFilters, JobFormData } from '../types'

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters?: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
}

export const useJobs = (filters?: JobFilters) => {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => jobService.getJobs(filters),
  })
}

export const useJob = (id: string) => {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobService.getJob(id),
    enabled: !!id,
  })
}

export const useCreateJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JobFormData) => jobService.createJob(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
    },
  })
}

export const useUpdateJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormData> }) =>
      jobService.updateJob(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) })
    },
  })
}

export const useDeleteJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
    },
  })
}
