import ExcelJS from 'exceljs';
import { JobWithProgress } from '../types';

// ============================================================
// IDENTITAS RESMI PERUSAHAAN (docs/BUSINESS_LOGIC.md §4)
// ============================================================

export const COMPANY = {
  name: 'PT. MULIA BUANA DARMA TRANS',
  address:
    'Jln. Darmawangsa X No. 4E, Kelurahan Cipete Utara, Kecamatan Kebayoran Baru, Jakarta Selatan 12160',
  contact: 'Telepon: +62 21 27099807 | E-mail: admin@muliabuanadarmatrans.com',
  city: 'Jakarta',
  director: 'Ir. H. Budiarto Santoso, M.M.',
  directorTitle: 'Direktur Utama',
} as const;

const NAVY = 'FF1E3A5F';
const LIGHT = 'FFF1F5F9';

function formatDateId(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

/**
 * Membuat laporan rekapitulasi Excel dengan kop surat resmi perusahaan.
 */
export async function generateExcelReport(
  jobs: JobWithProgress[],
  printedBy?: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SIMON-KONTRAK';
  wb.company = COMPANY.name;
  wb.created = new Date();

  const ws = wb.addWorksheet('Rekapitulasi Pekerjaan', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    headerFooter: {
      oddFooter: `&L${COMPANY.name} — SIMON-KONTRAK&RHalaman &P dari &N`,
    },
  });

  ws.columns = [
    { key: 'no', width: 5 },
    { key: 'nomor', width: 28 },
    { key: 'nama', width: 46 },
    { key: 'penyedia', width: 30 },
    { key: 'nilai', width: 20 },
    { key: 'tahun', width: 9 },
    { key: 'ppk', width: 30 },
    { key: 'status', width: 17 },
    { key: 'progres', width: 11 },
    { key: 'target', width: 18 },
  ];
  const lastCol = 'J';

  // ---------- KOP SURAT ----------
  const kop: { text: string; size: number; bold: boolean; color?: string }[] = [
    { text: COMPANY.name, size: 18, bold: true, color: NAVY },
    { text: COMPANY.address, size: 10, bold: false },
    { text: COMPANY.contact, size: 10, bold: false },
  ];
  kop.forEach((line, i) => {
    const r = i + 1;
    ws.mergeCells(`A${r}:${lastCol}${r}`);
    const cell = ws.getCell(`A${r}`);
    cell.value = line.text;
    cell.font = { name: 'Arial', size: line.size, bold: line.bold, color: line.color ? { argb: line.color } : undefined };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  ws.getRow(1).height = 28;

  // Garis tebal di bawah kop
  for (let c = 1; c <= 10; c++) {
    ws.getRow(3).getCell(c).border = { bottom: { style: 'double', color: { argb: NAVY } } };
  }

  // ---------- JUDUL ----------
  ws.mergeCells(`A5:${lastCol}5`);
  const title = ws.getCell('A5');
  title.value = 'REKAPITULASI PROGRES PEKERJAAN & KELENGKAPAN DOKUMEN KONTRAK';
  title.font = { name: 'Arial', size: 13, bold: true };
  title.alignment = { horizontal: 'center' };

  ws.mergeCells(`A6:${lastCol}6`);
  const sub = ws.getCell('A6');
  sub.value = `Per tanggal ${formatDateId(new Date())} — Total ${jobs.length} paket pekerjaan`;
  sub.font = { name: 'Arial', size: 10, italic: true };
  sub.alignment = { horizontal: 'center' };

  // ---------- HEADER TABEL ----------
  const headerRowIdx = 8;
  const headers = [
    'No', 'Nomor Pekerjaan', 'Nama Pekerjaan', 'Penyedia', 'Nilai Kontrak (Rp)',
    'Tahun', 'PPK / Penanggung Jawab', 'Status', 'Progres (%)', 'Target Selesai',
  ];
  const headerRow = ws.getRow(headerRowIdx);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });
  headerRow.height = 30;

  // ---------- DATA ----------
  jobs.forEach((job, idx) => {
    const row = ws.getRow(headerRowIdx + 1 + idx);
    row.values = [
      idx + 1,
      job.nomor_pekerjaan,
      job.nama_pekerjaan,
      job.nama_penyedia,
      Number(job.nilai_pekerjaan),
      job.tahun_anggaran,
      job.penanggung_jawab,
      job.status_pekerjaan,
      job.calculated_progress / 100,
      formatDateId(job.target_penyelesaian),
    ];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true, horizontal: [1, 6, 8, 9].includes(col) ? 'center' : 'left' };
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
    });
    row.getCell(5).numFmt = '"Rp "#,##0';
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'top' };
    row.getCell(9).numFmt = '0.0%';
  });

  // ---------- TOTAL ----------
  const totalRowIdx = headerRowIdx + jobs.length + 1;
  ws.mergeCells(`A${totalRowIdx}:D${totalRowIdx}`);
  const totalLabel = ws.getCell(`A${totalRowIdx}`);
  totalLabel.value = 'TOTAL NILAI KONTRAK / RATA-RATA PROGRES';
  totalLabel.font = { name: 'Arial', size: 10, bold: true };
  totalLabel.alignment = { horizontal: 'right' };

  const totalValue = ws.getCell(`E${totalRowIdx}`);
  totalValue.value = jobs.reduce((s, j) => s + Number(j.nilai_pekerjaan), 0);
  totalValue.numFmt = '"Rp "#,##0';
  totalValue.font = { name: 'Arial', size: 10, bold: true };

  const avgCell = ws.getCell(`I${totalRowIdx}`);
  avgCell.value = jobs.length ? jobs.reduce((s, j) => s + j.calculated_progress, 0) / jobs.length / 100 : 0;
  avgCell.numFmt = '0.0%';
  avgCell.font = { name: 'Arial', size: 10, bold: true };
  avgCell.alignment = { horizontal: 'center' };

  for (let c = 1; c <= 10; c++) {
    const cell = ws.getRow(totalRowIdx).getCell(c);
    cell.border = thinBorder;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  }

  // ---------- PENGESAHAN ----------
  const signStart = totalRowIdx + 3;
  const signCol = 'H';
  const signEnd = lastCol;
  const signLines: { text: string; bold?: boolean; underline?: boolean }[] = [
    { text: `${COMPANY.city}, ${formatDateId(new Date())}` },
    { text: COMPANY.name, bold: true },
    { text: COMPANY.directorTitle },
    { text: '' },
    { text: '' },
    { text: '' },
    { text: COMPANY.director, bold: true, underline: true },
  ];
  signLines.forEach((line, i) => {
    const r = signStart + i;
    ws.mergeCells(`${signCol}${r}:${signEnd}${r}`);
    const cell = ws.getCell(`${signCol}${r}`);
    cell.value = line.text;
    cell.font = { name: 'Arial', size: 10, bold: line.bold, underline: line.underline };
    cell.alignment = { horizontal: 'center' };
  });

  const noteRow = signStart + signLines.length + 2;
  ws.mergeCells(`A${noteRow}:${lastCol}${noteRow}`);
  const note = ws.getCell(`A${noteRow}`);
  note.value = `Dokumen ini dihasilkan otomatis oleh SIMON-KONTRAK${printedBy ? ` — dicetak oleh ${printedBy}` : ''} pada ${new Date().toLocaleString('id-ID')}.`;
  note.font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF64748B' } };

  ws.views = [{ state: 'frozen', ySplit: headerRowIdx }];

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}
