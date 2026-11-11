import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart2,
  Briefcase,
  Users,
  LogOut,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../common/Badge'
import type { UserRole } from '../../types'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <BarChart2 size={18} />, label: 'Dashboard' },
  { to: '/jobs', icon: <Briefcase size={18} />, label: 'Pekerjaan' },
  { to: '/reports', icon: <FileText size={18} />, label: 'Laporan' },
  { to: '/users', icon: <Users size={18} />, label: 'Pengguna', roles: ['admin'] },
]

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

const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 h-screen bg-navy-900 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SIMON-KONTRAK</p>
            <p className="text-navy-300 text-xs leading-tight">PT. Mulia Buana Darma Trans</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.roles && !hasRole(item.roles)) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </span>
              <ChevronRight
                size={14}
                className="opacity-0 group-hover:opacity-60 transition-opacity"
              />
            </NavLink>
          )
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-navy-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-navy-800 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-navy-300 text-xs truncate">@{user?.username}</p>
          </div>
          {user?.role && (
            <Badge variant={roleBadgeVariant[user.role]} className="text-xs flex-shrink-0">
              {roleLabels[user.role]}
            </Badge>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700 transition-colors text-sm"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
