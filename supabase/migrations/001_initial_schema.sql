-- ============================================================
-- SIMON-KONTRAK: Initial Database Schema
-- PostgreSQL / Supabase Migration
-- ============================================================

-- ============================================================
-- 1. CUSTOM ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'operator', 'pimpinan');

CREATE TYPE stage_type AS ENUM (
    'prakualifikasi',
    'kontrak',
    'pelaksanaan',
    'serah_terima'
);

CREATE TYPE document_status AS ENUM (
    'Sudah Lengkap',
    'Dalam Proses',
    'Belum Disiapkan',
    'Perlu Perbaikan',
    'Tidak Diperlukan'
);

CREATE TYPE job_status AS ENUM (
    'Belum Dimulai',
    'Dalam Proses',
    'Selesai',
    'Terlambat',
    'Butuh Perbaikan'
);

-- ============================================================
-- 2. TABLE: profiles
-- Synchronized with Supabase Auth (auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    nip         VARCHAR(50),
    role        user_role    NOT NULL DEFAULT 'operator',
    jabatan     VARCHAR(150),
    avatar_url  TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. TABLE: jobs
-- Master data pekerjaan / proyek pengadaan
-- ============================================================

CREATE TABLE IF NOT EXISTS public.jobs (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_pekerjaan     VARCHAR(100) NOT NULL UNIQUE,
    nama_pekerjaan      TEXT         NOT NULL,
    nama_penyedia       VARCHAR(255) NOT NULL,
    nilai_pekerjaan     BIGINT       NOT NULL CHECK (nilai_pekerjaan >= 0),
    tahun_anggaran      INT          NOT NULL,
    penanggung_jawab    VARCHAR(150) NOT NULL,
    tanggal_mulai       DATE         NOT NULL,
    target_penyelesaian DATE         NOT NULL,
    status_pekerjaan    job_status   NOT NULL DEFAULT 'Belum Dimulai',
    keterangan          TEXT,
    custom_weights      JSONB,
    created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. TABLE: stages
-- 4 tahapan wajib per pekerjaan
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stages (
    id          UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID       NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    stage_type  stage_type NOT NULL,
    weight      NUMERIC(5,2) NOT NULL DEFAULT 0,
    order_index INT        NOT NULL,
    UNIQUE(job_id, stage_type)
);

-- ============================================================
-- 5. TABLE: document_items
-- Checklist dokumen per tahapan
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_items (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id         UUID            NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    nama_dokumen     VARCHAR(255)    NOT NULL,
    status           document_status NOT NULL DEFAULT 'Belum Disiapkan',
    progress_pct     INT             NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    tanggal_selesai  DATE,
    penanggung_jawab VARCHAR(150),
    keterangan       TEXT,
    is_custom        BOOLEAN         NOT NULL DEFAULT FALSE,
    order_index      INT             NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. TABLE: document_files
-- Metadata file fisik yang diunggah ke Supabase Storage
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_files (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    document_item_id UUID         NOT NULL REFERENCES public.document_items(id) ON DELETE CASCADE,
    file_name        VARCHAR(255) NOT NULL,
    file_path        TEXT         NOT NULL,
    file_size        BIGINT       NOT NULL,
    mime_type        VARCHAR(100),
    uploaded_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. TABLE: job_notes
-- Catatan evaluasi / instruksi per pekerjaan
-- ============================================================

CREATE TABLE IF NOT EXISTS public.job_notes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    author_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name VARCHAR(150),
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. TABLE: audit_logs
-- Jejak audit otomatis untuk setiap perubahan data
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id     UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name  VARCHAR(150),
    action     TEXT        NOT NULL,
    metadata   JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_jobs_tahun_anggaran ON public.jobs(tahun_anggaran);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status_pekerjaan);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_stages_job_id ON public.stages(job_id);
CREATE INDEX IF NOT EXISTS idx_document_items_stage_id ON public.document_items(stage_id);
CREATE INDEX IF NOT EXISTS idx_document_files_document_item_id ON public.document_files(document_item_id);
CREATE INDEX IF NOT EXISTS idx_job_notes_job_id ON public.job_notes(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_job_id ON public.audit_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================
-- 10. TRIGGERS: Auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_document_items_updated_at
    BEFORE UPDATE ON public.document_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 11. TRIGGER: Auto-create profile on new auth.user signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', 'Pengguna Baru'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operator')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

-- profiles: Semua user aktif bisa melihat profil
CREATE POLICY "profiles_select_all" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- profiles: Hanya pemilik profil yang bisa update dirinya sendiri
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- jobs: Semua authenticated user bisa baca
CREATE POLICY "jobs_select_authenticated" ON public.jobs
    FOR SELECT USING (auth.role() = 'authenticated');

-- jobs: Admin & operator bisa insert/update
CREATE POLICY "jobs_insert_admin_operator" ON public.jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'operator') AND is_active = TRUE
        )
    );

CREATE POLICY "jobs_update_admin_operator" ON public.jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'operator') AND is_active = TRUE
        )
    );

-- jobs: Hanya admin yang bisa hapus
CREATE POLICY "jobs_delete_admin_only" ON public.jobs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
        )
    );

-- stages, document_items, document_files, job_notes: semua authenticated bisa baca
CREATE POLICY "stages_select_authenticated" ON public.stages
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "stages_all_admin_operator" ON public.stages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

CREATE POLICY "document_items_select" ON public.document_items
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "document_items_mutate_admin_operator" ON public.document_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

CREATE POLICY "document_files_select" ON public.document_files
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "document_files_mutate_admin_operator" ON public.document_files
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

CREATE POLICY "job_notes_select" ON public.job_notes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "job_notes_mutate_admin_operator" ON public.job_notes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

CREATE POLICY "audit_logs_select_authenticated" ON public.audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 13. SUPABASE STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contract-documents',
    'contract-documents',
    TRUE,
    26214400,  -- 25 MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "storage_read_authenticated" ON storage.objects
    FOR SELECT USING (bucket_id = 'contract-documents' AND auth.role() = 'authenticated');

CREATE POLICY "storage_insert_admin_operator" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contract-documents' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

CREATE POLICY "storage_delete_admin_operator" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'contract-documents' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );
