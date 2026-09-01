import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Search,
  Star,
  Stethoscope,
  Users,
  X,
  UserRound,
} from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminApplication, AdminClient, AdminDoctor } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ImageUpload } from '../../components/admin/ImageUpload'

const emptyForm = {
  name: '',
  title: 'Senior Physiotherapist',
  specialty: '',
  photo: '',
  experienceYears: 8,
  feesHome: 800,
  feesOnline: 500,
  area: '',
  city: 'Nagpur',
  gender: 'female' as 'male' | 'female',
  verified: true,
  featured: false,
  bio: '',
}

export function DoctorsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [appError, setAppError] = useState<string | null>(null)
  const [clientsDoctor, setClientsDoctor] = useState<AdminDoctor | null>(null)

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin/doctors'],
    queryFn: async () => (await api.get<{ doctors: AdminDoctor[] }>('/admin/doctors')).doctors,
  })

  const { data: applications } = useQuery({
    queryKey: ['admin/applications'],
    queryFn: async () => (await api.get<{ applications: AdminApplication[] }>('/admin/doctor-applications')).applications,
  })

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['admin/doctors/clients', clientsDoctor?.id],
    queryFn: async () =>
      clientsDoctor
        ? await api.get<{ doctor: AdminDoctor; clients: AdminClient[] }>(`/admin/doctors/${clientsDoctor.id}/clients`)
        : null,
    enabled: clientsDoctor !== null,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin/doctors'] })
    qc.invalidateQueries({ queryKey: ['admin/applications'] })
  }

  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
      api.post(`/admin/doctor-applications/${id}/decide`, { approve }),
    onSuccess: invalidate,
    onError: (err) => setAppError(err instanceof ApiError ? err.message : 'Decision failed'),
  })

  const toggle = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { verified?: boolean; featured?: boolean } }) =>
      api.patch(`/admin/doctors/${id}`, patch),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  })

  const saveDoctor = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/admin/doctors', body),
    onSuccess: () => {
      setModalOpen(false)
      invalidate()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    saveDoctor.mutate({
      name: form.name,
      title: form.title,
      specialty: form.specialty,
      photo: form.photo || null,
      experienceYears: Number(form.experienceYears),
      fees: { home: Math.round(form.feesHome), online: Math.round(form.feesOnline) },
      location: { area: form.area, city: form.city, address: `${form.area}, ${form.city}` },
      gender: form.gender,
      verified: form.verified,
      featured: form.featured,
      bio: form.bio,
    })
  }

  const openCreate = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const filtered = (doctors || []).filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.specialty || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Doctor Profiles CRM</h1>
            <p className="text-xs text-slate-500">Manage practitioner details, fees, ratings, and website visibility.</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Doctor Profile
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}
        {appError && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
            {appError}
          </div>
        )}

        {/* Applications */}
        {applications && applications.some((a) => a.status === 'pending') && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Pending Doctor Applications</h3>
            {applications
              .filter((a) => a.status === 'pending')
              .map((a) => (
                <div key={a.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                      <UserRound className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.email} · applied {a.appliedAt.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decide.mutate({ id: a.id, approve: true })}
                      disabled={decide.isPending}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => decide.mutate({ id: a.id, approve: false })}
                      disabled={decide.isPending}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor by name or specialty..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Specialty</th>
                  <th className="p-4">Consultation Fees</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Badges</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-500" />
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-100/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        {d.photo ? (
                          <img src={d.photo} alt={d.name} className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                            <UserRound className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{d.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {String(d.location?.area || '') || 'Nagpur'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700">{d.specialty}</p>
                        <p className="text-[10px] text-slate-500">{d.experienceYears} Years Exp.</p>
                      </td>
                      <td className="p-4 font-bold text-teal-700">
                        Home: ₹{(d.fees?.home || 0).toLocaleString('en-IN')} | Online: ₹{(d.fees?.online || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 font-extrabold">
                        <span className="flex items-center gap-1 text-amber-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {d.rating || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => toggle.mutate({ id: d.id, patch: { verified: !d.verified } })}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 transition-all ${
                              d.verified
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-teal-700'
                            }`}
                            title="Toggle verified"
                          >
                            <CheckCircle className="w-3 h-3" /> {d.verified ? 'Verified' : 'Unverified'}
                          </button>
                          <button
                            onClick={() => toggle.mutate({ id: d.id, patch: { featured: !d.featured } })}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
                              d.featured
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-amber-700'
                            }`}
                            title="Toggle prime status"
                          >
                            {d.featured ? 'Prime' : 'Not Prime'}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link
                            to={`/admin/doctors/${d.id}`}
                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all"
                            title="View Ledger"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setClientsDoctor(d)}
                            className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-all"
                            title="View Clients"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                      <p className="font-medium">No doctors found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clients Modal */}
      {clientsDoctor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-3 z-10">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Clients of {clientsDoctor.name}</h3>
                <p className="text-xs text-slate-500">Patients who have consulted this doctor.</p>
              </div>
              <button onClick={() => setClientsDoctor(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {clientsLoading || !clients ? (
                <div className="min-h-[30vh] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
              ) : clients.clients.length === 0 ? (
                <p className="text-sm text-slate-400 p-8 text-center rounded-2xl bg-slate-50 border border-slate-200">
                  No clients yet for this doctor.
                </p>
              ) : (
                <div className="space-y-3">
                  {clients.clients.map((c) => (
                    <div key={c.patientId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white font-black shrink-0">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-sm truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{c.email} · {c.phone || 'no phone'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 text-sm">{c.appointmentCount} visits</p>
                        <p className="text-[11px] text-slate-500">
                          Last {c.lastVisit?.slice(0, 10) || '—'} · ₹{(c.totalSpentPaise / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                Add New Doctor Profile
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Doctor Name *">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Dr. John Doe" />
                </Field>
                <Field label="Specialty *">
                  <input required value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className={inputCls} placeholder="Sports Injury & Spine Rehabilitation" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Home Fee (₹) *">
                  <input type="number" required value={form.feesHome} onChange={(e) => setForm({ ...form, feesHome: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Online Fee (₹) *">
                  <input type="number" required value={form.feesOnline} onChange={(e) => setForm({ ...form, feesOnline: Number(e.target.value) })} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} folder="doctors" label="Doctor Photo" />
                <Field label="Experience (Years) *">
                  <input type="number" required value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Area">
                  <input type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls} />
                </Field>
                <Field label="City">
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
                </Field>
              </div>

              <Field label="Bio">
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="Brief description of the doctor's expertise..." />
              </Field>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="accent-teal-600 w-4 h-4" />
                  <span className="font-bold text-slate-600">Verified Practitioner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-amber-500 w-4 h-4" />
                  <span className="font-bold text-slate-600">Prime Physiotherapist</span>
                </label>
              </div>

              {saveDoctor.isError && (
                <div className="p-3 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saveDoctor.isPending}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white rounded-2xl shadow-lg shadow-teal-600/30 transition-all text-xs disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saveDoctor.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Doctor Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const inputCls =
  'w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-teal-500 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-bold text-slate-600">{label}</label>
      {children}
    </div>
  )
}
