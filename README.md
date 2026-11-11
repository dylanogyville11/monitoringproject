# SIMON-KONTRAK
## Sistem Informasi Monitoring Progres Pekerjaan dan Kelengkapan Dokumen Kontrak

**Milik:** PT. Mulia Buana Darma Trans  
**Alamat:** Jln. Darmawangsa X No. 4E, Kel. Cipete Utara, Kec. Kebayoran Baru, Jakarta Selatan 12160  
**Kontak:** +62 21 27099807 | admin@muliabuanadarmatrans.com

---

## 📋 Deskripsi

SIMON-KONTRAK adalah aplikasi web enterprise untuk memantau, mengelola, dan mengevaluasi tata kelola administrasi dokumen kontrak pengadaan barang/jasa dari tahap pra-lelang hingga serah terima akhir.

**Tech Stack:**
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query
- **Backend:** Node.js + Express.js + TypeScript
- **Database & Auth:** Supabase (PostgreSQL) + Row Level Security
- **Storage:** Supabase Storage Bucket (`contract-documents`)

---

## 🚀 Cara Menjalankan

### 1. Persiapan Database Supabase

1. Buka [Supabase Console](https://app.supabase.com) dan buat project baru
2. Masuk ke **SQL Editor**, jalankan file berikut secara berurutan:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/seed.sql
   ```
3. Pastikan bucket `contract-documents` sudah terbentuk di menu **Storage**
4. Ambil kredensial di **Project Settings → API**:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
   - `JWT Secret`

### 2. Konfigurasi Environment Variables

**Backend** (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

**Frontend** (`client/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install Dependencies

```powershell
# Install semua dependencies sekaligus
npm run install:all

# Atau manual:
npm install
cd server && npm install
cd ../client && npm install
```

### 4. Jalankan Server

```powershell
# Jalankan backend & frontend sekaligus (dari root)
npm run dev

# Atau terpisah:
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:5173

---

## 👤 Akun Default (Seed)

| Username | Password | Role | Deskripsi |
|:---|:---:|:---:|:---|
| `admin` | `123` | Admin | Administrator sistem dengan akses penuh |
| `operator` | `123` | Operator | Project manager & pengawas lapangan |
| `pimpinan` | `123` | Pimpinan | Direktur utama (mode read-only eksekutif) |

---

## 📁 Struktur Proyek

```
simon-kontrak/
├── docs/                    # Dokumentasi lengkap
│   ├── CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   ├── BUSINESS_LOGIC.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── MIGRATION_PROMPT.md
├── supabase/                # Database
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── server/                  # Backend Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
└── package.json             # Root monorepo
```

---

## 🧠 Aturan Bisnis Utama

### Tahapan Kontrak & Bobot Default
| Tahapan | Bobot |
|:---|:---:|
| Prakualifikasi | 15% |
| Berkas Kontrak | 25% |
| Pelaksanaan Pekerjaan | 40% |
| Serah Terima & BAST | 20% |

### Role-Based Access Control
| Fitur | Admin | Operator | Pimpinan |
|:---|:---:|:---:|:---:|
| Melihat Dashboard | ✅ | ✅ | ✅ |
| Kelola Pekerjaan | ✅ | ✅ | ❌ |
| Hapus Pekerjaan | ✅ | ❌ | ❌ |
| Update Status Dokumen | ✅ | ✅ | ❌ |
| Upload File | ✅ | ✅ | ❌ |
| Cetak/Ekspor Laporan | ✅ | ✅ | ✅ |
| Manajemen Pengguna | ✅ | ❌ | ❌ |

---

## 📄 Laporan Resmi

Format kop surat laporan cetak (PDF/Excel):

**PT. MULIA BUANA DARMA TRANS**  
Jln. Darmawangsa X No. 4E, Kelurahan Cipete Utara, Kecamatan Kebayoran Baru, Jakarta Selatan 12160  
Telepon: +62 21 27099807 | E-mail: admin@muliabuanadarmatrans.com  

Penandatangan: **Ir. H. Budiarto Santoso, M.M.** (Direktur Utama)
