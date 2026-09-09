import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Power,
  PowerOff,
  Search,
  Star,
  Stethoscope,
  Users,
  X,
  UserRound,
  Trash2,
} from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminApplication, AdminClient, AdminDoctor, ServiceArea } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ImageUpload } from '../../components/admin/ImageUpload'
import { ChipMultiSelect } from '../../components/ChipMultiSelect'
import { CITIES, DEPARTMENTS, DESIGNATIONS, EXPERIENCE_YEARS, HOME_RADIUS_KM, SPECIALTIES, STATES } from '../../lib/options'

const emptyForm = {
  name: '',
  email: '',
  title: 'Senior Physiotherapist',
  specialty: '',
  photo: '',
  experienceYears: 8,
  feesHome: 800,
  feesOnline: 500,
  area: '',
  city: 'Nagpur',
  state: '',
  pincode: '',
  gender: 'female' as 'male' | 'female',
  verified: true,
  featured: false,
  bio: '',
  phone: '',
  designation: '',
  department: '',
  languages: '',
  expertise: '',
  treatments: '',
  education: '',
  experienceEntries: '' as string,
  registrationNumber: '',
  registrationCouncil: '',
  registrationValidTill: '',
  homeVisitsEnabled: false,
  maxRadiusKm: '10',
  platformFeePercent: '',
  patientsTreated: 0,
  nextAvailable: '',
}

export function DoctorsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [appError, setAppError] = useState<string | null>(null)
  const [clientsDoctor, setClientsDoctor] = useState<AdminDoctor | null>(null)
  const [expandedApp, setExpandedApp] = useState<number | null>(null)

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

  const { data: serviceAreas } = useQuery({
    queryKey: ['admin/service-areas'],
    queryFn: async () => (await api.get<{ areas: ServiceArea[] }>('/admin/service-areas')).areas,
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

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'inactive' }) =>
      api.patch(`/admin/doctors/${id}/status`, { status }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Status update failed'),
  })

  const deleteDoctor = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/doctors/${id}`),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Delete failed'),
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
      email: form.email,
      title: form.title,
      specialty: form.specialty,
      photo: form.photo || null,
      experienceYears: Number(form.experienceYears),
      patientsTreated: Number(form.patientsTreated),
      fees: { home: Math.round(form.feesHome), online: Math.round(form.feesOnline) },
      location: { area: form.area, city: form.city, state: form.state, pincode: form.pincode, address: `${form.area}, ${form.city}` },
      address: { area: form.area, city: form.city, state: form.state, pincode: form.pincode },
      gender: form.gender,
      verified: form.verified,
      featured: form.featured,
      bio: form.bio,
      phone: form.phone || null,
      designation: form.designation || null,
      department: form.department || null,
      languages: form.languages ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
      expertise: form.expertise ? form.expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
      treatments: form.treatments ? form.treatments.split(',').map(s => s.trim()).filter(Boolean) : [],
      education: form.education ? form.education.split(',').map(s => s.trim()).filter(Boolean) : [],
      experience: form.experienceEntries ? form.experienceEntries.split('\n').filter(Boolean).map(line => {
        const [role, institution, period] = line.split('|').map(s => s.trim())
        return { role: role || '', institution: institution || '', period: period || '' }
      }) : [],
      registration: {
        ...(form.registrationNumber ? { number: form.registrationNumber } : {}),
        ...(form.registrationCouncil ? { council: form.registrationCouncil } : {}),
        ...(form.registrationValidTill ? { validTill: form.registrationValidTill } : {}),
      },
      homeVisitsEnabled: form.homeVisitsEnabled,
      maxRadiusKm: form.maxRadiusKm,
      nextAvailable: form.nextAvailable || null,
      platformFeePercent: form.platformFeePercent === '' ? null : Number(form.platformFeePercent),
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
                <div key={a.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                        <UserRound className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm">{a.candidateName || a.name}</p>
                        <p className="text-xs text-slate-500 truncate">{a.candidateEmail || a.email} · {a.position ?? 'No position'} · applied {a.appliedAt.slice(0, 10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedApp(expandedApp === a.id ? null : a.id)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                        title="Toggle details"
                      >
                        {expandedApp === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
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
                  {expandedApp === a.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                        {a.phone && <div><span className="font-bold text-slate-500">Phone</span><p className="text-slate-900 font-semibold">{a.phone}</p></div>}
                        {a.qualification && <div><span className="font-bold text-slate-500">Qualification</span><p className="text-slate-900 font-semibold">{a.qualification}</p></div>}
                        {a.experience && <div><span className="font-bold text-slate-500">Experience</span><p className="text-slate-900 font-semibold">{a.experience}</p></div>}
                        {a.currentOrganization && <div><span className="font-bold text-slate-500">Organization</span><p className="text-slate-900 font-semibold">{a.currentOrganization}</p></div>}
                        {a.joiningDate && <div><span className="font-bold text-slate-500">Joining Date</span><p className="text-slate-900 font-semibold">{a.joiningDate}</p></div>}
                        {a.certifications && <div><span className="font-bold text-slate-500">Certifications</span><p className="text-slate-900 font-semibold">{a.certifications}</p></div>}
                      </div>
                      {a.specializations && a.specializations.length > 0 && (
                        <div><span className="font-bold text-slate-500">Specializations</span><div className="flex flex-wrap gap-1 mt-1">{a.specializations.map(s => <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-200">{s}</span>)}</div></div>
                      )}
                      {a.coverLetter && (
                        <div><span className="font-bold text-slate-500">Cover Letter</span><p className="text-slate-700 mt-1 whitespace-pre-wrap">{a.coverLetter}</p></div>
                      )}
                    </div>
                  )}
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

        {/* Doctor cards */}
        {isLoading ? (
          <div className="p-12 flex justify-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    d.status === 'inactive' ? 'bg-rose-400' : 'bg-gradient-to-r from-teal-500 to-blue-500'
                  }`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {d.photo ? (
                      <img src={d.photo} alt={d.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                        <UserRound className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm truncate">{d.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{d.specialty || 'No specialty'}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {String(d.location?.area || '') || 'Nagpur'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${
                      d.status === 'inactive'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'inactive' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    {d.status === 'inactive' ? 'OFF' : 'ON'}
                  </span>
                  {d.deletionRequestedAt && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold border border-amber-300 bg-amber-50 text-amber-800 shrink-0">
                      Delete requested
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Category</span>
                    <span className="font-bold text-slate-700">{d.categoryTitle || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Commission</span>
                    <span className="font-bold text-slate-700">{d.platformFeePercent ?? 'Auto (department)'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Rating</span>
                    <span className="font-extrabold text-amber-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {d.rating || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Experience</span>
                    <span className="font-bold text-slate-700">{d.experienceYears ?? 0} yrs</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => toggle.mutate({ id: d.id, patch: { verified: !d.verified } })}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 transition-all ${
                      d.verified ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-teal-700'
                    }`}
                    title="Toggle verified"
                  >
                    <CheckCircle className="w-3 h-3" /> {d.verified ? 'Verified' : 'Unverified'}
                  </button>
                  <button
                    onClick={() => toggle.mutate({ id: d.id, patch: { featured: !d.featured } })}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                      d.featured ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-amber-700'
                    }`}
                    title="Toggle prime status"
                  >
                    {d.featured ? 'Prime' : 'Not Prime'}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      toggleStatus.mutate({
                        id: d.id,
                        status: d.status === 'active' ? 'inactive' : 'active',
                      })
                    }
                    disabled={toggleStatus.isPending}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-extrabold border transition-all disabled:opacity-50 ${
                      d.status === 'active'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title={d.status === 'active' ? 'Switch profile OFF' : 'Switch profile ON'}
                  >
                    {d.status === 'active' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    {d.status === 'active' ? 'Turn OFF' : 'Turn ON'}
                  </button>
                  <div className="flex gap-1.5">
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
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${d.name} permanently? This also removes their login.`)) {
                          deleteDoctor.mutate(d.id)
                        }
                      }}
                      disabled={deleteDoctor.isPending}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all disabled:opacity-50"
                      title="Delete doctor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="font-medium">No doctors found</p>
          </div>
        )}
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
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Doctor Name *">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Dr. John Doe" />
                </Field>
                <Field label="Email *">
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="doctor@example.com" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Specialty *">
                  <ChipMultiSelect value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} options={SPECIALTIES} />
                </Field>
                <Field label="Title">
                  <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {DESIGNATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Gender">
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} className={inputCls}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </Field>
                <Field label="Phone">
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+91 98765 43210" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Designation">
                  <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {DESIGNATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Department">
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {DEPARTMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Experience (Years) *">
                  <select value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} className={inputCls}>
                    {EXPERIENCE_YEARS.map((y) => <option key={y} value={y}>{y} years</option>)}
                  </select>
                </Field>
              </div>

              {/* Fees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Home Fee (₹) *">
                  <input type="number" required value={form.feesHome} onChange={(e) => setForm({ ...form, feesHome: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Online Fee (₹) *">
                  <input type="number" required value={form.feesOnline} onChange={(e) => setForm({ ...form, feesOnline: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Platform Fee (%)">
                  <input type="number" value={form.platformFeePercent} onChange={(e) => setForm({ ...form, platformFeePercent: e.target.value })} className={inputCls} min={0} max={100} placeholder="Auto (department)" />
                </Field>
              </div>

              {/* Photo & Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ImageUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} folder="doctors" label="Doctor Photo" />
                <Field label="Patients Treated">
                  <input type="number" value={form.patientsTreated} onChange={(e) => setForm({ ...form, patientsTreated: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Next Available">
                  <input type="date" value={form.nextAvailable} onChange={(e) => setForm({ ...form, nextAvailable: e.target.value })} className={inputCls} />
                </Field>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Area">
                  <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {(serviceAreas || []).filter((a) => a.active).map((a) => <option key={a.id} value={a.name}>{a.name}, {a.city || 'Nagpur'}</option>)}
                  </select>
                </Field>
                <Field label="City">
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="State">
                  <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode">
                  <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className={inputCls} placeholder="440010" />
                </Field>
              </div>

              {/* Professional Details */}
              <Field label="Languages (comma-separated)">
                <input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} className={inputCls} placeholder="English, Hindi, Marathi" />
              </Field>
              <Field label="Expertise (comma-separated)">
                <input value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} className={inputCls} placeholder="Manual Therapy, Dry Needling, Sports Rehab" />
              </Field>
              <Field label="Treatments (comma-separated)">
                <input value={form.treatments} onChange={(e) => setForm({ ...form, treatments: e.target.value })} className={inputCls} placeholder="Back Pain, Knee Rehab, Post-Surgery" />
              </Field>
              <Field label="Education (comma-separated)">
                <input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={inputCls} placeholder="BPT - Nagpur University, MPT - Orthopedic" />
              </Field>
              <Field label="Experience Entries (one per line: Role | Institution | Period)">
                <textarea value={form.experienceEntries} onChange={(e) => setForm({ ...form, experienceEntries: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="Senior Physio | City Hospital | 2020-2024&#10;Physio | Rehab Center | 2018-2020" />
              </Field>

              {/* Registration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Registration Number">
                  <input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className={inputCls} placeholder="A12345" />
                </Field>
                <Field label="Registration Council">
                  <input value={form.registrationCouncil} onChange={(e) => setForm({ ...form, registrationCouncil: e.target.value })} className={inputCls} placeholder="Maharashtra Council" />
                </Field>
                <Field label="Registration Valid Till">
                  <input type="date" value={form.registrationValidTill} onChange={(e) => setForm({ ...form, registrationValidTill: e.target.value })} className={inputCls} />
                </Field>
              </div>

              {/* Bio */}
              <Field label="Bio">
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="Brief description of the doctor's expertise..." />
              </Field>

              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Max Home Visit Radius (km)">
                  <select value={form.maxRadiusKm} onChange={(e) => setForm({ ...form, maxRadiusKm: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {HOME_RADIUS_KM.map((r) => <option key={r} value={r}>{r} km</option>)}
                  </select>
                </Field>
                <div className="flex flex-wrap items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.homeVisitsEnabled} onChange={(e) => setForm({ ...form, homeVisitsEnabled: e.target.checked })} className="accent-teal-600 w-4 h-4" />
                    <span className="font-bold text-slate-600">Home Visits</span>
                  </label>
                </div>
              </div>

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
