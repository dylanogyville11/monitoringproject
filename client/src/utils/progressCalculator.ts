import type { DocumentItem } from '../types'

/**
 * Calculates stage progress based on document items.
 * Returns null if there are no eligible documents.
 * Mirrors the backend calculation logic.
 */
export const calculateStageProgress = (documents: DocumentItem[]): number | null => {
  const eligibleDocs = documents.filter(
    (doc) => doc.status !== 'Tidak Diperlukan'
  )

  if (eligibleDocs.length === 0) return null

  let totalProgress = 0

  for (const doc of eligibleDocs) {
    if (doc.status === 'Sudah Lengkap') {
      totalProgress += 100
    } else if (doc.status === 'Dalam Proses' || doc.status === 'Perlu Perbaikan') {
      totalProgress += doc.progress_pct || 0
    } else {
      // 'Belum Disiapkan'
      totalProgress += 0
    }
  }

  return Math.round((totalProgress / eligibleDocs.length) * 10) / 10
}

/**
 * Calculates overall job progress based on stage progresses and weights.
 */
export const calculateJobProgress = (
  stageProgress: Record<string, number | null>,
  stageWeights: Record<string, number>
): number => {
  let weightedSum = 0
  let totalWeight = 0

  for (const [stageType, progress] of Object.entries(stageProgress)) {
    const weight = stageWeights[stageType] || 0
    if (progress !== null) {
      weightedSum += progress * weight
      totalWeight += weight
    }
  }

  if (totalWeight === 0) return 0
  return Math.round((weightedSum / totalWeight) * 10) / 10
}
