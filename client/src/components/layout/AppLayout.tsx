import React from 'react'
import { Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../common/Spinner'

interface AppLayoutProps {
  children: React.ReactNode
  onPrint?: () => void
  showPrint?: boolean
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, onPrint, showPrint }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header onPrint={onPrint} showPrint={showPrint} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
