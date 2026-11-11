import React, { useState } from 'react'
import { FileText, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/common/Button'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login({ username, password })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login gagal. Periksa kembali username dan password Anda.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 text-white backdrop-blur-sm border border-white/20 mb-4 shadow-xl">
            <FileText size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">SIMON-KONTRAK</h1>
          <p className="text-xs text-navy-200 mt-1 uppercase tracking-widest font-medium">
            Sistem Monitoring Dokumen Kontrak Pengadaan
          </p>
          <p className="text-xs text-navy-300 mt-0.5">PT. MULIA BUANA DARMA TRANS</p>
        </div>

        {/* Card Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Masuk ke Sistem</h2>
            <p className="text-xs text-gray-500 mt-1">
              Gunakan akun terdaftar untuk mengakses data monitoring kontrak
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / operator / pimpinan"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 mt-2 bg-navy-800 hover:bg-navy-900 text-white font-semibold text-sm shadow-md"
            >
              Masuk Sekarang
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </form>

          {/* Akun Demo Cepat */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Akun Pengujian Cepat
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin', '123')}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-navy-50 hover:text-navy-700 text-gray-700 rounded-md font-medium border border-gray-200 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('operator', '123')}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-navy-50 hover:text-navy-700 text-gray-700 rounded-md font-medium border border-gray-200 transition-colors"
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('pimpinan', '123')}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-navy-50 hover:text-navy-700 text-gray-700 rounded-md font-medium border border-gray-200 transition-colors"
              >
                Pimpinan
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Password default: <code>123</code></p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-navy-300">
          © {new Date().getFullYear()} PT. Mulia Buana Darma Trans. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default LoginPage
