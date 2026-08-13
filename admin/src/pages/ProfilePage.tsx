import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { DoctorProfile } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const inputCls =
  'w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-teal-500 transition-colors'
const labelCls = 'font-bold text-slate-600'

export function ProfilePage() {
  const qc = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor/profile'],
    queryFn: async () => {
      const res = await api.get<{ doctor: DoctorProfile }>('/doctor/profile')
      return res.doctor
    },
  })

  useEffect(() => {
    if (!doctor) return
    setForm({
      bio: doctor.bio || '',
      experienceYears: String(doctor.experienceYears ?? ''),
      photo: doctor.photo || '',
      homeFee: String(doctor.fees?.home ?? ''),
      onlineFee: String(doctor.fees?.online ?? ''),
      clinicFee: String(doctor.fees?.clinic ?? ''),
      languages: (doctor.languages || []).join(', '),
      expertise: (doctor.expertise || []).join(', '),
      treatments: (doctor.treatments || []).join(', '),
    })
  }, [doctor])

  const save = useMutation({
    mutationFn: () =>
      api.patch<{ doctor: DoctorProfile }>('/doctor/profile', {
        bio: form.bio,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        photo: form.photo || undefined,
        fees: {
          home: Number(form.homeFee) || 0,
          online: Number(form.onlineFee) || 0,
          clinic: Number(form.clinicFee) || 0,
        },
        languages: splitList(form.languages),
        expertise: splitList(form.expertise),
        treatments: splitList(form.treatments),
      }),
    onSuccess: (res) => {
      setMessage('Profile saved.')
      qc.setQueryData(['doctor/profile'], res.doctor)
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6 max-w-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
            <p className="text-xs text-slate-500">Update your bio, consultation fees, and areas of expertise.</p>
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="space-y-1">
              <label className={labelCls}>Bio</label>
              <textarea
                value={form.bio || ''}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['home', 'online', 'clinic'] as const).map((m) => (
                <div key={m} className="space-y-1">
                  <label className={labelCls}>Fees – {m} (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form[`${m}Fee`] || ''}
                    onChange={(e) => setForm((f) => ({ ...f, [`${m}Fee`]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Experience (years)</label>
                <input
                  type="number"
                  min={0}
                  value={form.experienceYears || ''}
                  onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Photo URL</label>
                <input
                  value={form.photo || ''}
                  onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Languages (comma separated)</label>
              <input
                value={form.languages || ''}
                onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Expertise (comma separated)</label>
              <input
                value={form.expertise || ''}
                onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Treatments (comma separated)</label>
              <input
                value={form.treatments || ''}
                onChange={(e) => setForm((f) => ({ ...f, treatments: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
