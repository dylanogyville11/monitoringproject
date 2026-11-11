import React from 'react'
import { Search, RotateCcw } from 'lucide-react'
import Button from '../common/Button'
import type { JobStatus } from '../../types'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: JobStatus | ''
  onStatusChange: (value: JobStatus | '') => void
  tahun: number | ''
  onTahunChange: (value: number | '') => void
  onReset: () => void
}

const statusOptions: { value: JobStatus | ''; label: string }[] = [
  { value: '', label: 'Semua Status' },
  { value: 'Belum Dimulai', label: 'Belum Dimulai' },
  { value: 'Dalam Proses', label: 'Dalam Proses' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Terlambat', label: 'Terlambat' },
  { value: 'Butuh Perbaikan', label: 'Butuh Perbaikan' },
]

const currentYear = new Date().getFullYear()
const yearOptions = [
  { value: '', label: 'Semua Tahun' },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - 2 + i,
    label: String(currentYear - 2 + i),
  })),
]

const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  tahun,
  onTahunChange,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nomor, nama pekerjaan, penyedia, atau PPK..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 bg-white"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as JobStatus | '')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={tahun}
          onChange={(e) => onTahunChange(e.target.value ? Number(e.target.value) : '')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
        >
          {yearOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {(search || status || tahun) && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-gray-500 hover:text-gray-800">
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}

export default FilterBar
