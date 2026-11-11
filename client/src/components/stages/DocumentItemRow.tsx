import React from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  CircleDashed,
  MinusCircle,
  Paperclip,
  Edit2,
  Eye,
} from 'lucide-react'
import Badge from '../common/Badge'
import ProgressBar from '../common/ProgressBar'
import { formatDate } from '../../utils/formatters'
import type { DocumentItemWithFiles, DocumentStatus } from '../../types'

interface DocumentItemRowProps {
  document: DocumentItemWithFiles
  onEdit: (doc: DocumentItemWithFiles) => void
  canEdit?: boolean
}

const statusConfig: Record<
  DocumentStatus,
  {
    icon: React.ReactNode
    variant: 'success' | 'info' | 'warning' | 'default' | 'purple'
  }
> = {
  'Sudah Lengkap': {
    icon: <CheckCircle2 className="text-green-600" size={18} />,
    variant: 'success',
  },
  'Dalam Proses': {
    icon: <Clock className="text-blue-600" size={18} />,
    variant: 'info',
  },
  'Perlu Perbaikan': {
    icon: <AlertTriangle className="text-amber-600" size={18} />,
    variant: 'warning',
  },
  'Belum Disiapkan': {
    icon: <CircleDashed className="text-gray-400" size={18} />,
    variant: 'default',
  },
  'Tidak Diperlukan': {
    icon: <MinusCircle className="text-purple-600" size={18} />,
    variant: 'purple',
  },
}

const DocumentItemRow: React.FC<DocumentItemRowProps> = ({
  document,
  onEdit,
  canEdit = true,
}) => {
  const config = statusConfig[document.status] || statusConfig['Belum Disiapkan']
  const fileCount = document.files?.length || 0

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors gap-3">
      {/* Kolom Kiri: Ikon & Nama */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 flex-shrink-0">{config.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{document.nama_dokumen}</h4>
            {document.is_custom && (
              <span className="text-[10px] bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded font-medium">
                Custom
              </span>
            )}
            <Badge variant={config.variant}>{document.status}</Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
            {document.tanggal_selesai && (
              <span>Selesai: {formatDate(document.tanggal_selesai)}</span>
            )}
            {document.penanggung_jawab && (
              <span>Oleh: {document.penanggung_jawab}</span>
            )}
            {document.keterangan && (
              <span className="italic text-gray-600">"{document.keterangan}"</span>
            )}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Progress, Lampiran, & Aksi */}
      <div className="flex items-center gap-4 flex-shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
        {document.status === 'Dalam Proses' || document.status === 'Perlu Perbaikan' ? (
          <div className="w-24">
            <ProgressBar value={document.progress_pct || 0} size="sm" />
          </div>
        ) : null}

        {fileCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-navy-800 bg-navy-50 px-2 py-1 rounded-md font-medium border border-navy-100">
            <Paperclip size={13} />
            <span>{fileCount} berkas</span>
          </div>
        )}

        <button
          onClick={() => onEdit(document)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            canEdit
              ? 'bg-navy-800 text-white hover:bg-navy-900 border-navy-800'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
          }`}
        >
          {canEdit ? (
            <>
              <Edit2 size={13} />
              <span>Kelola</span>
            </>
          ) : (
            <>
              <Eye size={13} />
              <span>Detail</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default DocumentItemRow
