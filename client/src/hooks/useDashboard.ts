import { useQuery } from '@tanstack/react-query'
import { reportService } from '../services/reportService'

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportService.getDashboard(),
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
  })
}
