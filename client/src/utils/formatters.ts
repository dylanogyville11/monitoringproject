import type { DocumentStatus, JobStatus, StageType } from '../types'

export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export const formatDaysRemaining = (days: number): string => {
  if (days > 0) return `${days} hari lagi`
  if (days === 0) return 'Jatuh tempo hari ini'
  return `${Math.abs(days)} hari terlambat`
}

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`
}

export const getStatusColor = (status: JobStatus): string => {
  const colors: Record<JobStatus, string> = {
    'Belum Dimulai': 'bg-gray-100 text-gray-700',
    'Dalam Proses': 'bg-blue-100 text-blue-700',
    'Selesai': 'bg-green-100 text-green-700',
    'Terlambat': 'bg-red-100 text-red-700',
    'Butuh Perbaikan': 'bg-yellow-100 text-yellow-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export const getDocumentStatusColor = (status: DocumentStatus): string => {
  const colors: Record<DocumentStatus, string> = {
    'Sudah Lengkap': 'bg-green-100 text-green-700',
    'Dalam Proses': 'bg-blue-100 text-blue-700',
    'Belum Disiapkan': 'bg-gray-100 text-gray-600',
    'Perlu Perbaikan': 'bg-yellow-100 text-yellow-700',
    'Tidak Diperlukan': 'bg-purple-100 text-purple-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export const getStageName = (stageType: StageType): string => {
  const names: Record<StageType, string> = {
    prakualifikasi: 'Prakualifikasi',
    kontrak: 'Berkas Kontrak',
    pelaksanaan: 'Pelaksanaan',
    serah_terima: 'Serah Terima & BAST',
  }
  return names[stageType] || stageType
}

export const getProgressVariant = (progress: number): 'danger' | 'warning' | 'info' | 'success' => {
  if (progress < 30) return 'danger'
  if (progress < 70) return 'warning'
  if (progress < 90) return 'info'
  return 'success'
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}
