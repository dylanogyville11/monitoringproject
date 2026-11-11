import React, { useState } from 'react'
import {
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  DollarSign,
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import StatCard from '../components/dashboard/StatCard'
import StatusPieChart from '../components/dashboard/StatusPieChart'
import JobProgressBarChart from '../components/dashboard/JobProgressBarChart'
import Watchlist from '../components/dashboard/Watchlist'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { useDashboard } from '../hooks/useDashboard'
import { reportService } from '../services/reportService'
import { formatRupiah } from '../utils/formatters'

const DashboardPage: React.FC = () => {
  const { data: dashboard, isLoading, error } = useDashboard()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await reportService.exportExcel()
    } catch (err: unknown) {
      alert('Gagal mengunduh file Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Dashboard Eksekutif
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Ringkasan pemantauan seluruh paket pekerjaan dan administrasi kontrak
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportExcel}
              isLoading={isExporting}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm"
            >
              <FileSpreadsheet size={15} className="mr-1 text-green-600" />
              Ekspor Excel (.xlsx)
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error || !dashboard ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
            Gagal memuat data dashboard. Pastikan server backend sedang berjalan.
          </div>
        ) : (
          <>
            {/* Grid 4 Kartu KPI Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Briefcase size={22} />}
                label="Total Paket Pekerjaan"
                value={dashboard.kpi.total_jobs}
                color="navy"
                subtext={`Pagu: ${formatRupiah(dashboard.kpi.total_contract_value)}`}
              />
              <StatCard
                icon={<Clock size={22} />}
                label="Sedang Berjalan"
                value={dashboard.kpi.dalam_proses}
                color="blue"
                subtext={`Rata-rata progres: ${dashboard.kpi.average_progress.toFixed(1)}%`}
              />
              <StatCard
                icon={<CheckCircle2 size={22} />}
                label="Selesai (BAST Final)"
                value={dashboard.kpi.selesai}
                color="green"
                subtext="Pekerjaan tuntas 100%"
              />
              <StatCard
                icon={<AlertTriangle size={22} />}
                label="Perlu Perhatian"
                value={dashboard.kpi.terlambat + dashboard.kpi.butuh_perbaikan}
                color="red"
                subtext={`${dashboard.kpi.terlambat} terlambat • ${dashboard.kpi.butuh_perbaikan} perbaikan`}
              />
            </div>

            {/* Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart: Distribusi Status */}
              <Card padding className="lg:col-span-1">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Distribusi Status Pekerjaan</h3>
                  <p className="text-xs text-gray-400">Komposisi status seluruh paket pengadaan</p>
                </div>
                <StatusPieChart data={dashboard.charts.status_distribution} />
              </Card>

              {/* Bar Chart: Progres Pekerjaan */}
              <Card padding className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Progres Paket Pekerjaan</h3>
                    <p className="text-xs text-gray-400">10 paket pekerjaan dengan progres terkini</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-navy-800 bg-navy-50 px-2 py-1 rounded-md font-semibold">
                    <TrendingUp size={14} />
                    <span>Rata-rata: {dashboard.kpi.average_progress.toFixed(1)}%</span>
                  </div>
                </div>
                <JobProgressBarChart data={dashboard.charts.job_progress} />
              </Card>
            </div>

            {/* Watchlist Section */}
            <Watchlist
              approachingDeadline={dashboard.watchlist.approaching_deadline}
              requiresAction={dashboard.watchlist.requires_action}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default DashboardPage
