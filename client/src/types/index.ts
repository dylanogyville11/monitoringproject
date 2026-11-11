// =====================
// ENUM TYPES
// =====================
export type UserRole = 'admin' | 'operator' | 'pimpinan'
export type StageType = 'prakualifikasi' | 'kontrak' | 'pelaksanaan' | 'serah_terima'
export type DocumentStatus =
  | 'Sudah Lengkap'
  | 'Dalam Proses'
  | 'Belum Disiapkan'
  | 'Perlu Perbaikan'
  | 'Tidak Diperlukan'
export type JobStatus =
  | 'Belum Dimulai'
  | 'Dalam Proses'
  | 'Selesai'
  | 'Terlambat'
  | 'Butuh Perbaikan'

// =====================
// CORE ENTITIES
// =====================
export interface Profile {
  id: string
  username: string
  name: string
  nip?: string
  role: UserRole
  jabatan?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  nomor_pekerjaan: string
  nama_pekerjaan: string
  nama_penyedia: string
  nilai_pekerjaan: number
  tahun_anggaran: number
  penanggung_jawab: string
  tanggal_mulai: string
  target_penyelesaian: string
  status_pekerjaan: JobStatus
  keterangan?: string
  custom_weights?: Record<string, number>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface JobWithProgress extends Job {
  calculated_progress: number
  days_remaining: number
}

export interface Stage {
  id: string
  job_id: string
  stage_type: StageType
  weight: number
  order_index: number
}

export interface DocumentItem {
  id: string
  stage_id: string
  nama_dokumen: string
  status: DocumentStatus
  progress_pct: number
  tanggal_selesai?: string
  penanggung_jawab?: string
  keterangan?: string
  is_custom: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface DocumentFile {
  id: string
  document_item_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type?: string
  uploaded_by?: string
  created_at: string
  file_url?: string
}

export interface DocumentItemWithFiles extends DocumentItem {
  files: DocumentFile[]
}

export interface StageWithDocuments extends Stage {
  document_items: DocumentItemWithFiles[]
}

export interface JobDetailFull extends Job {
  stages: StageWithDocuments[]
  job_notes: JobNote[]
  calculated_progress: number
  stage_progress: Record<string, number | null>
}

export interface JobNote {
  id: string
  job_id: string
  author_id?: string
  author_name?: string
  content: string
  created_at: string
}

export interface AuditLog {
  id: string
  job_id?: string
  user_id?: string
  user_name?: string
  action: string
  metadata?: Record<string, unknown>
  created_at: string
}

// =====================
// DASHBOARD
// =====================
export interface DashboardKPI {
  total_jobs: number
  dalam_proses: number
  selesai: number
  terlambat: number
  belum_dimulai: number
  butuh_perbaikan: number
  average_progress: number
  total_contract_value: number
}

export interface StatusDistributionItem {
  name: string
  value: number
  color: string
}

export interface JobProgressItem {
  name: string
  progress: number
  status: JobStatus
}

export interface DashboardData {
  kpi: DashboardKPI
  charts: {
    status_distribution: StatusDistributionItem[]
    job_progress: JobProgressItem[]
  }
  watchlist: {
    approaching_deadline: JobWithProgress[]
    requires_action: JobWithProgress[]
  }
}

// =====================
// API RESPONSES
// =====================
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// =====================
// FILTER TYPES
// =====================
export interface JobFilters {
  search?: string
  status?: JobStatus | ''
  tahun_anggaran?: number | ''
  page?: number
  limit?: number
}

// =====================
// FORM TYPES
// =====================
export interface JobFormData {
  nomor_pekerjaan: string
  nama_pekerjaan: string
  nama_penyedia: string
  nilai_pekerjaan: number
  tahun_anggaran: number
  penanggung_jawab: string
  tanggal_mulai: string
  target_penyelesaian: string
  status_pekerjaan: JobStatus
  keterangan?: string
}

export interface DocumentUpdateData {
  status: DocumentStatus
  progress_pct?: number
  tanggal_selesai?: string
  penanggung_jawab?: string
  keterangan?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: Profile
}
