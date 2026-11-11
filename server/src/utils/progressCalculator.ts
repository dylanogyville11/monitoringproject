import {
  DocumentItem,
  DocumentStatus,
  JobStatus,
  ProgressCalculationResult,
  STAGE_TYPES,
  StageType,
  StageWeights,
  StageWithDocuments,
} from '../types';

// ============================================================
// CONSTANTS (docs/BUSINESS_LOGIC.md §1)
// ============================================================

export const DEFAULT_STAGE_WEIGHTS: StageWeights = {
  prakualifikasi: 15,
  kontrak: 25,
  pelaksanaan: 40,
  serah_terima: 20,
};

export const DEFAULT_PROGRESS_DALAM_PROSES = 50;
export const DEFAULT_PROGRESS_PERLU_PERBAIKAN = 25;

// ============================================================
// HELPERS
// ============================================================

/**
 * Konversi status dokumen menjadi nilai progres (0-100).
 * Mengembalikan null untuk 'Tidak Diperlukan' (dikeluarkan dari perhitungan).
 */
export function documentValue(
  status: DocumentStatus,
  progressPct: number | null | undefined,
): number | null {
  switch (status) {
    case 'Sudah Lengkap':
      return 100;
    case 'Dalam Proses':
      return typeof progressPct === 'number' && progressPct > 0
        ? clamp(progressPct)
        : DEFAULT_PROGRESS_DALAM_PROSES;
    case 'Perlu Perbaikan':
      return typeof progressPct === 'number' && progressPct > 0
        ? clamp(progressPct)
        : DEFAULT_PROGRESS_PERLU_PERBAIKAN;
    case 'Belum Disiapkan':
      return 0;
    case 'Tidak Diperlukan':
      return null;
    default:
      return 0;
  }
}

/**
 * Nilai progress_pct default yang disimpan saat status berubah.
 */
export function defaultProgressForStatus(status: DocumentStatus): number {
  switch (status) {
    case 'Sudah Lengkap':
      return 100;
    case 'Dalam Proses':
      return DEFAULT_PROGRESS_DALAM_PROSES;
    case 'Perlu Perbaikan':
      return DEFAULT_PROGRESS_PERLU_PERBAIKAN;
    default:
      return 0;
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Menentukan bobot efektif per tahapan:
 * custom_weights (per job) > stage.weight (DB) > DEFAULT_STAGE_WEIGHTS.
 */
export function resolveStageWeights(
  stages: Pick<StageWithDocuments, 'stage_type' | 'weight'>[],
  customWeights?: Partial<StageWeights> | null,
): StageWeights {
  const weights: StageWeights = { ...DEFAULT_STAGE_WEIGHTS };
  for (const stage of stages) {
    const w = Number(stage.weight);
    if (!Number.isNaN(w) && w > 0) weights[stage.stage_type] = w;
  }
  if (customWeights) {
    for (const st of STAGE_TYPES) {
      const cw = customWeights[st];
      if (typeof cw === 'number' && cw >= 0) weights[st] = cw;
    }
  }
  return weights;
}

/**
 * Progres satu tahapan = rata-rata nilai dokumen aktif.
 * null jika tidak ada dokumen aktif (tahapan dikecualikan).
 */
export function calculateStageProgress(
  documents: Pick<DocumentItem, 'status' | 'progress_pct'>[],
): number | null {
  const values = documents
    .map((d) => documentValue(d.status, d.progress_pct))
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return round1(values.reduce((s, v) => s + v, 0) / values.length);
}

// ============================================================
// MAIN CALCULATOR (Normalized Weighted Stage Aggregation)
// ============================================================

/**
 * 1. Progres tiap tahap = rata-rata dokumen aktif (selain 'Tidak Diperlukan').
 * 2. Tahap tanpa dokumen aktif dikecualikan.
 * 3. Bobot tahap aktif dinormalisasi: W_norm = W_k / ΣW_aktif × 100.
 * 4. Total = Σ (P_k × W_norm / 100), dibulatkan 1 desimal.
 */
export function calculateJobProgress(
  stages: StageWithDocuments[],
  customWeights?: Partial<StageWeights> | null,
): ProgressCalculationResult {
  const weights = resolveStageWeights(stages, customWeights);

  const stageProgress: Record<StageType, number | null> = {
    prakualifikasi: null,
    kontrak: null,
    pelaksanaan: null,
    serah_terima: null,
  };
  const normalizedWeights: Record<StageType, number> = {
    prakualifikasi: 0,
    kontrak: 0,
    pelaksanaan: 0,
    serah_terima: 0,
  };

  const activeStages: StageType[] = [];
  let totalActiveWeight = 0;

  for (const stage of stages) {
    const progress = calculateStageProgress(stage.document_items ?? []);
    stageProgress[stage.stage_type] = progress;
    if (progress !== null) {
      activeStages.push(stage.stage_type);
      totalActiveWeight += weights[stage.stage_type];
    }
  }

  if (activeStages.length === 0 || totalActiveWeight <= 0) {
    return { stageProgress, normalizedWeights, totalProgress: 0, activeStages };
  }

  let total = 0;
  for (const st of activeStages) {
    const norm = (weights[st] / totalActiveWeight) * 100;
    normalizedWeights[st] = round1(norm);
    total += ((stageProgress[st] ?? 0) * norm) / 100;
  }

  return {
    stageProgress,
    normalizedWeights,
    totalProgress: round1(total),
    activeStages,
  };
}

// ============================================================
// STATUS DERIVER
// ============================================================

/**
 * Menurunkan status pekerjaan secara otomatis dari progres, dokumen, dan deadline.
 */
export function deriveJobStatus(
  totalProgress: number,
  stages: StageWithDocuments[],
  targetPenyelesaian: string | null,
): JobStatus {
  if (totalProgress >= 100) return 'Selesai';

  const hasIssue = stages.some((s) =>
    (s.document_items ?? []).some((d) => d.status === 'Perlu Perbaikan'),
  );
  if (hasIssue) return 'Butuh Perbaikan';

  if (targetPenyelesaian) {
    const days = calculateDaysRemaining(targetPenyelesaian);
    if (days < 0) return 'Terlambat';
  }

  if (totalProgress > 0) return 'Dalam Proses';
  return 'Belum Dimulai';
}

export function hasDocumentIssues(stages: StageWithDocuments[]): boolean {
  return stages.some((s) =>
    (s.document_items ?? []).some((d) => d.status === 'Perlu Perbaikan'),
  );
}

// ============================================================
// UTILITY
// ============================================================

/**
 * Selisih hari antara target penyelesaian dan hari ini (negatif = terlambat).
 */
export function calculateDaysRemaining(targetPenyelesaian: string): number {
  const target = new Date(targetPenyelesaian);
  const now = new Date();
  const t = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const n = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t - n) / 86_400_000);
}
