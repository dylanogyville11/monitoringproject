import React, { useState } from 'react'
import { FileSpreadsheet, Printer, FileText, CheckCircle2 } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import Badge from '../components/common/Badge'
import { useJobs } from '../hooks/useJobs'
import { reportService } from '../services/reportService'
import { formatRupiah, formatDate } from '../utils/formatters'
import type { JobStatus } from '../types'

const statusBadgeVariant = (status: JobStatus): 'default' | 'info' | 'success' | 'danger' | 'warning' => {
  switch (status) {
    case 'Dalam Proses':
      return 'info'
    case 'Selesai':
      return 'success'
    case 'Terlambat':
      return 'danger'
    case 'Butuh Perbaikan':
      return 'warning'
    default:
      return 'default'
  }
}

const ReportsPage: React.FC = () => {
  const { data, isLoading } = useJobs({ limit: 100 })
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await reportService.exportExcel()
    } catch {
      alert('Gagal mengunduh berkas Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const jobs = data?.items || []
  const totalValue = jobs.reduce((s, j) => s + Number(j.nilai_pekerjaan || 0), 0)
  const avgProgress =
    jobs.length > 0
      ? jobs.reduce((s, j) => s + Number(j.calculated_progress || 0), 0) / jobs.length
      : 0
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <AppLayout onPrint={handlePrint} showPrint={true}>
      {/* VERSI CETAK KHUSUS (Hanya muncul saat cetak / PDF) */}
      <div className="print-only text-black bg-white p-6 max-w-5xl mx-auto font-sans leading-tight">
        <div className="border-b-2 border-black pb-3 text-center">
          <h1 className="text-xl font-bold tracking-wider">PT. MULIA BUANA DARMA TRANS</h1>
          <p className="text-xs mt-1">
            Jln. Darmawangsa X No. 4E, Kelurahan Cipete Utara, Kecamatan Kebayoran Baru, Jakarta Selatan 12160
          </p>
          <p className="text-xs">
            Telepon: +62 21 27099807 | E-mail: admin@muliabuanadarmatrans.com
          </p>
        </div>

        <div className="text-center my-4">
          <h2 className="text-sm font-bold uppercase tracking-wide underline">
            REKAPITULASI PROGRES PEKERJAAN & KELENGKAPAN DOKUMEN KONTRAK
          </h2>
          <p className="text-xs text-gray-700 mt-0.5">Per Tanggal {printDate} — Total {jobs.length} Paket Pekerjaan</p>
        </div>

        <table className="w-full border-collapse border border-black text-[11px] mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-center font-bold">
              <th className="border-r border-black p-1.5 w-8">No</th>
              <th className="border-r border-black p-1.5 w-36">Nomor Kontrak</th>
              <th className="border-r border-black p-1.5 text-left">Nama Paket Pekerjaan</th>
              <th className="border-r border-black p-1.5 w-32">Penyedia</th>
              <th className="border-r border-black p-1.5 w-24">Nilai Kontrak</th>
              <th className="border-r border-black p-1.5 w-14">Tahun</th>
              <th className="border-r border-black p-1.5 w-24">Status</th>
              <th className="p-1.5 w-16">Progres</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => (
              <tr key={job.id} className="border-b border-gray-300">
                <td className="border-r border-black p-1.5 text-center">{idx + 1}</td>
                <td className="border-r border-black p-1.5 font-mono text-[10px]">{job.nomor_pekerjaan}</td>
                <td className="border-r border-black p-1.5 font-medium">{job.nama_pekerjaan}</td>
                <td className="border-r border-black p-1.5">{job.nama_penyedia}</td>
                <td className="border-r border-black p-1.5 text-right whitespace-nowrap">
                  {formatRupiah(job.nilai_pekerjaan)}
                </td>
                <td className="border-r border-black p-1.5 text-center">{job.tahun_anggaran}</td>
                <td className="border-r border-black p-1.5 text-center">{job.status_pekerjaan}</td>
                <td className="p-1.5 text-center font-semibold">
                  {(job.calculated_progress || 0).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 border-t border-black font-bold">
              <td colSpan={4} className="border-r border-black p-1.5 text-right">
                TOTAL PAGU KONTRAK / RATA-RATA PROGRES:
              </td>
              <td className="border-r border-black p-1.5 text-right whitespace-nowrap">
                {formatRupiah(totalValue)}
              </td>
              <td className="border-r border-black p-1.5"></td>
              <td className="border-r border-black p-1.5"></td>
              <td className="p-1.5 text-center">{avgProgress.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>

        <div className="flex justify-between items-start text-xs pt-4 break-inside-avoid">
          <div>
            <p className="text-gray-500">Dicetak melalui SIMON-KONTRAK</p>
            <p className="text-gray-500">Tanggal: {printDate}</p>
          </div>
          <div className="text-center w-64">
            <p>Jakarta, {printDate}</p>
            <p className="font-bold mt-1">PT. MULIA BUANA DARMA TRANS</p>
            <p className="mb-14">Direktur Utama</p>
            <p className="font-bold underline text-sm">Ir. H. Budiarto Santoso, M.M.</p>
          </div>
        </div>
      </div>

      {/* VERSI LAYAR */}
      <div className="space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="text-navy-800" size={26} />
              Laporan Rekapitulasi Monitoring
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Rekapitulasi resmi pengadaan dan administrasi dokumen PT. Mulia Buana Darma Trans
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm"
            >
              <Printer size={15} className="mr-1 text-navy-700" />
              Cetak Format A4 (PDF)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportExcel}
              isLoading={isExporting}
              className="shadow-sm"
            >
              <FileSpreadsheet size={15} className="mr-1 text-green-400" />
              Ekspor Excel (.xlsx)
            </Button>
          </div>
        </div>

        {/* 3 Ringkasan Eksekutif */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-400 font-semibold block uppercase">Total Paket</span>
            <div className="text-3xl font-black text-gray-900 mt-1">{jobs.length} Paket</div>
            <span className="text-xs text-navy-700 font-medium mt-1 block">Tercatat di sistem</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-400 font-semibold block uppercase">Total Nilai Pagu</span>
            <div className="text-2xl font-black text-navy-900 mt-1">{formatRupiah(totalValue)}</div>
            <span className="text-xs text-green-600 font-medium mt-1 block">Akumulasi seluruh anggaran</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-400 font-semibold block uppercase">Rata-rata Progres</span>
            <div className="text-3xl font-black text-blue-700 mt-1">{avgProgress.toFixed(1)}%</div>
            <span className="text-xs text-gray-500 font-medium mt-1 block">Tingkat capaian agregat</span>
          </div>
        </div>

        {/* Preview Tabel Rekapitulasi */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Pratinjau Lembar Rekapitulasi Pekerjaan
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Kop resmi PT. Mulia Buana Darma Trans
            </span>
          </div>

          {isLoading ? (
            <div className="min-h-[250px] flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white font-medium text-xs">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nomor & Nama Paket</th>
                    <th className="py-3 px-4">Penyedia</th>
                    <th className="py-3 px-4">Nilai Kontrak</th>
                    <th className="py-3 px-4 text-center">Tahun</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Progres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {jobs.map((job, idx) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-center text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{job.nama_pekerjaan}</div>
                        <div className="text-[11px] font-mono text-gray-400">{job.nomor_pekerjaan}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{job.nama_penyedia}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">
                        {formatRupiah(job.nilai_pekerjaan)}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{job.tahun_anggaran}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={statusBadgeVariant(job.status_pekerjaan)}>
                          {job.status_pekerjaan}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-navy-900">
                        {(job.calculated_progress || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default ReportsPage
