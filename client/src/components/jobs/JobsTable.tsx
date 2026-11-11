import React from 'react'
import { Link } from 'react-router-dom'
import { Eye, Edit2, Trash2 } from 'lucide-react'
import Badge from '../common/Badge'
import ProgressBar from '../common/ProgressBar'
import { formatRupiah, formatDate, formatDaysRemaining } from '../../utils/formatters'
import type { JobStatus, JobWithProgress } from '../../types'

interface JobsTableProps {
  jobs: JobWithProgress[]
  onEdit?: (job: JobWithProgress) => void
  onDelete?: (job: JobWithProgress) => void
  canEdit?: boolean
  canDelete?: boolean
}

const statusBadgeVariant = (status: JobStatus): 'default' | 'info' | 'success' | 'danger' | 'warning' => {
  switch (status) {
    case 'Dalam Proses':
      return 'info'
    case 'Selesai':
      return 'success'
    case 'Terlambat':
      return 'danger'
    case 'Butuh Perbaikan':
      return 'warning'
    default:
      return 'default'
  }
}

const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
        Tidak ada data pekerjaan yang sesuai dengan kriteria filter.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-navy-900 text-white font-medium">
              <th className="py-3.5 px-4 w-12 text-center">No</th>
              <th className="py-3.5 px-4">Paket Pekerjaan & Kontraktor</th>
              <th className="py-3.5 px-4">Nilai Kontrak</th>
              <th className="py-3.5 px-4">Tahun / PPK</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 w-40">Progres</th>
              <th className="py-3.5 px-4">Target Selesai</th>
              <th className="py-3.5 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.map((job, idx) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3.5 px-4 text-center text-gray-500">{idx + 1}</td>
                <td className="py-3.5 px-4 max-w-xs">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="font-semibold text-navy-800 hover:text-navy-600 line-clamp-1"
                    title={job.nama_pekerjaan}
                  >
                    {job.nama_pekerjaan}
                  </Link>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{job.nomor_pekerjaan}</div>
                  <div className="text-xs text-gray-600 font-medium mt-0.5">{job.nama_penyedia}</div>
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                  {formatRupiah(job.nilai_pekerjaan)}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-gray-700">{job.tahun_anggaran}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{job.penanggung_jawab}</div>
                </td>
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <Badge variant={statusBadgeVariant(job.status_pekerjaan)}>
                    {job.status_pekerjaan}
                  </Badge>
                </td>
                <td className="py-3.5 px-4">
                  <ProgressBar value={job.calculated_progress || 0} size="sm" />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="text-gray-900">{formatDate(job.target_penyelesaian)}</div>
                  <div
                    className={`text-xs mt-0.5 font-medium ${
                      job.days_remaining < 0
                        ? 'text-red-600 font-semibold'
                        : job.days_remaining <= 14
                        ? 'text-amber-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatDaysRemaining(job.days_remaining)}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="p-1.5 text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                      title="Lihat Detail & Checklist"
                    >
                      <Eye size={16} />
                    </Link>
                    {canEdit && onEdit && (
                      <button
                        onClick={() => onEdit(job)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Pekerjaan"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canDelete && onDelete && (
                      <button
                        onClick={() => onDelete(job)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Pekerjaan"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default JobsTable
