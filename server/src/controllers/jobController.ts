import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import {
  AuditLog,
  AuthenticatedRequest,
  Job,
  JobDetailFull,
  JobNote,
  JOB_STATUSES,
  STAGE_TYPES,
  StageType,
  StageWeights,
} from '../types';
import { successResponse, errorResponse } from '../utils/responseHelper';
import {
  calculateDaysRemaining,
  calculateJobProgress,
  DEFAULT_STAGE_WEIGHTS,
} from '../utils/progressCalculator';
import { DEFAULT_DOCUMENT_TEMPLATES } from '../utils/documentTemplates';
import {
  enrichJob,
  fetchStagesForJobs,
  fetchStagesWithFiles,
  recalculateJobProgress,
} from '../services/progressService';
import { logAudit } from '../services/auditService';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

const customWeightsSchema = z
  .object({
    prakualifikasi: z.number().min(0).max(100),
    kontrak: z.number().min(0).max(100),
    pelaksanaan: z.number().min(0).max(100),
    serah_terima: z.number().min(0).max(100),
  })
  .refine(
    (w) => Math.abs(w.prakualifikasi + w.kontrak + w.pelaksanaan + w.serah_terima - 100) < 0.01,
    { message: 'Total bobot 4 tahapan harus 100%' },
  );

const jobBaseSchema = z.object({
  nomor_pekerjaan: z.string().trim().min(1, 'Nomor pekerjaan wajib diisi').max(100),
  nama_pekerjaan: z.string().trim().min(1, 'Nama pekerjaan wajib diisi'),
  nama_penyedia: z.string().trim().min(1, 'Nama penyedia wajib diisi').max(255),
  nilai_pekerjaan: z.coerce.number().int().min(0, 'Nilai pekerjaan tidak boleh negatif'),
  tahun_anggaran: z.coerce.number().int().min(2000).max(2100),
  penanggung_jawab: z.string().trim().min(1, 'Penanggung jawab (PPK) wajib diisi').max(150),
  tanggal_mulai: dateString,
  target_penyelesaian: dateString,
  status_pekerjaan: z.enum(JOB_STATUSES as [string, ...string[]]).optional(),
  keterangan: z.string().nullable().optional(),
  custom_weights: customWeightsSchema.nullable().optional(),
});

const createJobSchema = jobBaseSchema.refine(
  (d) => d.target_penyelesaian >= d.tanggal_mulai,
  { message: 'Target penyelesaian harus setelah tanggal mulai', path: ['target_penyelesaian'] },
);

const updateJobSchema = jobBaseSchema.partial();

const createNoteSchema = z.object({
  content: z.string().trim().min(1, 'Isi catatan wajib diisi').max(5000),
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  tahun: z.coerce.number().int().optional(),
  tahun_anggaran: z.coerce.number().int().optional(),
  status: z.enum(JOB_STATUSES as [string, ...string[]]).optional().or(z.literal('')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ============================================================
// HELPERS
// ============================================================

function sanitizeSearch(input: string): string {
  // Hilangkan karakter yang memiliki arti khusus pada filter PostgREST
  return input.replace(/[%,()*\\]/g, ' ').trim();
}

async function syncStageWeights(jobId: string, weights: StageWeights): Promise<void> {
  await Promise.all(
    STAGE_TYPES.map((st) =>
      supabaseAdmin.from('stages').update({ weight: weights[st] }).eq('job_id', jobId).eq('stage_type', st),
    ),
  );
}

// ============================================================
// CONTROLLERS
// ============================================================

/**
 * GET /api/jobs — daftar pekerjaan dengan filter & pagination.
 */
export async function getJobs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = listQuerySchema.parse(req.query);
    const tahun = q.tahun ?? q.tahun_anggaran;
    const from = (q.page - 1) * q.limit;
    const to = from + q.limit - 1;

    let query = supabaseAdmin.from('jobs').select('*', { count: 'exact' });

    if (q.search) {
      const s = sanitizeSearch(q.search);
      if (s) {
        query = query.or(
          [
            `nama_pekerjaan.ilike.*${s}*`,
            `nomor_pekerjaan.ilike.*${s}*`,
            `nama_penyedia.ilike.*${s}*`,
            `penanggung_jawab.ilike.*${s}*`,
          ].join(','),
        );
      }
    }
    if (tahun) query = query.eq('tahun_anggaran', tahun);
    if (q.status) query = query.eq('status_pekerjaan', q.status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      errorResponse(res, `Gagal mengambil data pekerjaan: ${error.message}`, 500);
      return;
    }

    const jobs = (data ?? []) as Job[];
    const stagesMap = await fetchStagesForJobs(jobs.map((j) => j.id));
    const items = jobs.map((j) => enrichJob(j, stagesMap.get(j.id) ?? []));
    const total = count ?? 0;

    successResponse(res, {
      items,
      pagination: {
        total,
        page: q.page,
        limit: q.limit,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
      },
    }, 'Data pekerjaan berhasil diambil.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/jobs/:id — detail lengkap pekerjaan.
 */
export async function getJobById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle<Job>();

    if (error) {
      errorResponse(res, `Gagal mengambil pekerjaan: ${error.message}`, 500);
      return;
    }
    if (!job) {
      errorResponse(res, 'Pekerjaan tidak ditemukan.', 404);
      return;
    }

    const [stages, notesResult] = await Promise.all([
      fetchStagesWithFiles(id),
      supabaseAdmin
        .from('job_notes')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: false }),
    ]);

    const progress = calculateJobProgress(stages, job.custom_weights);

    const detail: JobDetailFull = {
      ...job,
      calculated_progress: progress.totalProgress,
      stage_progress: progress.stageProgress,
      days_remaining: calculateDaysRemaining(job.target_penyelesaian),
      stages,
      job_notes: (notesResult.data ?? []) as JobNote[],
    };

    successResponse(res, detail, 'Detail pekerjaan berhasil diambil.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/jobs/:id/progress — kalkulasi progres terkini.
 */
export async function getJobProgress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('custom_weights')
      .eq('id', id)
      .maybeSingle<Pick<Job, 'custom_weights'>>();

    if (!job) {
      errorResponse(res, 'Pekerjaan tidak ditemukan.', 404);
      return;
    }

    const stages = await fetchStagesWithFiles(id);
    const result = calculateJobProgress(stages, job.custom_weights);
    successResponse(res, result, 'Progres pekerjaan berhasil dihitung.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/jobs — tambah pekerjaan baru + inisialisasi 4 tahapan & template checklist.
 */
export async function createJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createJobSchema.parse(req.body);

    if (body.custom_weights && req.user.role !== 'admin') {
      errorResponse(res, 'Hanya admin yang dapat mengatur bobot kustom.', 403);
      return;
    }

    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        nomor_pekerjaan: body.nomor_pekerjaan,
        nama_pekerjaan: body.nama_pekerjaan,
        nama_penyedia: body.nama_penyedia,
        nilai_pekerjaan: body.nilai_pekerjaan,
        tahun_anggaran: body.tahun_anggaran,
        penanggung_jawab: body.penanggung_jawab,
        tanggal_mulai: body.tanggal_mulai,
        target_penyelesaian: body.target_penyelesaian,
        status_pekerjaan: body.status_pekerjaan ?? 'Belum Dimulai',
        keterangan: body.keterangan ?? null,
        custom_weights: body.custom_weights ?? null,
        created_by: req.user.id,
      })
      .select('*')
      .single<Job>();

    if (jobError || !job) {
      if (jobError?.code === '23505') {
        errorResponse(res, 'Nomor pekerjaan sudah digunakan.', 409);
        return;
      }
      errorResponse(res, `Gagal membuat pekerjaan: ${jobError?.message}`, 500);
      return;
    }

    const weights: StageWeights = body.custom_weights ?? DEFAULT_STAGE_WEIGHTS;

    // Inisialisasi 4 tahapan
    const { data: stages, error: stageError } = await supabaseAdmin
      .from('stages')
      .insert(
        STAGE_TYPES.map((st, idx) => ({
          job_id: job.id,
          stage_type: st,
          weight: weights[st],
          order_index: idx + 1,
        })),
      )
      .select('id, stage_type');

    if (stageError || !stages) {
      await supabaseAdmin.from('jobs').delete().eq('id', job.id);
      errorResponse(res, `Gagal menginisialisasi tahapan: ${stageError?.message}`, 500);
      return;
    }

    // Inisialisasi template checklist dokumen
    const documentRows = (stages as { id: string; stage_type: StageType }[]).flatMap((stage) =>
      DEFAULT_DOCUMENT_TEMPLATES[stage.stage_type].map((nama, idx) => ({
        stage_id: stage.id,
        nama_dokumen: nama,
        status: 'Belum Disiapkan',
        progress_pct: 0,
        is_custom: false,
        order_index: idx + 1,
      })),
    );

    const { error: docError } = await supabaseAdmin.from('document_items').insert(documentRows);
    if (docError) {
      await supabaseAdmin.from('jobs').delete().eq('id', job.id);
      errorResponse(res, `Gagal menginisialisasi checklist dokumen: ${docError.message}`, 500);
      return;
    }

    await logAudit(job.id, req.user, 'Membuat paket pekerjaan baru', {
      nomor_pekerjaan: job.nomor_pekerjaan,
      nama_pekerjaan: job.nama_pekerjaan,
      jumlah_dokumen: documentRows.length,
    });

    successResponse(res, job, 'Pekerjaan berhasil dibuat.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/jobs/:id — perbarui data umum pekerjaan.
 */
export async function updateJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const body = updateJobSchema.parse(req.body);

    if (Object.keys(body).length === 0) {
      errorResponse(res, 'Tidak ada data yang diperbarui.', 400);
      return;
    }

    if (body.custom_weights !== undefined && req.user.role !== 'admin') {
      errorResponse(res, 'Hanya admin yang dapat mengubah bobot kustom.', 403);
      return;
    }

    const { data: existing } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle<Job>();

    if (!existing) {
      errorResponse(res, 'Pekerjaan tidak ditemukan.', 404);
      return;
    }

    const start = body.tanggal_mulai ?? existing.tanggal_mulai;
    const end = body.target_penyelesaian ?? existing.target_penyelesaian;
    if (end < start) {
      errorResponse(res, 'Target penyelesaian harus setelah tanggal mulai.', 400);
      return;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('jobs')
      .update(body)
      .eq('id', id)
      .select('*')
      .single<Job>();

    if (error || !updated) {
      if (error?.code === '23505') {
        errorResponse(res, 'Nomor pekerjaan sudah digunakan.', 409);
        return;
      }
      errorResponse(res, `Gagal memperbarui pekerjaan: ${error?.message}`, 500);
      return;
    }

    if (body.custom_weights !== undefined) {
      await syncStageWeights(id, body.custom_weights ?? DEFAULT_STAGE_WEIGHTS);
    }

    // Status otomatis kecuali diatur manual
    if (!body.status_pekerjaan) {
      await recalculateJobProgress(id);
    }

    // Catat field yang berubah
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(body)) {
      const before = existing[key as keyof Job];
      if (JSON.stringify(before) !== JSON.stringify(value)) {
        changes[key] = { from: before, to: value };
      }
    }

    await logAudit(id, req.user, 'Memperbarui data pekerjaan', { changes });

    const { data: fresh } = await supabaseAdmin.from('jobs').select('*').eq('id', id).single<Job>();
    successResponse(res, fresh ?? updated, 'Pekerjaan berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/jobs/:id — hapus pekerjaan (admin).
 */
export async function deleteJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('id, nomor_pekerjaan, nama_pekerjaan')
      .eq('id', id)
      .maybeSingle<Pick<Job, 'id' | 'nomor_pekerjaan' | 'nama_pekerjaan'>>();

    if (!job) {
      errorResponse(res, 'Pekerjaan tidak ditemukan.', 404);
      return;
    }

    // Hapus file fisik di storage
    const { data: stageRows } = await supabaseAdmin.from('stages').select('id').eq('job_id', id);
    const stageIds = (stageRows ?? []).map((s: { id: string }) => s.id);
    if (stageIds.length > 0) {
      const { data: docRows } = await supabaseAdmin
        .from('document_items')
        .select('id')
        .in('stage_id', stageIds);
      const docIds = (docRows ?? []).map((d: { id: string }) => d.id);
      if (docIds.length > 0) {
        const { data: files } = await supabaseAdmin
          .from('document_files')
          .select('file_path')
          .in('document_item_id', docIds);
        const paths = (files ?? []).map((f: { file_path: string }) => f.file_path);
        if (paths.length > 0) {
          await supabaseAdmin.storage.from('contract-documents').remove(paths);
        }
      }
    }

    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', id);
    if (error) {
      errorResponse(res, `Gagal menghapus pekerjaan: ${error.message}`, 500);
      return;
    }

    // job_id = null karena record pekerjaan sudah dihapus (FK ON DELETE SET NULL)
    await logAudit(null, req.user, 'Menghapus paket pekerjaan', {
      job_id: job.id,
      nomor_pekerjaan: job.nomor_pekerjaan,
      nama_pekerjaan: job.nama_pekerjaan,
    });

    successResponse(res, null, 'Pekerjaan berhasil dihapus.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/jobs/:id/notes — tambah catatan evaluasi.
 */
export async function createJobNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const body = createNoteSchema.parse(req.body);

    const { data: job } = await supabaseAdmin.from('jobs').select('id').eq('id', id).maybeSingle();
    if (!job) {
      errorResponse(res, 'Pekerjaan tidak ditemukan.', 404);
      return;
    }

    const { data: note, error } = await supabaseAdmin
      .from('job_notes')
      .insert({
        job_id: id,
        author_id: req.user.id,
        author_name: req.user.name,
        content: body.content,
      })
      .select('*')
      .single<JobNote>();

    if (error || !note) {
      errorResponse(res, `Gagal menambah catatan: ${error?.message}`, 500);
      return;
    }

    await logAudit(id, req.user, 'Menambahkan catatan evaluasi', {
      note_id: note.id,
      preview: body.content.slice(0, 120),
    });

    successResponse(res, note, 'Catatan berhasil ditambahkan.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/jobs/:id/audit-logs — riwayat jejak audit.
 */
export async function getJobAuditLogs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      errorResponse(res, `Gagal mengambil jejak audit: ${error.message}`, 500);
      return;
    }

    successResponse(res, (data ?? []) as AuditLog[], 'Jejak audit berhasil diambil.');
  } catch (err) {
    next(err);
  }
}
