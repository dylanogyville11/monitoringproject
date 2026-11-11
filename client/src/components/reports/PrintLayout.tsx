import React from 'react'
import { formatRupiah, formatDate, getStageName } from '../../utils/formatters'
import type { JobDetailFull } from '../../types'

interface PrintLayoutProps {
  job: JobDetailFull
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ job }) => {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="print-only text-black bg-white p-6 max-w-4xl mx-auto font-sans leading-tight">
      {/* KOP SURAT RESMI */}
      <div className="border-b-2 border-black pb-3 text-center">
        <h1 className="text-xl font-bold tracking-wider">PT. MULIA BUANA DARMA TRANS</h1>
        <p className="text-xs mt-1">
          Jln. Darmawangsa X No. 4E, Kelurahan Cipete Utara, Kecamatan Kebayoran Baru, Jakarta Selatan 12160
        </p>
        <p className="text-xs">
          Telepon: +62 21 27099807 | E-mail: admin@muliabuanadarmatrans.com
        </p>
      </div>

      {/* JUDUL DOKUMEN */}
      <div className="text-center my-4">
        <h2 className="text-sm font-bold uppercase tracking-wide underline">
          LEMBAR KENDALI KELENGKAPAN DOKUMEN KONTRAK
        </h2>
        <p className="text-xs text-gray-700 mt-0.5">Sistem Informasi Monitoring Kontrak (SIMON-KONTRAK)</p>
      </div>

      {/* INFORMASI PEKERJAAN */}
      <div className="border border-black p-3 mb-4 text-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <span className="font-semibold w-36 inline-block">Nomor Kontrak:</span>
            <span>{job.nomor_pekerjaan}</span>
          </div>
          <div>
            <span className="font-semibold w-36 inline-block">Tahun Anggaran:</span>
            <span>{job.tahun_anggaran}</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold w-36 inline-block">Nama Paket:</span>
            <span className="font-bold">{job.nama_pekerjaan}</span>
          </div>
          <div>
            <span className="font-semibold w-36 inline-block">Penyedia Jasa:</span>
            <span>{job.nama_penyedia}</span>
          </div>
          <div>
            <span className="font-semibold w-36 inline-block">Nilai Kontrak:</span>
            <span className="font-bold">{formatRupiah(job.nilai_pekerjaan)}</span>
          </div>
          <div>
            <span className="font-semibold w-36 inline-block">PPK:</span>
            <span>{job.penanggung_jawab}</span>
          </div>
          <div>
            <span className="font-semibold w-36 inline-block">Status Pekerjaan:</span>
            <span className="font-semibold">{job.status_pekerjaan}</span>
          </div>
          <div>
            <span className="font-semibold w-36 inline-block">Periode Pelaksanaan:</span>
            <span>
              {formatDate(job.tanggal_mulai)} s.d. {formatDate(job.target_penyelesaian)}
            </span>
          </div>
          <div>
            <span className="font-semibold w-36 inline-block">Akumulasi Progres:</span>
            <span className="font-bold text-sm">{job.calculated_progress.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* TABEL CHECKLIST DOKUMEN SELURUH TAHAPAN */}
      {job.stages?.map((stage, sIdx) => {
        const stageProgress = job.stage_progress?.[stage.stage_type]
        return (
          <div key={stage.id} className="mb-4 break-inside-avoid">
            <div className="bg-gray-100 border border-black px-2 py-1 flex justify-between items-center text-xs font-bold">
              <span>
                Tahap {sIdx + 1}: {getStageName(stage.stage_type)} (Bobot: {stage.weight}%)
              </span>
              <span>
                Progres Tahap:{' '}
                {stageProgress !== null && stageProgress !== undefined
                  ? `${stageProgress.toFixed(1)}%`
                  : 'Dikecualikan'}
              </span>
            </div>

            <table className="w-full border-collapse border border-black text-[11px] mt-1">
              <thead>
                <tr className="bg-gray-50 border-b border-black text-center">
                  <th className="border-r border-black p-1 w-8">No</th>
                  <th className="border-r border-black p-1 text-left">Nama Dokumen</th>
                  <th className="border-r border-black p-1 w-28">Status</th>
                  <th className="border-r border-black p-1 w-14">Progres</th>
                  <th className="border-r border-black p-1 w-24">Tgl Selesai</th>
                  <th className="border-r border-black p-1 w-32">Verifikator</th>
                  <th className="p-1 w-36">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {stage.document_items?.map((doc, dIdx) => (
                  <tr key={doc.id} className="border-b border-gray-300">
                    <td className="border-r border-black p-1 text-center">{dIdx + 1}</td>
                    <td className="border-r border-black p-1">{doc.nama_dokumen}</td>
                    <td className="border-r border-black p-1 text-center font-medium">
                      {doc.status}
                    </td>
                    <td className="border-r border-black p-1 text-center">
                      {doc.status === 'Sudah Lengkap' ? '100%' : `${doc.progress_pct || 0}%`}
                    </td>
                    <td className="border-r border-black p-1 text-center">
                      {doc.tanggal_selesai ? formatDate(doc.tanggal_selesai) : '-'}
                    </td>
                    <td className="border-r border-black p-1 text-center">
                      {doc.penanggung_jawab || '-'}
                    </td>
                    <td className="p-1 text-xs">{doc.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* LEMBAR PENGESAHAN */}
      <div className="mt-8 pt-4 break-inside-avoid flex justify-between items-start text-xs">
        <div>
          <p className="text-gray-500">Dicetak melalui SIMON-KONTRAK</p>
          <p className="text-gray-500">Tanggal cetak: {printDate}</p>
        </div>

        <div className="text-center w-64">
          <p>Jakarta, {printDate}</p>
          <p className="font-bold mt-1">PT. MULIA BUANA DARMA TRANS</p>
          <p className="mb-16">Direktur Utama</p>
          <p className="font-bold underline text-sm">Ir. H. Budiarto Santoso, M.M.</p>
        </div>
      </div>
    </div>
  )
}

export default PrintLayout
