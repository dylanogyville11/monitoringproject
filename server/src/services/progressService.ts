import { supabaseAdmin } from '../config/supabase';
import {
  DocumentFile,
  DocumentItem,
  Job,
  JobStatus,
  JobWithProgress,
  StageWithDocuments,
  StageWithDocumentsAndFiles,
} from '../types';
import {
  calculateDaysRemaining,
  calculateJobProgress,
  deriveJobStatus,
  hasDocumentIssues,
} from '../utils/progressCalculator';

const STORAGE_BUCKET = 'contract-documents';

type RawDocWithFiles = DocumentItem & { document_files?: DocumentFile[] };
type RawStage = Omit<StageWithDocuments, 'document_items'> & {
  document_items?: RawDocWithFiles[];
};

function sortStages<T extends { order_index: number; document_items: { order_index: number }[] }>(
  stages: T[],
): T[] {
  return stages
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => ({
      ...s,
      document_items: [...s.document_items].sort((a, b) => a.order_index - b.order_index),
    }));
}

export function getPublicFileUrl(filePath: string): string {
  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Mengambil seluruh tahapan + dokumen untuk satu pekerjaan (tanpa file).
 */
export async function fetchStagesWithDocuments(jobId: string): Promise<StageWithDocuments[]> {
  const { data, error } = await supabaseAdmin
    .from('stages')
    .select('*, document_items(*)')
    .eq('job_id', jobId);

  if (error) throw new Error(`Gagal mengambil data tahapan: ${error.message}`);

  const stages = ((data ?? []) as RawStage[]).map((s) => ({
    ...s,
    document_items: (s.document_items ?? []) as DocumentItem[],
  }));
  return sortStages(stages);
}

/**
 * Mengambil seluruh tahapan + dokumen + file lampiran (dengan URL publik).
 */
export async function fetchStagesWithFiles(jobId: string): Promise<StageWithDocumentsAndFiles[]> {
  const { data, error } = await supabaseAdmin
    .from('stages')
    .select('*, document_items(*, document_files(*))')
    .eq('job_id', jobId);

  if (error) throw new Error(`Gagal mengambil data tahapan: ${error.message}`);

  const stages: StageWithDocumentsAndFiles[] = ((data ?? []) as RawStage[]).map((s) => ({
    id: s.id,
    job_id: s.job_id,
    stage_type: s.stage_type,
    weight: Number(s.weight),
    order_index: s.order_index,
    document_items: (s.document_items ?? []).map((d) => {
      const { document_files, ...doc } = d;
      return {
        ...doc,
        files: (document_files ?? [])
          .map((f) => ({ ...f, file_url: getPublicFileUrl(f.file_path) }))
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      };
    }),
  }));
  return sortStages(stages);
}

/**
 * Mengambil tahapan + dokumen untuk banyak pekerjaan sekaligus (batch).
 */
export async function fetchStagesForJobs(
  jobIds: string[],
): Promise<Map<string, StageWithDocuments[]>> {
  const map = new Map<string, StageWithDocuments[]>();
  if (jobIds.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from('stages')
    .select('*, document_items(*)')
    .in('job_id', jobIds);

  if (error) throw new Error(`Gagal mengambil data tahapan: ${error.message}`);

  for (const raw of (data ?? []) as RawStage[]) {
    const stage: StageWithDocuments = {
      ...raw,
      weight: Number(raw.weight),
      document_items: (raw.document_items ?? []) as DocumentItem[],
    };
    const list = map.get(stage.job_id) ?? [];
    list.push(stage);
    map.set(stage.job_id, list);
  }

  for (const [key, list] of map) map.set(key, sortStages(list));
  return map;
}

/**
 * Menambahkan progres terhitung, sisa hari, dan indikator masalah pada pekerjaan.
 */
export function enrichJob(job: Job, stages: StageWithDocuments[]): JobWithProgress {
  const result = calculateJobProgress(stages, job.custom_weights);
  return {
    ...job,
    calculated_progress: result.totalProgress,
    stage_progress: result.stageProgress,
    days_remaining: calculateDaysRemaining(job.target_penyelesaian),
    has_issues: hasDocumentIssues(stages),
  };
}

/**
 * Mengambil seluruh pekerjaan (opsional difilter) beserta progres terhitung.
 */
export async function fetchAllJobsWithProgress(): Promise<JobWithProgress[]> {
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Gagal mengambil data pekerjaan: ${error.message}`);

  const typedJobs = (jobs ?? []) as Job[];
  const stagesMap = await fetchStagesForJobs(typedJobs.map((j) => j.id));
  return typedJobs.map((j) => enrichJob(j, stagesMap.get(j.id) ?? []));
}

/**
 * Menghitung ulang progres pekerjaan dan memperbarui status otomatis.
 */
export async function recalculateJobProgress(
  jobId: string,
): Promise<{ totalProgress: number; status: JobStatus }> {
  const stages = await fetchStagesWithDocuments(jobId);

  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('target_penyelesaian, custom_weights, status_pekerjaan')
    .eq('id', jobId)
    .single<Pick<Job, 'target_penyelesaian' | 'custom_weights' | 'status_pekerjaan'>>();

  if (jobError || !job) throw new Error(`Gagal mengambil data pekerjaan: ${jobError?.message}`);

  const { totalProgress } = calculateJobProgress(stages, job.custom_weights);
  const status = deriveJobStatus(totalProgress, stages, job.target_penyelesaian);

  if (status !== job.status_pekerjaan) {
    const { error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({ status_pekerjaan: status })
      .eq('id', jobId);
    if (updateError) throw new Error(`Gagal memperbarui status pekerjaan: ${updateError.message}`);
  }

  return { totalProgress, status };
}

/**
 * Mendapatkan job_id dari sebuah document_item (melalui stage).
 */
export async function getDocumentContext(
  documentId: string,
): Promise<{ document: DocumentItem; jobId: string; stageType: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('document_items')
    .select('*, stages!inner(job_id, stage_type)')
    .eq('id', documentId)
    .single();

  if (error || !data) return null;

  const { stages, ...document } = data as DocumentItem & {
    stages: { job_id: string; stage_type: string };
  };
  return { document, jobId: stages.job_id, stageType: stages.stage_type };
}
