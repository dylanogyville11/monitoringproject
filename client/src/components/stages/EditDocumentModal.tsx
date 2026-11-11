import React, { useState, useEffect } from 'react'
import { FileText, Download, Trash2, Paperclip } from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import FileUploader from './FileUploader'
import { formatFileSize, formatDate } from '../../utils/formatters'
import type {
  DocumentItemWithFiles,
  DocumentStatus,
  DocumentUpdateData,
} from '../../types'

interface EditDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  document: DocumentItemWithFiles | null
  onUpdate: (id: string, data: DocumentUpdateData) => Promise<void>
  onUploadFile: (documentId: string, file: File) => Promise<void>
  onDeleteFile: (fileId: string) => Promise<void>
  canEdit?: boolean
}

const statusOptions: { value: DocumentStatus; label: string }[] = [
  { value: 'Sudah Lengkap', label: 'Sudah Lengkap (100%)' },
  { value: 'Dalam Proses', label: 'Dalam Proses' },
  { value: 'Perlu Perbaikan', label: 'Perlu Perbaikan' },
  { value: 'Belum Disiapkan', label: 'Belum Disiapkan (0%)' },
  { value: 'Tidak Diperlukan', label: 'Tidak Diperlukan (Dikecualikan)' },
]

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdate,
  onUploadFile,
  onDeleteFile,
  canEdit = true,
}) => {
  const [status, setStatus] = useState<DocumentStatus>('Belum Disiapkan')
  const [progressPct, setProgressPct] = useState<number>(0)
  const [tanggalSelesai, setTanggalSelesai] = useState<string>('')
  const [penanggungJawab, setPenanggungJawab] = useState<string>('')
  const [keterangan, setKeterangan] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  useEffect(() => {
    if (document) {
      setStatus(document.status)
      setProgressPct(document.progress_pct ?? (document.status === 'Sudah Lengkap' ? 100 : 0))
      setTanggalSelesai(document.tanggal_selesai || '')
      setPenanggungJawab(document.penanggung_jawab || '')
      setKeterangan(document.keterangan || '')
    }
  }, [document, isOpen])

  if (!document) return null

  const handleStatusChange = (newStatus: DocumentStatus) => {
    setStatus(newStatus)
    if (newStatus === 'Sudah Lengkap') {
      setProgressPct(100)
    } else if (newStatus === 'Belum Disiapkan' || newStatus === 'Tidak Diperlukan') {
      setProgressPct(0)
    } else if (newStatus === 'Dalam Proses' && progressPct === 0) {
      setProgressPct(50)
    } else if (newStatus === 'Perlu Perbaikan' && progressPct === 0) {
      setProgressPct(25)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onUpdate(document.id, {
        status,
        progress_pct: status === 'Sudah Lengkap' ? 100 : progressPct,
        tanggal_selesai: tanggalSelesai || undefined,
        penanggung_jawab: penanggungJawab || undefined,
        keterangan: keterangan || undefined,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      await onUploadFile(document.id, file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!window.confirm('Yakin ingin menghapus berkas ini?')) return
    setDeletingFileId(fileId)
    try {
      await onDeleteFile(fileId)
    } finally {
      setDeletingFileId(null)
    }
  }

  const showProgressSlider = status === 'Dalam Proses' || status === 'Perlu Perbaikan'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Dokumen: ${document.nama_dokumen}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Status Dokumen"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as DocumentStatus)}
            options={statusOptions}
            disabled={!canEdit}
          />

          <Input
            label="Tanggal Terbit / Selesai"
            type="date"
            value={tanggalSelesai}
            onChange={(e) => setTanggalSelesai(e.target.value)}
            disabled={!canEdit}
          />
        </div>

        {showProgressSlider && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Persentase Kelengkapan</label>
              <span className="text-sm font-bold text-navy-800">{progressPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressPct}
              onChange={(e) => setProgressPct(Number(e.target.value))}
              disabled={!canEdit}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0% (Belum)</span>
              <span>50% (Proses)</span>
              <span>100% (Selesai)</span>
            </div>
          </div>
        )}

        <Input
          label="Penanggung Jawab / Verifikator"
          placeholder="Nama pihak/pejabat pemverifikasi dokumen"
          value={penanggungJawab}
          onChange={(e) => setPenanggungJawab(e.target.value)}
          disabled={!canEdit}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Catatan Evaluasi Dokumen</label>
          <textarea
            rows={2}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Nomor surat, catatan kekurangan, atau tindak lanjut..."
            disabled={!canEdit}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        {/* Lampiran Berkas Fisik Digital */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Paperclip size={16} className="text-navy-700" />
            Berkas Lampiran Digital ({document.files?.length || 0})
          </h4>

          {document.files && document.files.length > 0 ? (
            <div className="space-y-2 mb-4">
              {document.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="text-navy-700 flex-shrink-0" size={18} />
                    <div className="truncate">
                      <div className="font-medium text-gray-800 truncate">{file.file_name}</div>
                      <div className="text-xs text-gray-400">
                        {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {file.file_url && (
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
                        title="Unduh Berkas"
                      >
                        <Download size={16} />
                      </a>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id)}
                        disabled={deletingFileId === file.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Berkas"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic mb-3">Belum ada berkas lampiran yang diunggah.</p>
          )}

          {canEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Unggah Berkas Baru
              </label>
              <FileUploader onUpload={handleFileUpload} isLoading={isUploading} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Tutup
          </Button>
          {canEdit && (
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Simpan Perubahan
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default EditDocumentModal
