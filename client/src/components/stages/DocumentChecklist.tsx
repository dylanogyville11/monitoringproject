import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import DocumentItemRow from './DocumentItemRow'
import Button from '../common/Button'
import ProgressBar from '../common/ProgressBar'
import { getStageName } from '../../utils/formatters'
import type { DocumentItemWithFiles, StageWithDocuments } from '../../types'

interface DocumentChecklistProps {
  stage: StageWithDocuments
  onEditDocument: (doc: DocumentItemWithFiles) => void
  onAddCustomDocument?: (stageId: string, namaDokumen: string) => Promise<void>
  stageProgress: number | null
  canEdit?: boolean
}

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  stage,
  onEditDocument,
  onAddCustomDocument,
  stageProgress,
  canEdit = true,
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [customName, setCustomName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const docs = stage.document_items || []
  const completedCount = docs.filter((d) => d.status === 'Sudah Lengkap').length
  const inProgressCount = docs.filter((d) => d.status === 'Dalam Proses').length
  const issuesCount = docs.filter((d) => d.status === 'Perlu Perbaikan').length
  const totalActive = docs.filter((d) => d.status !== 'Tidak Diperlukan').length

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim() || !onAddCustomDocument) return
    setIsSubmitting(true)
    try {
      await onAddCustomDocument(stage.id, customName.trim())
      setCustomName('')
      setIsAdding(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Ringkasan Tahapan */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">
              Tahap {getStageName(stage.stage_type)}
            </h3>
            <span className="text-xs bg-navy-100 text-navy-800 font-semibold px-2 py-0.5 rounded-full">
              Bobot: {stage.weight}%
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
            <span>Total Aktif: <strong className="text-gray-700">{totalActive}</strong></span>
            <span>Selesai: <strong className="text-green-600">{completedCount}</strong></span>
            <span>Proses: <strong className="text-blue-600">{inProgressCount}</strong></span>
            {issuesCount > 0 && (
              <span>Perbaikan: <strong className="text-amber-600">{issuesCount}</strong></span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="flex-1">
            <div className="text-xs text-gray-500 font-medium mb-1 flex justify-between">
              <span>Progres Tahap</span>
              <span className="font-bold text-navy-900">
                {stageProgress !== null ? `${stageProgress.toFixed(1)}%` : 'Dikecualikan'}
              </span>
            </div>
            <ProgressBar value={stageProgress || 0} size="md" showPercentage={false} />
          </div>

          {canEdit && onAddCustomDocument && !isAdding && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="flex-shrink-0"
            >
              <Plus size={14} className="mr-1" />
              Item Baru
            </Button>
          )}
        </div>
      </div>

      {/* Form Tambah Dokumen Kustom Inline */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-navy-50/50 p-4 rounded-xl border border-navy-200 flex flex-col sm:flex-row gap-3 items-center"
        >
          <input
            type="text"
            required
            autoFocus
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ketik nama dokumen kustom yang ingin ditambahkan..."
            className="flex-1 px-3 py-2 text-sm border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
          />
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setCustomName('')
              }}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Simpan Item
            </Button>
          </div>
        </form>
      )}

      {/* Daftar Dokumen */}
      {docs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400 text-sm">
          Belum ada checklist dokumen pada tahapan ini.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <DocumentItemRow
              key={doc.id}
              document={doc}
              onEdit={onEditDocument}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentChecklist
