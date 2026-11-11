import { StageType } from '../types';

/**
 * Template checklist dokumen standar per tahapan (docs/BUSINESS_LOGIC.md §1).
 * Diinisialisasi otomatis saat paket pekerjaan baru dibuat.
 */
export const DEFAULT_DOCUMENT_TEMPLATES: Record<StageType, string[]> = {
  prakualifikasi: [
    'Dokumen Persyaratan Kualifikasi',
    'Nomor Induk Berusaha (NIB)',
    'Surat Keterangan Domisili Perusahaan',
    'Izin Usaha / Sertifikat Badan Usaha (SBU)',
    'Akta Pendirian & Perubahan Terakhir',
    'SK Pengesahan Kemenkumham',
    'NPWP & Bukti Lapor SPT Tahunan',
    'Dokumen Kualifikasi Teknis (Pengalaman & Tenaga Ahli)',
    'Laporan Keuangan / Kemampuan Keuangan',
    'Pakta Integritas',
  ],
  kontrak: [
    'SPPBJ (Surat Penunjukan Penyedia Barang/Jasa)',
    'Surat Pernyataan Kesanggupan',
    'Jaminan Pelaksanaan (Bank Garansi)',
    'Draft Kontrak',
    'Buku Kontrak Bertandatangan',
    'SPMK (Surat Perintah Mulai Kerja)',
    'Kurva S & Jadwal Pelaksanaan',
    'Berita Acara Pre-Award Meeting',
  ],
  pelaksanaan: [
    'Laporan Realisasi Fisik Lapangan',
    'Laporan Harian Pelaksanaan',
    'Laporan Mingguan Pengawas',
    'Laporan Bulanan Pengawas',
    'Mutual Check (MC) Awal / MC-0',
    'Mutual Check (MC) Akhir',
    'Dokumentasi Foto Progres (0%, 50%, 100%)',
    'Penyelesaian Cacat Mutu (Punchlist)',
  ],
  serah_terima: [
    'Berita Acara Pemeriksaan (BAP)',
    'BAST Pertama (PHO)',
    'As-Built Drawings & Manual Garansi',
    'Kwitansi Pembayaran 100%',
    'BAST Akhir (FHO)',
  ],
};
