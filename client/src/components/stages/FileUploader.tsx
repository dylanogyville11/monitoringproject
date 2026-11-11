import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../common/Button'
import { formatFileSize } from '../../utils/formatters'

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>
  isLoading?: boolean
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]

const MAX_SIZE = 25 * 1024 * 1024 // 25 MB

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, isLoading = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = (file: File) => {
    setError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Tipe berkas tidak didukung. Harap unggah PDF, Word, Excel, atau Gambar.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Ukuran berkas melebihi batas maksimum 25 MB.')
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Gagal mengunggah berkas')
      }
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-navy-600 bg-navy-50/50'
            : selectedFile
            ? 'border-green-400 bg-green-50/30'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSetFile(e.target.files[0])
            }
          }}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="text-green-600" size={32} />
            <div className="font-medium text-gray-900 text-sm">{selectedFile.name}</div>
            <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
            <p className="text-xs text-navy-700 underline mt-1">Klik untuk mengganti berkas</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="text-gray-400" size={32} />
            <div className="text-sm font-medium text-gray-700">
              Tarik & lepas berkas ke sini, atau <span className="text-navy-600 underline">pilih berkas</span>
            </div>
            <div className="text-xs text-gray-400">
              Format didukung: PDF, Word, Excel, JPG, PNG (Maks 25 MB)
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Unggah Berkas
          </Button>
        </div>
      )}
    </div>
  )
}

export default FileUploader
