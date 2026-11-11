import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Printer } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../common/Badge'
import { getGreeting } from '../../utils/formatters'
import type { UserRole } from '../../types'

interface HeaderProps {
  onPrint?: () => void
  showPrint?: boolean
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  jobs: 'Pekerjaan',
  users: 'Pengguna',
  reports: 'Laporan',
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  operator: 'Operator',
  pimpinan: 'Pimpinan',
}

const roleBadgeVariant: Record<UserRole, 'danger' | 'info' | 'success'> = {
  admin: 'danger',
  operator: 'info',
  pimpinan: 'success',
}

const Header: React.FC<HeaderProps> = ({ onPrint, showPrint = false }) => {
  const { user } = useAuth()
  const location = useLocation()

  const pathSegments = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => ({
      label: routeLabels[seg] ?? seg,
      path: `/${seg}`,
    }))

  const greeting = getGreeting()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        <Link to="/dashboard" className="text-gray-400 hover:text-navy-800 transition-colors">
          Beranda
        </Link>
        {pathSegments.map((seg, idx) => (
          <React.Fragment key={seg.path}>
            <ChevronRight size={14} className="text-gray-300" />
            {idx === pathSegments.length - 1 ? (
              <span className="text-navy-900 font-semibold">{seg.label}</span>
            ) : (
              <Link to={seg.path} className="text-gray-400 hover:text-navy-800 transition-colors">
                {seg.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-800">
            {greeting}, {user?.name?.split(' ')[0]}
          </p>
          {user?.jabatan && (
            <p className="text-xs text-gray-500">{user.jabatan}</p>
          )}
        </div>
        {user?.role && (
          <Badge variant={roleBadgeVariant[user.role]}>{roleLabels[user.role]}</Badge>
        )}
        {showPrint && (
          <button
            onClick={onPrint}
            className="p-2 rounded-lg text-gray-500 hover:text-navy-800 hover:bg-gray-100 transition-colors"
            title="Cetak Lembar Kendali"
          >
            <Printer size={18} />
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
