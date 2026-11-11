import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import type { Job, JobFormData, JobStatus } from '../../types'

const jobSchema = z.object({
  nomor_pekerjaan: z.string().min(1, 'Nomor pekerjaan wajib diisi'),
  nama_pekerjaan: z.string().min(1, 'Nama pekerjaan wajib diisi'),
  nama_penyedia: z.string().min(1, 'Nama penyedia wajib diisi'),
  nilai_pekerjaan: z.coerce.number().min(0, 'Nilai pekerjaan minimal 0'),
  tahun_anggaran: z.coerce.number().int().min(2000, 'Tahun tidak valid'),
  penanggung_jawab: z.string().min(1, 'PPK penanggung jawab wajib diisi'),
  tanggal_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  target_penyelesaian: z.string().min(1, 'Target penyelesaian wajib diisi'),
  status_pekerjaan: z.enum([
    'Belum Dimulai',
    'Dalam Proses',
    'Selesai',
    'Terlambat',
    'Butuh Perbaikan',
  ] as [JobStatus, ...JobStatus[]]),
  keterangan: z.string().optional(),
})

interface JobFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Job | null
  onSubmit: (data: JobFormData) => Promise<void>
  isLoading?: boolean
}

const statusOptions = [
  { value: 'Belum Dimulai', label: 'Belum Dimulai' },
  { value: 'Dalam Proses', label: 'Dalam Proses' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Terlambat', label: 'Terlambat' },
  { value: 'Butuh Perbaikan', label: 'Butuh Perbaikan' },
]

const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      nomor_pekerjaan: '',
      nama_pekerjaan: '',
      nama_penyedia: '',
      nilai_pekerjaan: 0,
      tahun_anggaran: new Date().getFullYear(),
      penanggung_jawab: '',
      tanggal_mulai: '',
      target_penyelesaian: '',
      status_pekerjaan: 'Belum Dimulai',
      keterangan: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        nomor_pekerjaan: initialData.nomor_pekerjaan || '',
        nama_pekerjaan: initialData.nama_pekerjaan || '',
        nama_penyedia: initialData.nama_penyedia || '',
        nilai_pekerjaan: initialData.nilai_pekerjaan || 0,
        tahun_anggaran: initialData.tahun_anggaran || new Date().getFullYear(),
        penanggung_jawab: initialData.penanggung_jawab || '',
        tanggal_mulai: initialData.tanggal_mulai || '',
        target_penyelesaian: initialData.target_penyelesaian || '',
        status_pekerjaan: initialData.status_pekerjaan || 'Belum Dimulai',
        keterangan: initialData.keterangan || '',
      })
    } else {
      reset({
        nomor_pekerjaan: '',
        nama_pekerjaan: '',
        nama_penyedia: '',
        nilai_pekerjaan: 0,
        tahun_anggaran: new Date().getFullYear(),
        penanggung_jawab: '',
        tanggal_mulai: '',
        target_penyelesaian: '',
        status_pekerjaan: 'Belum Dimulai',
        keterangan: '',
      })
    }
  }, [initialData, reset, isOpen])

  const onFormSubmit = async (values: JobFormData) => {
    await onSubmit(values)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Ubah Data Pekerjaan' : 'Tambah Paket Pekerjaan Baru'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nomor Kontrak / Pekerjaan"
            required
            placeholder="Contoh: 602.1/045/KTR-DPUPR/2026"
            error={errors.nomor_pekerjaan?.message}
            {...register('nomor_pekerjaan')}
          />
          <Input
            label="Tahun Anggaran"
            type="number"
            required
            error={errors.tahun_anggaran?.message}
            {...register('tahun_anggaran')}
          />
        </div>

        <Input
          label="Nama Paket Pekerjaan"
          required
          placeholder="Nama lengkap paket pekerjaan"
          error={errors.nama_pekerjaan?.message}
          {...register('nama_pekerjaan')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Penyedia / Kontraktor"
            required
            placeholder="PT / CV Penyedia"
            error={errors.nama_penyedia?.message}
            {...register('nama_penyedia')}
          />
          <Input
            label="Nilai Pekerjaan (Rp)"
            type="number"
            required
            placeholder="0"
            error={errors.nilai_pekerjaan?.message}
            {...register('nilai_pekerjaan')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Penanggung Jawab (PPK)"
            required
            placeholder="Nama dan Gelar PPK"
            error={errors.penanggung_jawab?.message}
            {...register('penanggung_jawab')}
          />
          <Select
            label="Status Awal"
            options={statusOptions}
            error={errors.status_pekerjaan?.message}
            {...register('status_pekerjaan')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tanggal Mulai"
            type="date"
            required
            error={errors.tanggal_mulai?.message}
            {...register('tanggal_mulai')}
          />
          <Input
            label="Target Penyelesaian"
            type="date"
            required
            error={errors.target_penyelesaian?.message}
            {...register('target_penyelesaian')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Keterangan / Catatan Tambahan</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-500"
            placeholder="Keterangan singkat deviasi atau status di lapangan..."
            {...register('keterangan')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditing ? 'Simpan Perubahan' : 'Buat Pekerjaan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default JobFormModal
