import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import {
  AuthenticatedRequest,
  DocumentFile,
  DocumentItem,
  DOCUMENT_STATUSES,
  DocumentStatus,
} from '../types';
import { successResponse, errorResponse } from '../utils/responseHelper';
import { defaultProgressForStatus } from '../utils/progressCalculator';
import {
  getDocumentContext,
  getPublicFileUrl,
  recalculateJobProgress,
} from '../services/progressService';
import { logAudit } from '../services/auditService';

const STORAGE_BUCKET = 'contract-documents';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const updateDocumentSchema = z.object({
  nama_dokumen: z.string().trim().min(1).max(255).optional(),
  status: z.enum(DOCUMENT_STATUSES as [DocumentStatus, ...DocumentStatus[]]).optional(),
  progress_pct: z.coerce.number().int().min(0).max(100).optional(),
  tanggal_selesai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  penanggung_jawab: z.string().max(150).nullable().optional(),
  keterangan: z.string().nullable().optional(),
});

const addDocumentItemSchema = z.object({
  nama_dokumen: z.string().trim().min(1, 'Nama dokumen wajib diisi').max(255),
});

// ============================================================
// HELPERS
// ============================================================

function sanitizeFileName(name: string): string {
  const normalized = name.normalize('NFKD').replace(/[^\w.\- ]+/g, '');
  return normalized.replace(/\s+/g, '_').slice(0, 150) || 'file';
}

/**
 * Menyesuaikan progress_pct agar konsisten dengan status dokumen.
 */
function resolveProgress(
  status: DocumentStatus,
  requested: number | undefined,
  current: number,
  statusChanged: boolean,
): number {
  if (status === 'Sudah Lengkap') return 100;
  if (status === 'Belum Disiapkan' || status === 'Tidak Diperlukan') return 0;
  if (requested !== undefined) return requested;
  return statusChanged ? defaultProgressForStatus(status) : current;
}

// ============================================================
// CONTROLLERS
// ============================================================

/**
 * PATCH /api/documents/:id — ubah status & progres dokumen.
 */
export async function updateDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const body = updateDocumentSchema.parse(req.body);

    const ctx = await getDocumentContext(id);
    if (!ctx) {
      errorResponse(res, 'Dokumen tidak ditemukan.', 404);
      return;
    }

    const { document: current, jobId } = ctx;
    const newStatus = body.status ?? current.status;
    const statusChanged = newStatus !== current.status;

    const update: Partial<DocumentItem> = {
      ...body,
      status: newStatus,
      progress_pct: resolveProgress(newStatus, body.progress_pct, current.progress_pct, statusChanged),
    };

    const { data: updated, error } = await supabaseAdmin
      .from('document_items')
      .update(update)
      .eq('id', id)
      .select('*')
      .single<DocumentItem>();

    if (error || !updated) {
      errorResponse(res, `Gagal memperbarui dokumen: ${error?.message}`, 500);
      return;
    }

    const progress = await recalculateJobProgress(jobId);

    await logAudit(jobId, req.user, statusChanged
      ? `Mengubah status dokumen "${updated.nama_dokumen}" menjadi ${newStatus}`
      : `Memperbarui dokumen "${updated.nama_dokumen}"`, {
      document_id: id,
      stage_type: ctx.stageType,
      before: {
        status: current.status,
        progress_pct: current.progress_pct,
        tanggal_selesai: current.tanggal_selesai,
        penanggung_jawab: current.penanggung_jawab,
      },
      after: {
        status: updated.status,
        progress_pct: updated.progress_pct,
        tanggal_selesai: updated.tanggal_selesai,
        penanggung_jawab: updated.penanggung_jawab,
      },
      job_progress: progress.totalProgress,
    });

    successResponse(
      res,
      { ...updated, job_progress: progress.totalProgress, job_status: progress.status },
      'Dokumen berhasil diperbarui.',
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/documents/:id/upload — unggah berkas lampiran ke Supabase Storage.
 */
export async function uploadDocumentFile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      errorResponse(res, 'File wajib dilampirkan pada field "file".', 400);
      return;
    }

    const ctx = await getDocumentContext(id);
    if (!ctx) {
      errorResponse(res, 'Dokumen tidak ditemukan.', 404);
      return;
    }

    const safeName = sanitizeFileName(file.originalname);
    const path = `contracts/${ctx.jobId}/${ctx.stageType}/${id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      errorResponse(res, `Gagal mengunggah file: ${uploadError.message}`, 500);
      return;
    }

    const { data: record, error: dbError } = await supabaseAdmin
      .from('document_files')
      .insert({
        document_item_id: id,
        file_name: file.originalname,
        file_path: path,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: req.user.id,
      })
      .select('*')
      .single<DocumentFile>();

    if (dbError || !record) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path]);
      errorResponse(res, `Gagal menyimpan metadata file: ${dbError?.message}`, 500);
      return;
    }

    await logAudit(ctx.jobId, req.user, `Mengunggah berkas "${file.originalname}" pada dokumen "${ctx.document.nama_dokumen}"`, {
      document_id: id,
      file_id: record.id,
      file_size: file.size,
      mime_type: file.mimetype,
    });

    successResponse(
      res,
      { ...record, file_url: getPublicFileUrl(path) },
      'File berhasil diunggah.',
      201,
    );
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/documents/files/:fileId — hapus berkas lampiran.
 */
export async function deleteDocumentFile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { fileId } = req.params;

    const { data: file } = await supabaseAdmin
      .from('document_files')
      .select('*')
      .eq('id', fileId)
      .maybeSingle<DocumentFile>();

    if (!file) {
      errorResponse(res, 'File tidak ditemukan.', 404);
      return;
    }

    const ctx = await getDocumentContext(file.document_item_id);

    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([file.file_path]);
    if (storageError) {
      console.warn('[STORAGE] Gagal menghapus objek:', storageError.message);
    }

    const { error } = await supabaseAdmin.from('document_files').delete().eq('id', fileId);
    if (error) {
      errorResponse(res, `Gagal menghapus file: ${error.message}`, 500);
      return;
    }

    await logAudit(ctx?.jobId ?? null, req.user, `Menghapus berkas "${file.file_name}"`, {
      file_id: fileId,
      document_id: file.document_item_id,
    });

    successResponse(res, null, 'File berhasil dihapus.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/documents/:id/items — tambah item dokumen kustom (:id = stage_id).
 */
export async function addDocumentItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stageId = req.params.id;
    const body = addDocumentItemSchema.parse(req.body);

    const { data: stage } = await supabaseAdmin
      .from('stages')
      .select('id, job_id, stage_type')
      .eq('id', stageId)
      .maybeSingle<{ id: string; job_id: string; stage_type: string }>();

    if (!stage) {
      errorResponse(res, 'Tahapan tidak ditemukan.', 404);
      return;
    }

    const { data: last } = await supabaseAdmin
      .from('document_items')
      .select('order_index')
      .eq('stage_id', stageId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle<{ order_index: number }>();

    const { data: item, error } = await supabaseAdmin
      .from('document_items')
      .insert({
        stage_id: stageId,
        nama_dokumen: body.nama_dokumen,
        status: 'Belum Disiapkan',
        progress_pct: 0,
        is_custom: true,
        order_index: (last?.order_index ?? 0) + 1,
      })
      .select('*')
      .single<DocumentItem>();

    if (error || !item) {
      errorResponse(res, `Gagal menambah dokumen: ${error?.message}`, 500);
      return;
    }

    const progress = await recalculateJobProgress(stage.job_id);

    await logAudit(stage.job_id, req.user, `Menambahkan dokumen kustom "${item.nama_dokumen}"`, {
      document_id: item.id,
      stage_type: stage.stage_type,
      job_progress: progress.totalProgress,
    });

    successResponse(res, { ...item, files: [] }, 'Dokumen kustom berhasil ditambahkan.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/documents/:id — hapus item dokumen kustom.
 */
export async function deleteDocumentItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const ctx = await getDocumentContext(id);
    if (!ctx) {
      errorResponse(res, 'Dokumen tidak ditemukan.', 404);
      return;
    }
    if (!ctx.document.is_custom) {
      errorResponse(res, 'Dokumen standar tidak dapat dihapus. Ubah status menjadi "Tidak Diperlukan".', 400);
      return;
    }

    const { data: files } = await supabaseAdmin
      .from('document_files')
      .select('file_path')
      .eq('document_item_id', id);
    const paths = (files ?? []).map((f: { file_path: string }) => f.file_path);
    if (paths.length > 0) await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(paths);

    const { error } = await supabaseAdmin.from('document_items').delete().eq('id', id);
    if (error) {
      errorResponse(res, `Gagal menghapus dokumen: ${error.message}`, 500);
      return;
    }

    const progress = await recalculateJobProgress(ctx.jobId);
    await logAudit(ctx.jobId, req.user, `Menghapus dokumen kustom "${ctx.document.nama_dokumen}"`, {
      document_id: id,
      job_progress: progress.totalProgress,
    });

    successResponse(res, null, 'Dokumen berhasil dihapus.');
  } catch (err) {
    next(err);
  }
}
