import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Printer,
  Edit2,
  Calendar,
  Building,
  User,
  DollarSign,
  Clock,
  MessageSquare,
  History,
  Send,
  AlertCircle,
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import StagesTabs from '../components/stages/StagesTabs'
import DocumentChecklist from '../components/stages/DocumentChecklist'
import EditDocumentModal from '../components/stages/EditDocumentModal'
import JobFormModal from '../components/jobs/JobFormModal'
import PrintLayout from '../components/reports/PrintLayout'
import Badge from '../components/common/Badge'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import ProgressBar from '../components/common/ProgressBar'
import {
  useJob,
  useUpdateJob,
} from '../hooks/useJobs'
import {
  useUpdateDocument,
  useUploadFile,
  useDeleteFile,
  useAddNote,
  useAuditLogs,
  useAddCustomDocument,
} from '../hooks/useDocuments'
import { useAuth } from '../hooks/useAuth'
import {
  formatRupiah,
  formatDate,
  formatDaysRemaining,
} from '../../utils/formatters'
import type {
  DocumentItemWithFiles,
  DocumentUpdateData,
  JobFormData,
  JobStatus,
  StageType,
} from '../../types'

const statusBadgeVariant = (
  status: JobStatus
): 'default' | 'info' | 'success' | 'danger' | 'warning' => {
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

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const jobId = id || ''

  const { hasRole } = useAuth()
  const canEdit = hasRole(['admin', 'operator'])

  const { data: job, isLoading, error } = useJob(jobId)
  const updateJobMutation = useUpdateJob()
  const updateDocMutation = useUpdateDocument(jobId)
  const uploadFileMutation = useUploadFile(jobId)
  const deleteFileMutation = useDeleteFile(jobId)
  const addNoteMutation = useAddNote(jobId)
  const addCustomDocMutation = useAddCustomDocument(jobId)
  const { data: auditLogs } = useAuditLogs(jobId)

  // Stage tab state
  const [activeStage, setActiveStage] = useState<StageType>('prakualifikasi')
  const [selectedDocument, setSelectedDocument] = useState<DocumentItemWithFiles | null>(null)
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [activeViewTab, setActiveViewTab] = useState<'checklist' | 'notes' | 'audit'>('checklist')

  const handlePrint = () => {
    window.print()
  }

  const handleUpdateDocument = async (docId: string, data: DocumentUpdateData) => {
    await updateDocMutation.mutateAsync({ id: docId, data })
  }

  const handleUploadFile = async (docId: string, file: File) => {
    await uploadFileMutation.mutateAsync({ documentId: docId, file })
  }

  const handleDeleteFile = async (fileId: string) => {
    await deleteFileMutation.mutateAsync(fileId)
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return
    await addNoteMutation.mutateAsync(noteContent.trim())
    setNoteContent('')
  }

  const handleAddCustomDoc = async (stageId: string, namaDokumen: string) => {
    await addCustomDocMutation.mutateAsync({ stageId, nama_dokumen: namaDokumen })
  }

  const handleJobFormSubmit = async (formData: JobFormData) => {
    if (!job) return
    await updateJobMutation.mutateAsync({ id: job.id, data: formData })
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[500px] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error || !job) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl text-center">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
          <h2 className="text-base font-bold">Pekerjaan Tidak Ditemukan</h2>
          <p className="text-xs text-red-600 mt-1">Data pekerjaan mungkin telah dihapus atau URL salah.</p>
          <Link
            to="/jobs"
            className="inline-block mt-4 text-xs font-semibold text-navy-800 underline"
          >
            Kembali ke Daftar Pekerjaan
          </Link>
        </div>
      </AppLayout>
    )
  }

  const currentStage =
    job.stages?.find((s) => s.stage_type === activeStage) || job.stages?.[0]

  return (
    <AppLayout onPrint={handlePrint} showPrint={true}>
      {/* Cetak Layout A4 Resmi (Hanya muncul saat @media print) */}
      <PrintLayout job={job} />

      {/* Konten Halaman Layar */}
      <div className="space-y-6 no-print">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 font-mono mb-1">{job.nomor_pekerjaan}</div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              {job.nama_pekerjaan}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm"
            >
              <Printer size={15} className="mr-1 text-navy-700" />
              Cetak Lembar Kendali
            </Button>

            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditJobModalOpen(true)}
                className="shadow-sm"
              >
                <Edit2 size={15} className="mr-1" />
                Ubah Data Pekerjaan
              </Button>
            )}
          </div>
        </div>

        {/* Card Ringkasan Informasi Utama Pekerjaan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <Building className="text-gray-400 mt-0.5 flex-shrink-0" size={17} />
                  <div>
                    <span className="text-xs text-gray-400 block">Penyedia / Kontraktor</span>
                    <span className="font-semibold text-gray-800">{job.nama_penyedia}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <DollarSign className="text-gray-400 mt-0.5 flex-shrink-0" size={17} />
                  <div>
                    <span className="text-xs text-gray-400 block">Nilai Kontrak</span>
                    <span className="font-bold text-navy-900 text-base">
                      {formatRupiah(job.nilai_pekerjaan)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="text-gray-400 mt-0.5 flex-shrink-0" size={17} />
                  <div>
                    <span className="text-xs text-gray-400 block">PPK Penanggung Jawab</span>
                    <span className="font-medium text-gray-800">{job.penanggung_jawab}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="text-gray-400 mt-0.5 flex-shrink-0" size={17} />
                  <div>
                    <span className="text-xs text-gray-400 block">Periode Pelaksanaan</span>
                    <span className="text-gray-700">
                      {formatDate(job.tanggal_mulai)} s.d. {formatDate(job.target_penyelesaian)}
                    </span>
                  </div>
                </div>
              </div>

              {job.keterangan && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">
                  <strong className="text-gray-700">Catatan:</strong> {job.keterangan}
                </div>
              )}
            </div>

            {/* Kolom Progress Besar */}
            <div className="flex flex-col justify-center items-center p-4 bg-navy-50/50 rounded-xl border border-navy-100 text-center">
              <div className="text-xs text-navy-800 font-semibold mb-1 uppercase tracking-wider">
                Akumulasi Progres Berbobot
              </div>
              <div className="text-4xl font-black text-navy-900 my-1">
                {job.calculated_progress.toFixed(1)}%
              </div>
              <div className="w-full max-w-[200px] mt-2 mb-3">
                <ProgressBar value={job.calculated_progress} size="md" showPercentage={false} />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant(job.status_pekerjaan)}>
                  {job.status_pekerjaan}
                </Badge>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    job.days_remaining < 0
                      ? 'bg-red-100 text-red-700'
                      : job.days_remaining <= 14
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {formatDaysRemaining(job.days_remaining)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Checklist vs Catatan vs Jejak Audit) */}
        <div className="flex border-b border-gray-200 gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveViewTab('checklist')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeViewTab === 'checklist'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Checklist 4 Tahapan Dokumen
          </button>
          <button
            onClick={() => setActiveViewTab('notes')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeViewTab === 'notes'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={16} />
            <span>Catatan Evaluasi ({job.job_notes?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveViewTab('audit')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeViewTab === 'audit'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={16} />
            <span>Jejak Audit ({auditLogs?.length || 0})</span>
          </button>
        </div>

        {/* View Tab 1: 4 Tahapan Checklist Dokumen */}
        {activeViewTab === 'checklist' && (
          <div className="space-y-6">
            <StagesTabs
              stages={job.stages || []}
              activeStage={activeStage}
              onSelectStage={setActiveStage}
              stageProgress={job.stage_progress || {}}
            />

            {currentStage && (
              <DocumentChecklist
                stage={currentStage}
                stageProgress={job.stage_progress?.[activeStage] ?? null}
                onEditDocument={(doc) => setSelectedDocument(doc)}
                onAddCustomDocument={canEdit ? handleAddCustomDoc : undefined}
                canEdit={canEdit}
              />
            )}
          </div>
        )}

        {/* View Tab 2: Catatan Evaluasi & Tindak Lanjut */}
        {activeViewTab === 'notes' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-navy-700" />
              Instruksi & Catatan Monitoring Pekerjaan
            </h3>

            {/* List Catatan */}
            <div className="space-y-3">
              {job.job_notes && job.job_notes.length > 0 ? (
                job.job_notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-navy-900">
                        {note.author_name || 'Staff'}
                      </span>
                      <span className="text-gray-400">{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">Belum ada catatan evaluasi.</p>
              )}
            </div>

            {/* Form Tambah Catatan */}
            {canEdit && (
              <form onSubmit={handleAddNote} className="space-y-3 pt-4 border-t border-gray-200">
                <label className="text-xs font-semibold text-gray-700 block">
                  Tulis Catatan / Tindak Lanjut Baru
                </label>
                <textarea
                  required
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ketik instruksi perbaikan dokumen, kendala fisik, atau hasil rapat koordinasi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={addNoteMutation.isPending}
                  >
                    <Send size={14} className="mr-1" />
                    Kirim Catatan
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* View Tab 3: Jejak Audit (Audit Trail) */}
        {activeViewTab === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <History size={16} className="text-navy-700" />
                Riwayat Log Aktivitas & Jejak Perubahan
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                    <th className="py-2.5 px-4 w-40">Waktu</th>
                    <th className="py-2.5 px-4 w-48">Pengguna</th>
                    <th className="py-2.5 px-4">Aktivitas / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-gray-800">
                          {log.user_name || 'Sistem'}
                        </td>
                        <td className="py-2.5 px-4 text-gray-700">{log.action}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-400 italic">
                        Belum ada riwayat aktivitas tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Kelola Status & File Dokumen */}
        <EditDocumentModal
          isOpen={Boolean(selectedDocument)}
          onClose={() => setSelectedDocument(null)}
          document={selectedDocument}
          onUpdate={handleUpdateDocument}
          onUploadFile={handleUploadFile}
          onDeleteFile={handleDeleteFile}
          canEdit={canEdit}
        />

        {/* Modal Ubah Data Pekerjaan */}
        <JobFormModal
          isOpen={isEditJobModalOpen}
          onClose={() => setIsEditJobModalOpen(false)}
          initialData={job}
          onSubmit={handleJobFormSubmit}
          isLoading={updateJobMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}

export default JobDetailPage
