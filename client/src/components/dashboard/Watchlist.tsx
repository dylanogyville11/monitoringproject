import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import type { JobWithProgress } from '../../types'
import { formatDaysRemaining, getStatusColor } from '../../utils/formatters'
import Badge from '../common/Badge'

interface WatchlistProps {
  approachingDeadline: JobWithProgress[]
  requiresAction: JobWithProgress[]
}

const Watchlist: React.FC<WatchlistProps> = ({ approachingDeadline, requiresAction }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Approaching Deadline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-orange-500" />
          <h3 className="font-semibold text-gray-800 text-sm">Mendekati Deadline</h3>
          <span className="ml-auto text-xs text-gray-400">{approachingDeadline.length} pekerjaan</span>
        </div>
        <div className="space-y-3">
          {approachingDeadline.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Tidak ada pekerjaan mendekati deadline</p>
          ) : (
            approachingDeadline.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100 hover:border-orange-300 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{job.nama_pekerjaan}</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    {formatDaysRemaining(job.days_remaining)}
                  </p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-500 ml-2 flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Requires Action */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-yellow-500" />
          <h3 className="font-semibold text-gray-800 text-sm">Butuh Tindak Lanjut</h3>
          <span className="ml-auto text-xs text-gray-400">{requiresAction.length} pekerjaan</span>
        </div>
        <div className="space-y-3">
          {requiresAction.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Semua dokumen dalam kondisi baik</p>
          ) : (
            requiresAction.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100 hover:border-yellow-300 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{job.nama_pekerjaan}</p>
                  <Badge
                    variant={
                      job.status_pekerjaan === 'Terlambat'
                        ? 'danger'
                        : job.status_pekerjaan === 'Butuh Perbaikan'
                        ? 'warning'
                        : 'default'
                    }
                    className="mt-1"
                  >
                    {job.status_pekerjaan}
                  </Badge>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-yellow-500 ml-2 flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Watchlist
