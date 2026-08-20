import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, RefreshCw, Save, Lock, Mail, Phone, Shield } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminProfile } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ChangePasswordModal } from '../../components/admin/ChangePasswordModal'

export function AdminProfilePage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [message, setMessage] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin/profile'],
    queryFn: async () => {
      const res = await api.get<{ user: AdminProfile }>('/admin/profile')
      return res.user
    },
  })

  // Hydrate form when data loads
  const [hydrated, setHydrated] = useState(false)
  if (data && !hydrated) {
    setName(data.name || '')
    setPhone(data.phone || '')
    setHydrated(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => api.patch<{ user: AdminProfile }>('/admin/profile', { name, phone: phone || null }),
    onSuccess: (res) => {
      queryClient.setQueryData(['admin/profile'], res.user)
      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    },
  })

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage your account settings.</p>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-bold">{message}</div>
        )}

        {isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile Info */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Personal Information</h2>
                  <p className="text-xs text-slate-500">Update your personal details.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                </label>
                <input
                  type="email"
                  value={data?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed here.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Role: Admin</span>
              </div>

              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

            {/* Security */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Password</h2>
                    <p className="text-xs text-slate-500">Change your account password.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      </div>
    </AdminLayout>
  )
}
