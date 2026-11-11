import React, { useState } from 'react'
import { Plus, Briefcase } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import JobsTable from '../components/jobs/JobsTable'
import FilterBar from '../components/jobs/FilterBar'
import JobFormModal from '../components/jobs/JobFormModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob } from '../hooks/useJobs'
import { useAuth } from '../hooks/useAuth'
import type { JobFilters, JobFormData, JobStatus, JobWithProgress } from '../types'

const JobsPage: React.FC = () => {
  const { hasRole } = useAuth()
  const canEdit = hasRole(['admin', 'operator'])
  const canDelete = hasRole(['admin'])

  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    status: '',
    tahun_anggaran: '',
    page: 1,
    limit: 10,
  })

  const { data, isLoading } = useJobs(filters)
  const createJobMutation = useCreateJob()
  const updateJobMutation = useUpdateJob()
  const deleteJobMutation = useDeleteJob()

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobWithProgress | null>(null)
  const [deletingJob, setDeletingJob] = useState<JobWithProgress | null>(null)

  const handleOpenCreate = () => {
    setEditingJob(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (job: JobWithProgress) => {
    setEditingJob(job)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (formData: JobFormData) => {
    if (editingJob) {
      await updateJobMutation.mutateAsync({ id: editingJob.id, data: formData })
    } else {
      await createJobMutation.mutateAsync(formData)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingJob) return
    await deleteJobMutation.mutateAsync(deletingJob.id)
    setDeletingJob(null)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      tahun_anggaran: '',
      page: 1,
      limit: 10,
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Briefcase className="text-navy-800" size={26} />
              Master Paket Pekerjaan
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Daftar seluruh paket pekerjaan pengadaan dan status kelengkapan dokumen
            </p>
          </div>

          {canEdit && (
            <Button variant="primary" onClick={handleOpenCreate} className="shadow-md">
              <Plus size={16} className="mr-1" />
              Tambah Pekerjaan Baru
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <FilterBar
          search={filters.search || ''}
          onSearchChange={(val) => setFilters((prev) => ({ ...prev, search: val, page: 1 }))}
          status={filters.status || ''}
          onStatusChange={(val) => setFilters((prev) => ({ ...prev, status: val, page: 1 }))}
          tahun={filters.tahun_anggaran || ''}
          onTahunChange={(val) => setFilters((prev) => ({ ...prev, tahun_anggaran: val, page: 1 }))}
          onReset={handleResetFilters}
        />

        {/* Table Content */}
        {isLoading ? (
          <div className="min-h-[300px] flex items-center justify-center bg-white rounded-xl border border-gray-200">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <JobsTable
              jobs={data?.items || []}
              onEdit={canEdit ? handleOpenEdit : undefined}
              onDelete={canDelete ? setDeletingJob : undefined}
              canEdit={canEdit}
              canDelete={canDelete}
            />

            {/* Pagination Controls */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 text-sm">
                <span className="text-xs text-gray-500">
                  Menampilkan hal <strong>{data.pagination.page}</strong> dari{' '}
                  <strong>{data.pagination.totalPages}</strong> ({data.pagination.total} total pekerjaan)
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={data.pagination.page <= 1}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                    }
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={data.pagination.page >= data.pagination.totalPages}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                    }
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Form Tambah / Edit */}
        <JobFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingJob}
          onSubmit={handleFormSubmit}
          isLoading={createJobMutation.isPending || updateJobMutation.isPending}
        />

        {/* Dialog Konfirmasi Hapus */}
        <ConfirmDialog
          isOpen={Boolean(deletingJob)}
          onClose={() => setDeletingJob(null)}
          onConfirm={handleConfirmDelete}
          title="Hapus Paket Pekerjaan"
          message={`Apakah Anda yakin ingin menghapus pekerjaan "${deletingJob?.nama_pekerjaan}"? Seluruh berkas dan dokumen yang terkait akan dihapus permanen.`}
          isLoading={deleteJobMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}

export default JobsPage
