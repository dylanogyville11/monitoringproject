import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, CheckCircle2, XCircle, Shield, Edit2 } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Badge from '../components/common/Badge'
import Spinner from '../components/common/Spinner'
import { userService, CreateUserData } from '../services/userService'
import { useAuth } from '../hooks/useAuth'
import type { Profile, UserRole } from '../types'

const roleOptions = [
  { value: 'admin', label: 'Admin (Akses Penuh)' },
  { value: 'operator', label: 'Operator (Pengelola Dokumen)' },
  { value: 'pimpinan', label: 'Pimpinan (Mode Eksekutif Read-Only)' },
]

const UsersPage: React.FC = () => {
  const { hasRole, user: currentUser } = useAuth()
  const isAdmin = hasRole(['admin'])
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: isAdmin,
  })

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsCreateModalOpen(false)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof userService.updateUser>[1] }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  // Form states create user
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    name: '',
    nip: '',
    role: 'operator',
    jabatan: '',
  })

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createUserMutation.mutateAsync(formData)
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      nip: '',
      role: 'operator',
      jabatan: '',
    })
  }

  const handleToggleActive = async (targetUser: Profile) => {
    if (targetUser.id === currentUser?.id) {
      alert('Anda tidak dapat menonaktifkan akun sendiri.')
      return
    }
    await updateUserMutation.mutateAsync({
      id: targetUser.id,
      data: { is_active: !targetUser.is_active },
    })
  }

  const handleUpdateRole = async (targetUser: Profile, newRole: UserRole) => {
    if (targetUser.id === currentUser?.id && newRole !== 'admin') {
      alert('Anda tidak dapat menurunkan role akun sendiri.')
      return
    }
    await updateUserMutation.mutateAsync({
      id: targetUser.id,
      data: { role: newRole },
    })
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl text-center">
          <Shield className="mx-auto mb-2 text-red-500" size={32} />
          <h2 className="text-base font-bold">Akses Ditolak</h2>
          <p className="text-xs text-red-600 mt-1">Hanya Administrator yang memiliki akses ke halaman manajemen pengguna.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="text-navy-800" size={26} />
              Manajemen Pengguna Sistem
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Kelola akun, hak akses role (RBAC), dan status aktif pengguna SIMON-KONTRAK
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-md"
          >
            <UserPlus size={16} className="mr-1" />
            Tambah Pengguna Baru
          </Button>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="min-h-[300px] flex items-center justify-center bg-white rounded-xl border border-gray-200">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white font-medium">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama & Username</th>
                    <th className="py-3.5 px-4">Role Akses</th>
                    <th className="py-3.5 px-4">Jabatan & NIP</th>
                    <th className="py-3.5 px-4 text-center">Status Akun</th>
                    <th className="py-3.5 px-4 text-center w-40">Ubah Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users?.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 text-center text-gray-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500 font-mono">@{u.username}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'purple'
                              : u.role === 'operator'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-gray-800 font-medium">{u.jabatan || '-'}</div>
                        <div className="text-gray-400">{u.nip ? `NIP: ${u.nip}` : 'NIP: -'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            u.is_active
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          } ${u.id === currentUser?.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {u.is_active ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={13} />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u, e.target.value as UserRole)}
                          disabled={u.id === currentUser?.id}
                          className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="operator">Operator</option>
                          <option value="pimpinan">Pimpinan</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Tambah Pengguna */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Tambah Pengguna Baru"
          size="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              required
              placeholder="Contoh: Budi Santoso, S.T."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Username"
                required
                placeholder="nama_user"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Input
              label="Email (untuk verifikasi)"
              type="email"
              required
              placeholder="user@muliabuanadarmatrans.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Role Akses"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                options={roleOptions}
              />
              <Input
                label="NIP (Opsional)"
                placeholder="Nomor Induk Pegawai"
                value={formData.nip || ''}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              />
            </div>

            <Input
              label="Jabatan Struktural"
              placeholder="Contoh: Pengawas Lapangan"
              value={formData.jabatan || ''}
              onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createUserMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createUserMutation.isPending}
              >
                Simpan Pengguna
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default UsersPage
