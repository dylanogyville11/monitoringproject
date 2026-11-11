-- ============================================================
-- SIMON-KONTRAK: Seed Data Awal
-- Jalankan SETELAH 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. SEED USERS (via Supabase Auth)
-- Catatan: Buat user melalui Supabase Auth Dashboard atau
--          gunakan SQL berikut untuk Supabase Local Dev
-- ============================================================

-- Insert ke auth.users (untuk Supabase local/testing)
-- Untuk produksi, gunakan Dashboard Auth atau supabase auth create-user
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    aud, role
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'admin@simonkontrak.com',
        crypt('123', gen_salt('bf')),
        NOW(),
        '{"username": "admin", "name": "Administrator Utama", "role": "admin"}'::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'operator@simonkontrak.com',
        crypt('123', gen_salt('bf')),
        NOW(),
        '{"username": "operator", "name": "Ahmad Fauzi, S.T.", "role": "operator"}'::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated'
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'pimpinan@simonkontrak.com',
        crypt('123', gen_salt('bf')),
        NOW(),
        '{"username": "pimpinan", "name": "Ir. H. Budiarto Santoso, M.M.", "role": "pimpinan"}'::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert ke public.profiles (manual jika trigger tidak aktif)
INSERT INTO public.profiles (id, username, name, nip, role, jabatan, is_active)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'admin',
        'Administrator Utama',
        '197001011990031001',
        'admin',
        'Administrator Sistem & Kontrak',
        TRUE
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'operator',
        'Ahmad Fauzi, S.T.',
        '198505152010011002',
        'operator',
        'Project Manager & Pengawas Operasional Lapangan',
        TRUE
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'pimpinan',
        'Ir. H. Budiarto Santoso, M.M.',
        '196501011988031003',
        'pimpinan',
        'Direktur Utama',
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. SEED JOBS (6 Paket Pekerjaan Contoh)
-- ============================================================

INSERT INTO public.jobs (
    id, nomor_pekerjaan, nama_pekerjaan, nama_penyedia,
    nilai_pekerjaan, tahun_anggaran, penanggung_jawab,
    tanggal_mulai, target_penyelesaian, status_pekerjaan, keterangan, created_by
)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        '602.1/045/KTR-DPUPR/2026',
        'Pembangunan Gedung Pelayanan Terpadu RSUD Kelas B',
        'PT. Wijaya Graha Pratama',
        4750000000, 2026,
        'Dr. Ir. Hendra Setiawan, S.T., M.T.',
        '2026-03-01', '2026-11-30',
        'Dalam Proses',
        'Progres fisik mencapai 72%. Perlu percepatan di minggu ini.',
        'a0000000-0000-0000-0000-000000000001'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        '603.2/012/KTR-KOMINFO/2026',
        'Pengadaan & Instalasi Infrastruktur Smart City Phase II',
        'PT. Teknologi Nusantara Digital',
        2800000000, 2026,
        'Drs. Bambang Susilo, M.Si.',
        '2026-01-15', '2026-10-31',
        'Selesai',
        'Seluruh tahapan kontrak selesai. BAST final sudah ditandatangani.',
        'a0000000-0000-0000-0000-000000000001'
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        '604.1/078/KTR-DISHUB/2026',
        'Perbaikan & Peningkatan Jalan Lingkar Selatan Kota',
        'CV. Bumi Karya Mandiri',
        1950000000, 2026,
        'Ir. Siti Rahayu Dewi, M.T.',
        '2026-05-01', '2026-12-15',
        'Terlambat',
        'Pekerjaan terlambat 15 hari dari jadwal. Faktor cuaca ekstrem.',
        'a0000000-0000-0000-0000-000000000002'
    ),
    (
        'b0000000-0000-0000-0000-000000000004',
        '605.3/034/KTR-DISDIK/2026',
        'Renovasi & Pembangunan Ruang Kelas SMPN 5 Wilayah Timur',
        'PT. Cipta Bangun Sejahtera',
        875000000, 2026,
        'Dra. Nurlaelah, M.Pd.',
        '2026-06-01', '2026-12-30',
        'Dalam Proses',
        'Pekerjaan struktural selesai, sedang tahap finishing interior.',
        'a0000000-0000-0000-0000-000000000002'
    ),
    (
        'b0000000-0000-0000-0000-000000000005',
        '601.4/091/KTR-DINKES/2026',
        'Pengadaan Peralatan Medis Puskesmas Rawat Inap',
        'PT. Medika Andalan Sejahtera',
        3200000000, 2026,
        'dr. Agus Purnomo, M.Kes.',
        '2026-07-01', '2026-12-31',
        'Butuh Perbaikan',
        'Ditemukan deviasi spesifikasi alat pada 3 item. Proses klaim garansi.',
        'a0000000-0000-0000-0000-000000000001'
    ),
    (
        'b0000000-0000-0000-0000-000000000006',
        '606.1/005/KTR-DPU/2027',
        'Pembangunan Jembatan Penghubung Desa Karya Mukti',
        'PT. Konstruksi Prima Jaya',
        5840000000, 2027,
        'Ir. Rudi Hartono, M.T.',
        '2027-01-15', '2027-12-31',
        'Belum Dimulai',
        'Kontrak baru ditandatangani. Menunggu SPMK.',
        'a0000000-0000-0000-0000-000000000001'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. SEED STAGES (4 Tahapan per Job)
-- ============================================================

-- Tahapan untuk Job 1
INSERT INTO public.stages (id, job_id, stage_type, weight, order_index) VALUES
    ('c0000001-0001-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'prakualifikasi', 15, 1),
    ('c0000001-0001-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'kontrak', 25, 2),
    ('c0000001-0001-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'pelaksanaan', 40, 3),
    ('c0000001-0001-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'serah_terima', 20, 4)
ON CONFLICT DO NOTHING;

-- Tahapan untuk Job 2
INSERT INTO public.stages (id, job_id, stage_type, weight, order_index) VALUES
    ('c0000002-0001-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'prakualifikasi', 15, 1),
    ('c0000002-0001-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'kontrak', 25, 2),
    ('c0000002-0001-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'pelaksanaan', 40, 3),
    ('c0000002-0001-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'serah_terima', 20, 4)
ON CONFLICT DO NOTHING;

-- Tahapan untuk Job 3
INSERT INTO public.stages (id, job_id, stage_type, weight, order_index) VALUES
    ('c0000003-0001-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'prakualifikasi', 15, 1),
    ('c0000003-0001-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'kontrak', 25, 2),
    ('c0000003-0001-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'pelaksanaan', 40, 3),
    ('c0000003-0001-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'serah_terima', 20, 4)
ON CONFLICT DO NOTHING;

-- Tahapan untuk Job 4
INSERT INTO public.stages (id, job_id, stage_type, weight, order_index) VALUES
    ('c0000004-0001-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'prakualifikasi', 15, 1),
    ('c0000004-0001-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'kontrak', 25, 2),
    ('c0000004-0001-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'pelaksanaan', 40, 3),
    ('c0000004-0001-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'serah_terima', 20, 4)
ON CONFLICT DO NOTHING;

-- Tahapan untuk Job 5
INSERT INTO public.stages (id, job_id, stage_type, weight, order_index) VALUES
    ('c0000005-0001-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'prakualifikasi', 15, 1),
    ('c0000005-0001-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'kontrak', 25, 2),
    ('c0000005-0001-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'pelaksanaan', 40, 3),
    ('c0000005-0001-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'serah_terima', 20, 4)
ON CONFLICT DO NOTHING;

-- Tahapan untuk Job 6
INSERT INTO public.stages (id, job_id, stage_type, weight, order_index) VALUES
    ('c0000006-0001-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'prakualifikasi', 15, 1),
    ('c0000006-0001-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'kontrak', 25, 2),
    ('c0000006-0001-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'pelaksanaan', 40, 3),
    ('c0000006-0001-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006', 'serah_terima', 20, 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. SEED DOCUMENT ITEMS untuk Job 1 (Contoh lengkap)
-- ============================================================

-- Tahap 1: Prakualifikasi (stage c0000001-0001-0000-0000-000000000001)
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000001-0001-0000-0000-000000000001', 'Dokumen Persyaratan Kualifikasi', 'Sudah Lengkap', 100, 1),
    ('c0000001-0001-0000-0000-000000000001', 'Nomor Induk Berusaha (NIB)', 'Sudah Lengkap', 100, 2),
    ('c0000001-0001-0000-0000-000000000001', 'Surat Domisili Perusahaan', 'Sudah Lengkap', 100, 3),
    ('c0000001-0001-0000-0000-000000000001', 'Izin Usaha Jasa Konstruksi (IUJK)', 'Sudah Lengkap', 100, 4),
    ('c0000001-0001-0000-0000-000000000001', 'Akta Pendirian & Perubahan Terakhir', 'Sudah Lengkap', 100, 5),
    ('c0000001-0001-0000-0000-000000000001', 'SK Kemenkumham', 'Sudah Lengkap', 100, 6),
    ('c0000001-0001-0000-0000-000000000001', 'Sertifikat Badan Usaha (SBU)', 'Sudah Lengkap', 100, 7),
    ('c0000001-0001-0000-0000-000000000001', 'NPWP & SPT Pajak Terakhir', 'Sudah Lengkap', 100, 8),
    ('c0000001-0001-0000-0000-000000000001', 'Pakta Integritas', 'Sudah Lengkap', 100, 9),
    ('c0000001-0001-0000-0000-000000000001', 'Referensi Pengalaman Kerja 10 Tahun', 'Sudah Lengkap', 100, 10);

-- Tahap 2: Kontrak (stage c0000001-0001-0000-0000-000000000002)
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000001-0001-0000-0000-000000000002', 'SPPBJ (Surat Penunjukan Penyedia Barang/Jasa)', 'Sudah Lengkap', 100, 1),
    ('c0000001-0001-0000-0000-000000000002', 'Surat Pernyataan Kesanggupan', 'Sudah Lengkap', 100, 2),
    ('c0000001-0001-0000-0000-000000000002', 'Jaminan Pelaksanaan (Bank Garansi)', 'Sudah Lengkap', 100, 3),
    ('c0000001-0001-0000-0000-000000000002', 'Draft & Review Naskah Kontrak', 'Sudah Lengkap', 100, 4),
    ('c0000001-0001-0000-0000-000000000002', 'Buku Kontrak Bertandatangan', 'Sudah Lengkap', 100, 5),
    ('c0000001-0001-0000-0000-000000000002', 'SPMK (Surat Perintah Mulai Kerja)', 'Sudah Lengkap', 100, 6),
    ('c0000001-0001-0000-0000-000000000002', 'Kurva S & Jadwal Pelaksanaan', 'Sudah Lengkap', 100, 7),
    ('c0000001-0001-0000-0000-000000000002', 'BA Pre-Award Meeting', 'Sudah Lengkap', 100, 8);

-- Tahap 3: Pelaksanaan (stage c0000001-0001-0000-0000-000000000003)
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000001-0001-0000-0000-000000000003', 'Laporan Realisasi Fisik Mingguan', 'Dalam Proses', 70, 1),
    ('c0000001-0001-0000-0000-000000000003', 'Laporan Bulanan Pengawas Konsultan', 'Dalam Proses', 60, 2),
    ('c0000001-0001-0000-0000-000000000003', 'Mutual Check (MC) Termin I', 'Sudah Lengkap', 100, 3),
    ('c0000001-0001-0000-0000-000000000003', 'Mutual Check (MC) Termin II', 'Dalam Proses', 50, 4),
    ('c0000001-0001-0000-0000-000000000003', 'Hasil Uji Mutu Beton & Material', 'Perlu Perbaikan', 30, 5),
    ('c0000001-0001-0000-0000-000000000003', 'Dokumentasi Foto Lapangan', 'Dalam Proses', 75, 6),
    ('c0000001-0001-0000-0000-000000000003', 'Buku Harian Pekerjaan (Logbook)', 'Dalam Proses', 70, 7),
    ('c0000001-0001-0000-0000-000000000003', 'Penyelesaian Punchlist / Cacat Mutu', 'Belum Disiapkan', 0, 8);

-- Tahap 4: Serah Terima (stage c0000001-0001-0000-0000-000000000004)
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000001-0001-0000-0000-000000000004', 'Berita Acara Pemeriksaan (BAP)', 'Belum Disiapkan', 0, 1),
    ('c0000001-0001-0000-0000-000000000004', 'BAST Pertama / PHO', 'Belum Disiapkan', 0, 2),
    ('c0000001-0001-0000-0000-000000000004', 'As-Built Drawings & Manual Garansi', 'Belum Disiapkan', 0, 3),
    ('c0000001-0001-0000-0000-000000000004', 'Kwitansi Pembayaran 100%', 'Belum Disiapkan', 0, 4),
    ('c0000001-0001-0000-0000-000000000004', 'BAST Akhir / FHO', 'Belum Disiapkan', 0, 5);

-- ============================================================
-- 5. SEED DOCUMENT ITEMS untuk Job 2 (Selesai - 100%)
-- ============================================================

INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000002-0001-0000-0000-000000000001', 'Dokumen Persyaratan Kualifikasi', 'Sudah Lengkap', 100, 1),
    ('c0000002-0001-0000-0000-000000000001', 'NIB & Domisili Perusahaan', 'Sudah Lengkap', 100, 2),
    ('c0000002-0001-0000-0000-000000000001', 'Izin Usaha & Legalitas', 'Sudah Lengkap', 100, 3);

INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000002-0001-0000-0000-000000000002', 'SPPBJ & Kontrak', 'Sudah Lengkap', 100, 1),
    ('c0000002-0001-0000-0000-000000000002', 'Jaminan Pelaksanaan', 'Sudah Lengkap', 100, 2),
    ('c0000002-0001-0000-0000-000000000002', 'SPMK & Kurva S', 'Sudah Lengkap', 100, 3);

INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000002-0001-0000-0000-000000000003', 'Laporan Realisasi Fisik', 'Sudah Lengkap', 100, 1),
    ('c0000002-0001-0000-0000-000000000003', 'Laporan Pengawas', 'Sudah Lengkap', 100, 2),
    ('c0000002-0001-0000-0000-000000000003', 'BA Pemeriksaan Tahapan', 'Sudah Lengkap', 100, 3);

INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000002-0001-0000-0000-000000000004', 'Berita Acara Pemeriksaan (BAP)', 'Sudah Lengkap', 100, 1),
    ('c0000002-0001-0000-0000-000000000004', 'BAST Final / FHO', 'Sudah Lengkap', 100, 2),
    ('c0000002-0001-0000-0000-000000000004', 'As-Built Drawings', 'Sudah Lengkap', 100, 3),
    ('c0000002-0001-0000-0000-000000000004', 'Kwitansi 100%', 'Sudah Lengkap', 100, 4);

-- ============================================================
-- 6. SEED DOCUMENT ITEMS untuk Job 3–6 (Template dasar)
-- ============================================================

-- Job 3 - Terlambat
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000003-0001-0000-0000-000000000001', 'Dokumen Kualifikasi', 'Sudah Lengkap', 100, 1),
    ('c0000003-0001-0000-0000-000000000001', 'NIB & Legalitas', 'Sudah Lengkap', 100, 2),
    ('c0000003-0001-0000-0000-000000000002', 'SPPBJ & Kontrak', 'Sudah Lengkap', 100, 1),
    ('c0000003-0001-0000-0000-000000000002', 'Jaminan Pelaksanaan', 'Sudah Lengkap', 100, 2),
    ('c0000003-0001-0000-0000-000000000003', 'Laporan Mingguan', 'Dalam Proses', 40, 1),
    ('c0000003-0001-0000-0000-000000000003', 'Dokumentasi Lapangan', 'Perlu Perbaikan', 25, 2),
    ('c0000003-0001-0000-0000-000000000004', 'BAST & Serah Terima', 'Belum Disiapkan', 0, 1);

-- Job 4 - Dalam Proses
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000004-0001-0000-0000-000000000001', 'Dokumen Kualifikasi', 'Sudah Lengkap', 100, 1),
    ('c0000004-0001-0000-0000-000000000001', 'NIB & Legalitas', 'Sudah Lengkap', 100, 2),
    ('c0000004-0001-0000-0000-000000000002', 'SPPBJ & Kontrak', 'Sudah Lengkap', 100, 1),
    ('c0000004-0001-0000-0000-000000000002', 'SPMK', 'Sudah Lengkap', 100, 2),
    ('c0000004-0001-0000-0000-000000000003', 'Laporan Realisasi Fisik', 'Dalam Proses', 65, 1),
    ('c0000004-0001-0000-0000-000000000003', 'Laporan Pengawas', 'Dalam Proses', 60, 2),
    ('c0000004-0001-0000-0000-000000000004', 'BAST', 'Belum Disiapkan', 0, 1);

-- Job 5 - Butuh Perbaikan
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000005-0001-0000-0000-000000000001', 'Dokumen Kualifikasi', 'Sudah Lengkap', 100, 1),
    ('c0000005-0001-0000-0000-000000000002', 'SPPBJ & Kontrak', 'Sudah Lengkap', 100, 1),
    ('c0000005-0001-0000-0000-000000000002', 'Jaminan Pelaksanaan', 'Sudah Lengkap', 100, 2),
    ('c0000005-0001-0000-0000-000000000003', 'BA Penerimaan Barang', 'Perlu Perbaikan', 25, 1),
    ('c0000005-0001-0000-0000-000000000003', 'Sertifikat Kalibrasi Alat', 'Perlu Perbaikan', 20, 2),
    ('c0000005-0001-0000-0000-000000000003', 'Manual Operasional', 'Dalam Proses', 50, 3),
    ('c0000005-0001-0000-0000-000000000004', 'BAST', 'Belum Disiapkan', 0, 1);

-- Job 6 - Belum Dimulai
INSERT INTO public.document_items (stage_id, nama_dokumen, status, progress_pct, order_index) VALUES
    ('c0000006-0001-0000-0000-000000000001', 'Dokumen Persyaratan Kualifikasi', 'Belum Disiapkan', 0, 1),
    ('c0000006-0001-0000-0000-000000000001', 'NIB & Domisili Perusahaan', 'Belum Disiapkan', 0, 2),
    ('c0000006-0001-0000-0000-000000000001', 'Izin Usaha & Legalitas', 'Belum Disiapkan', 0, 3),
    ('c0000006-0001-0000-0000-000000000002', 'SPPBJ & Kontrak', 'Belum Disiapkan', 0, 1),
    ('c0000006-0001-0000-0000-000000000002', 'Jaminan Pelaksanaan', 'Belum Disiapkan', 0, 2),
    ('c0000006-0001-0000-0000-000000000003', 'Laporan Realisasi', 'Belum Disiapkan', 0, 1),
    ('c0000006-0001-0000-0000-000000000004', 'BAST', 'Belum Disiapkan', 0, 1);

-- ============================================================
-- 7. SEED JOB NOTES (Contoh)
-- ============================================================

INSERT INTO public.job_notes (job_id, author_id, author_name, content) VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000003',
        'Ir. H. Budiarto Santoso, M.M.',
        'Instruksi: Segera lengkapi hasil uji kubus beton termin II. Target selesai sebelum 20 November 2026.'
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        'Ir. H. Budiarto Santoso, M.M.',
        'Pekerjaan sudah terlambat 15 hari. Minta kontraktor ajukan perpanjangan waktu resmi beserta justifikasi.'
    ),
    (
        'b0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000001',
        'Administrator Utama',
        'Proses klaim garansi alat medis sedang berjalan. Pantau respons PT. Medika Andalan paling lambat 30 November.'
    );
