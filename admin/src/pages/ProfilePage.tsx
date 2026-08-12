import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import { DoctorProfile } from '../lib/types'

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

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

  if (isLoading) return <div className="text-slate-400">Loading profile…</div>

  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none'
  const label = 'block text-xs font-medium text-slate-500'

  return (
    <div className="max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-700">Profile</h1>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
      {message && <p className="mb-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4 rounded-2xl border border-teal-100 bg-white p-6">
        <div>
          <label className={label}>Bio</label>
          <textarea
            value={form.bio || ''}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={4}
            className={`${input} mt-1`}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['home', 'online', 'clinic'] as const).map((m) => (
            <div key={m}>
              <label className={label}>Fees – {m} (₹)</label>
              <input
                type="number"
                min={0}
                value={form[`${m}Fee`] || ''}
                onChange={(e) => setForm((f) => ({ ...f, [`${m}Fee`]: e.target.value }))}
                className={`${input} mt-1`}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Experience (years)</label>
            <input
              type="number"
              min={0}
              value={form.experienceYears || ''}
              onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
              className={`${input} mt-1`}
            />
          </div>
          <div>
            <label className={label}>Photo URL</label>
            <input
              value={form.photo || ''}
              onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
              className={`${input} mt-1`}
            />
          </div>
        </div>
        <div>
          <label className={label}>Languages (comma separated)</label>
          <input
            value={form.languages || ''}
            onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
            className={`${input} mt-1`}
          />
        </div>
        <div>
          <label className={label}>Expertise (comma separated)</label>
          <input
            value={form.expertise || ''}
            onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
            className={`${input} mt-1`}
          />
        </div>
        <div>
          <label className={label}>Treatments (comma separated)</label>
          <input
            value={form.treatments || ''}
            onChange={(e) => setForm((f) => ({ ...f, treatments: e.target.value }))}
            className={`${input} mt-1`}
          />
        </div>
      </div>
    </div>
  )
}
