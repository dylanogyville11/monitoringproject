import { Request } from 'express';

// ============================================================
// ENUMS / LITERAL TYPES (sinkron dengan enum PostgreSQL)
// ============================================================

export type UserRole = 'admin' | 'operator' | 'pimpinan';

export type StageType = 'prakualifikasi' | 'kontrak' | 'pelaksanaan' | 'serah_terima';

export type DocumentStatus =
  | 'Sudah Lengkap'
  | 'Dalam Proses'
  | 'Belum Disiapkan'
  | 'Perlu Perbaikan'
  | 'Tidak Diperlukan';

export type JobStatus =
  | 'Belum Dimulai'
  | 'Dalam Proses'
  | 'Selesai'
  | 'Terlambat'
  | 'Butuh Perbaikan';

export const STAGE_TYPES: readonly StageType[] = [
  'prakualifikasi',
  'kontrak',
  'pelaksanaan',
  'serah_terima',
] as const;

export const JOB_STATUSES: readonly JobStatus[] = [
  'Belum Dimulai',
  'Dalam Proses',
  'Selesai',
  'Terlambat',
  'Butuh Perbaikan',
] as const;

export const DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  'Sudah Lengkap',
  'Dalam Proses',
  'Belum Disiapkan',
  'Perlu Perbaikan',
  'Tidak Diperlukan',
] as const;

// ============================================================
// DATABASE ENTITY INTERFACES (docs/DATABASE_SCHEMA.md)
// ============================================================

export interface Profile {
  id: string;
  username: string;
  name: string;
  nip: string | null;
  role: UserRole;
  jabatan: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StageWeights = Record<StageType, number>;

export interface Job {
  id: string;
  nomor_pekerjaan: string;
  nama_pekerjaan: string;
  nama_penyedia: string;
  nilai_pekerjaan: number;
  tahun_anggaran: number;
  penanggung_jawab: string;
  tanggal_mulai: string;
  target_penyelesaian: string;
  status_pekerjaan: JobStatus;
  keterangan: string | null;
  custom_weights: Partial<StageWeights> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: string;
  job_id: string;
  stage_type: StageType;
  weight: number;
  order_index: number;
}

export interface DocumentItem {
  id: string;
  stage_id: string;
  nama_dokumen: string;
  status: DocumentStatus;
  progress_pct: number;
  tanggal_selesai: string | null;
  penanggung_jawab: string | null;
  keterangan: string | null;
  is_custom: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentFile {
  id: string;
  document_item_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  file_url?: string;
}

export interface JobNote {
  id: string;
  job_id: string;
  author_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  job_id: string | null;
  user_id: string | null;
  user_name: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// ENRICHED / COMPUTED INTERFACES
// ============================================================

export interface StageWithDocuments extends Stage {
  document_items: DocumentItem[];
}

export interface DocumentItemWithFiles extends DocumentItem {
  files: DocumentFile[];
}

export interface StageWithDocumentsAndFiles extends Stage {
  document_items: DocumentItemWithFiles[];
}

export interface JobWithProgress extends Job {
  calculated_progress: number;
  days_remaining: number;
  stage_progress: Record<StageType, number | null>;
  has_issues: boolean;
}

export interface JobDetailFull extends Job {
  calculated_progress: number;
  days_remaining: number;
  stage_progress: Record<StageType, number | null>;
  stages: StageWithDocumentsAndFiles[];
  job_notes: JobNote[];
}

export interface ProgressCalculationResult {
  stageProgress: Record<StageType, number | null>;
  normalizedWeights: Record<StageType, number>;
  totalProgress: number;
  activeStages: StageType[];
}

// ============================================================
// REQUEST TYPES
// ============================================================

export interface AuthenticatedRequest extends Request {
  user: Profile;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface DashboardKPI {
  total_jobs: number;
  dalam_proses: number;
  selesai: number;
  terlambat: number;
  belum_dimulai: number;
  butuh_perbaikan: number;
  average_progress: number;
  total_contract_value: number;
}

export interface StatusDistributionItem {
  name: JobStatus;
  value: number;
  color: string;
}

export interface JobProgressItem {
  job_id: string;
  name: string;
  progress: number;
  status: JobStatus;
}

export interface DashboardResponse {
  kpi: DashboardKPI;
  charts: {
    status_distribution: StatusDistributionItem[];
    job_progress: JobProgressItem[];
  };
  watchlist: {
    approaching_deadline: JobWithProgress[];
    requires_action: JobWithProgress[];
  };
}
