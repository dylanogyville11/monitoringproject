import { Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  AuthenticatedRequest,
  DashboardKPI,
  DashboardResponse,
  JOB_STATUSES,
  JobStatus,
  StatusDistributionItem,
} from '../types';
import { successResponse } from '../utils/responseHelper';
import { fetchAllJobsWithProgress } from '../services/progressService';
import { generateExcelReport } from '../services/exportService';

export const STATUS_COLORS: Record<JobStatus, string> = {
  'Dalam Proses': '#2563eb',
  Selesai: '#16a34a',
  Terlambat: '#dc2626',
  'Butuh Perbaikan': '#f59e0b',
  'Belum Dimulai': '#94a3b8',
};

const exportQuerySchema = z.object({
  tahun: z.coerce.number().int().optional(),
  status: z.enum(JOB_STATUSES as [string, ...string[]]).optional().or(z.literal('')),
});

/**
 * GET /api/reports/dashboard — KPI, data grafik, dan watchlist.
 */
export async function getDashboard(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const jobs = await fetchAllJobsWithProgress();

    const counts: Record<JobStatus, number> = {
      'Belum Dimulai': 0,
      'Dalam Proses': 0,
      Selesai: 0,
      Terlambat: 0,
      'Butuh Perbaikan': 0,
    };
    for (const j of jobs) counts[j.status_pekerjaan] += 1;

    const avg =
      jobs.length > 0
        ? Math.round((jobs.reduce((s, j) => s + j.calculated_progress, 0) / jobs.length) * 10) / 10
        : 0;

    const kpi: DashboardKPI = {
      total_jobs: jobs.length,
      dalam_proses: counts['Dalam Proses'],
      selesai: counts.Selesai,
      terlambat: counts.Terlambat,
      belum_dimulai: counts['Belum Dimulai'],
      butuh_perbaikan: counts['Butuh Perbaikan'],
      average_progress: avg,
      total_contract_value: jobs.reduce((s, j) => s + Number(j.nilai_pekerjaan), 0),
    };

    const statusDistribution: StatusDistributionItem[] = JOB_STATUSES.map((status) => ({
      name: status,
      value: counts[status],
      color: STATUS_COLORS[status],
    })).filter((s) => s.value > 0);

    const jobProgress = [...jobs]
      .sort((a, b) => b.calculated_progress - a.calculated_progress)
      .slice(0, 10)
      .map((j) => ({
        job_id: j.id,
        name: j.nama_pekerjaan.length > 40 ? `${j.nama_pekerjaan.slice(0, 40)}…` : j.nama_pekerjaan,
        progress: j.calculated_progress,
        status: j.status_pekerjaan,
      }));

    const approachingDeadline = jobs
      .filter((j) => j.status_pekerjaan !== 'Selesai' && j.days_remaining <= 30)
      .sort((a, b) => a.days_remaining - b.days_remaining)
      .slice(0, 8);

    const requiresAction = jobs
      .filter(
        (j) =>
          j.status_pekerjaan !== 'Selesai' &&
          (j.has_issues || j.status_pekerjaan === 'Butuh Perbaikan' || j.status_pekerjaan === 'Terlambat'),
      )
      .slice(0, 8);

    const payload: DashboardResponse = {
      kpi,
      charts: { status_distribution: statusDistribution, job_progress: jobProgress },
      watchlist: { approaching_deadline: approachingDeadline, requires_action: requiresAction },
    };

    successResponse(res, payload, 'Data dashboard berhasil diambil.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/export-excel — unduh rekapitulasi pekerjaan (.xlsx).
 */
export async function exportExcel(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = exportQuerySchema.parse(req.query);
    let jobs = await fetchAllJobsWithProgress();
    if (q.tahun) jobs = jobs.filter((j) => j.tahun_anggaran === q.tahun);
    if (q.status) jobs = jobs.filter((j) => j.status_pekerjaan === q.status);

    const buffer = await generateExcelReport(jobs, req.user.name);
    const filename = `Rekapitulasi_SIMON-KONTRAK_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
