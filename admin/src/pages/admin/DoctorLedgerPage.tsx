import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  DollarSign,
  Edit3,
  MapPin,
  Save,
  Star,
  Users,
  FileText,
  Loader2,
  UserRound,
  X,
} from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { DoctorLedger, formatFee, formatDate } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const inputCls = 'w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors'
const selectCls = inputCls

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">{label}</p>
          <p className="text-lg font-black text-slate-900">{value}</p>
          {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function Section({ title, onEdit, editing, onSave, onCancel, saving, children }: {
  title: string; onEdit?: () => void; editing?: boolean; onSave?: () => void; onCancel?: () => void; saving?: boolean; children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{title}</h3>
        {onEdit && !editing && (
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
            <button onClick={onSave} disabled={saving} className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
      <span className="text-[11px] font-bold text-slate-900 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-bold text-slate-600 text-[11px]">{label}</label>
      {children}
    </div>
  )
}

export function DoctorLedgerPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin/doctor-ledger', id],
    queryFn: async () => api.get<DoctorLedger>(`/admin/doctors/${id}`),
    enabled: !!id,
  })

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [error2, setError2] = useState<string | null>(null)

  // Profile form state
  const [profileForm, setProfileForm] = useState<Record<string, unknown>>({})
  // Fees form state
  const [feesForm, setFeesForm] = useState({ home: 0, online: 0 })
  // Location form state
  const [locForm, setLocForm] = useState({ area: '', city: '' })

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/doctors/${id}`, body),
    onSuccess: () => {
      setEditingSection(null)
      setError2(null)
      qc.invalidateQueries({ queryKey: ['admin/doctor-ledger', id] })
      qc.invalidateQueries({ queryKey: ['admin/doctors'] })
    },
    onError: (err) => setError2(err instanceof ApiError ? err.message : 'Save failed'),
  })

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      </AdminLayout>
    )
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-slate-500">
          <p className="font-bold">Doctor not found or failed to load.</p>
          <Link to="/admin/doctors" className="text-teal-600 text-xs font-bold mt-2 inline-block">Back to doctors</Link>
        </div>
      </AdminLayout>
    )
  }

  const { doctor, schedule, locations, reviews, appointments: aptStats, payouts, recentAppointments, recentPrescriptions } = data
  const earningsPaise = aptStats.totalRevenuePaise
  const netPaise = earningsPaise - payouts.totalPaidPaise

  function startEditProfile() {
    setProfileForm({
      name: doctor.name, title: doctor.title || '', specialty: doctor.specialty || '',
      gender: doctor.gender || '', phone: doctor.phone || '', designation: doctor.designation || '',
      employeeId: doctor.employeeId || '', department: doctor.department || '',
      experienceYears: doctor.experienceYears || 0, patientsTreated: doctor.patientsTreated || 0,
      bio: doctor.bio || '', slug: doctor.slug,
      languages: doctor.languages?.join(', ') || '',
      verified: doctor.verified, featured: doctor.featured,
    })
    setEditingSection('profile')
    setError2(null)
  }

  function startEditFees() {
    setFeesForm({
      home: Number(doctor.fees?.home) || 0,
      online: Number(doctor.fees?.online) || 0,
    })
    setEditingSection('fees')
    setError2(null)
  }

  function startEditLocation() {
    setLocForm({ area: String(doctor.location?.area || ''), city: String(doctor.location?.city || '') })
    setEditingSection('location')
    setError2(null)
  }

  function saveProfile() {
    saveMutation.mutate({
      name: profileForm.name, title: profileForm.title, specialty: profileForm.specialty,
      gender: profileForm.gender, phone: profileForm.phone || null,
      designation: profileForm.designation || null, employeeId: profileForm.employeeId || null,
      department: profileForm.department || null,
      experienceYears: Number(profileForm.experienceYears),
      patientsTreated: Number(profileForm.patientsTreated),
      bio: profileForm.bio || null, slug: profileForm.slug,
      languages: String(profileForm.languages).split(',').map((s: string) => s.trim()).filter(Boolean),
      verified: profileForm.verified, featured: profileForm.featured,
    })
  }

  function saveFees() {
    saveMutation.mutate({
      fees: { home: Math.round(feesForm.home), online: Math.round(feesForm.online) },
    })
  }

  function saveLocation() {
    saveMutation.mutate({ location: { area: locForm.area, city: locForm.city, address: `${locForm.area}, ${locForm.city}` } })
  }

  const saving = saveMutation.isPending

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/doctors" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-4 flex-1">
            {doctor.photo ? (
              <img src={doctor.photo} alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <UserRound className="w-7 h-7 text-slate-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{doctor.name}</h1>
                {doctor.verified && <BadgeCheck className="w-5 h-5 text-teal-500" />}
                {doctor.featured && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold">Prime</span>}
              </div>
              <p className="text-xs text-slate-500">{doctor.specialty} · {doctor.title || 'Physiotherapist'} · {doctor.email}</p>
            </div>
          </div>
        </div>

        {error2 && (
          <div className="p-3 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">{error2}</div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Star} label="Rating" value={`${reviews.avgRating.toFixed(1)} ★`} sub={`${reviews.reviewCount} reviews`} color="bg-amber-100 text-amber-700" />
          <StatCard icon={Calendar} label="Appointments" value={aptStats.total} sub={`${aptStats.completed} done · ${aptStats.upcoming} upcoming`} color="bg-blue-100 text-blue-700" />
          <StatCard icon={DollarSign} label="Revenue" value={formatFee(earningsPaise)} sub={`Net: ${formatFee(netPaise)}`} color="bg-emerald-100 text-emerald-700" />
          <StatCard icon={Users} label="Patients" value={doctor.patientsTreated || 0} sub={`${payouts.payoutCount} payouts`} color="bg-purple-100 text-purple-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile */}
          <Section title="Profile Details" onEdit={startEditProfile} editing={editingSection === 'profile'} onSave={saveProfile} onCancel={() => setEditingSection(null)} saving={saving}>
            {editingSection === 'profile' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name *"><input required value={String(profileForm.name)} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={inputCls} /></Field>
                  <Field label="Title"><input value={String(profileForm.title)} onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Specialty *"><input required value={String(profileForm.specialty)} onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })} className={inputCls} /></Field>
                  <Field label="Slug"><input value={String(profileForm.slug)} onChange={(e) => setProfileForm({ ...profileForm, slug: e.target.value })} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Gender">
                    <select value={String(profileForm.gender)} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} className={selectCls}>
                      <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Experience (yrs)"><input type="number" value={Number(profileForm.experienceYears)} onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })} className={inputCls} /></Field>
                  <Field label="Patients Treated"><input type="number" value={Number(profileForm.patientsTreated)} onChange={(e) => setProfileForm({ ...profileForm, patientsTreated: Number(e.target.value) })} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone"><input value={String(profileForm.phone)} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} /></Field>
                  <Field label="Languages (comma-sep)"><input value={String(profileForm.languages)} onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Designation"><input value={String(profileForm.designation)} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} className={inputCls} /></Field>
                  <Field label="Employee ID"><input value={String(profileForm.employeeId)} onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })} className={inputCls} /></Field>
                  <Field label="Department"><input value={String(profileForm.department)} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} className={inputCls} /></Field>
                </div>
                <Field label="Bio"><textarea value={String(profileForm.bio)} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} /></Field>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={Boolean(profileForm.verified)} onChange={(e) => setProfileForm({ ...profileForm, verified: e.target.checked })} className="accent-teal-600 w-4 h-4" /><span className="font-bold text-slate-600 text-xs">Verified</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={Boolean(profileForm.featured)} onChange={(e) => setProfileForm({ ...profileForm, featured: e.target.checked })} className="accent-amber-500 w-4 h-4" /><span className="font-bold text-slate-600 text-xs">Prime Physiotherapist</span></label>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow label="Full Name" value={doctor.name} />
                <InfoRow label="Title" value={doctor.title} />
                <InfoRow label="Specialty" value={doctor.specialty} />
                <InfoRow label="Slug" value={doctor.slug} />
                <InfoRow label="Gender" value={doctor.gender} />
                <InfoRow label="Phone" value={doctor.phone} />
                <InfoRow label="Designation" value={doctor.designation} />
                <InfoRow label="Employee ID" value={doctor.employeeId} />
                <InfoRow label="Department" value={doctor.department} />
                <InfoRow label="Experience" value={doctor.experienceYears ? `${doctor.experienceYears} years` : null} />
                <InfoRow label="Patients Treated" value={doctor.patientsTreated || null} />
                <InfoRow label="Languages" value={doctor.languages?.join(', ')} />
                {doctor.bio && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Bio</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{doctor.bio}</p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Fees & Location */}
          <Section title="Fees & Location" onEdit={startEditFees} editing={editingSection === 'fees'} onSave={saveFees} onCancel={() => setEditingSection(null)} saving={saving}>
            {editingSection === 'fees' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Home Fee (₹)"><input type="number" value={feesForm.home} onChange={(e) => setFeesForm({ ...feesForm, home: Number(e.target.value) })} className={inputCls} /></Field>
                  <Field label="Online Fee (₹)"><input type="number" value={feesForm.online} onChange={(e) => setFeesForm({ ...feesForm, online: Number(e.target.value) })} className={inputCls} /></Field>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow label="Home Visit Fee" value={doctor.fees?.home ? `₹${Number(doctor.fees.home).toLocaleString('en-IN')}` : '—'} />
                <InfoRow label="Online Fee" value={doctor.fees?.online ? `₹${Number(doctor.fees.online).toLocaleString('en-IN')}` : '—'} />
              </div>
            )}
          </Section>

          {/* Primary Location */}
          <Section title="Primary Location" onEdit={startEditLocation} editing={editingSection === 'location'} onSave={saveLocation} onCancel={() => setEditingSection(null)} saving={saving}>
            {editingSection === 'location' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Area"><input value={locForm.area} onChange={(e) => setLocForm({ ...locForm, area: e.target.value })} className={inputCls} /></Field>
                  <Field label="City"><input value={locForm.city} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} className={inputCls} /></Field>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow label="Area" value={String(doctor.location?.area || '—')} />
                <InfoRow label="City" value={String(doctor.location?.city || '—')} />
              </div>
            )}
            {locations.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Practice Locations</p>
                {locations.map((loc) => (
                  <div key={loc.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{loc.name} {loc.isPrimary && <span className="text-[9px] text-teal-600">(Primary)</span>}</p>
                      <p className="text-[10px] text-slate-500">{[loc.area, loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Education & Registration */}
          <Section title="Education & Registration">
            {doctor.education && doctor.education.length > 0 ? (
              <div className="space-y-2">
                {doctor.education.map((edu: string, i: number) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{edu}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No education records</p>
            )}
            {doctor.registration && Object.keys(doctor.registration).length > 0 && (
              <div className="mt-3 space-y-1">
                {Object.entries(doctor.registration).map(([key, val]) => (
                  <InfoRow key={key} label={key} value={String(val)} />
                ))}
              </div>
            )}
          </Section>

          {/* Expertise & Treatments */}
          <Section title="Expertise & Treatments">
            {doctor.expertise && doctor.expertise.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {doctor.expertise.map((e: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-100">{e}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-3">No expertise listed</p>
            )}
            {doctor.treatments && doctor.treatments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {doctor.treatments.map((t: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">{t}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No treatments listed</p>
            )}
          </Section>

          {/* Payouts */}
          <Section title="Payout Summary">
            <div className="space-y-0">
              <InfoRow label="Total Paid Out" value={formatFee(payouts.totalPaidPaise)} />
              <InfoRow label="Pending Payout" value={formatFee(payouts.pendingPayoutPaise)} />
              <InfoRow label="Net Balance" value={formatFee(netPaise)} />
              <InfoRow label="Total Payouts" value={payouts.payoutCount} />
            </div>
          </Section>
        </div>

        {/* Schedule */}
          <Section title="Weekly Schedule">
            {schedule.length > 0 ? (
              <div className="space-y-1.5">
                {DAY_NAMES.map((name, i) => {
                  const day = i === 6 ? 0 : i + 1
                  const windows = schedule.filter((s) => s.dayOfWeek === day)
                  return (
                    <div key={name} className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-[11px] font-extrabold text-slate-900 w-8">{name}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {windows.length > 0 ? windows.map((w) => (
                          <span key={w.id} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                            {w.windowStart.slice(0, 5)}–{w.windowEnd.slice(0, 5)} ({w.maxPatients})
                          </span>
                        )) : (
                          <span className="text-[10px] text-slate-400">Off</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No schedule configured</p>
            )}
          </Section>

        {/* Recent Appointments */}
        <Section title={`Recent Appointments (${aptStats.total} total)`}>
          {recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="pb-2">Booking</th>
                    <th className="pb-2">Patient</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Mode</th>
                    <th className="pb-2">Fee</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.map((a) => (
                    <tr key={a.id} className="text-slate-700">
                      <td className="py-2 font-bold">{a.bookingId}</td>
                      <td className="py-2">{a.patientName}</td>
                      <td className="py-2">{a.date}</td>
                      <td className="py-2 capitalize">{a.mode}</td>
                      <td className="py-2 font-bold">{formatFee(a.feePaise)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          a.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                          a.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                          a.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No appointments yet</p>
          )}
        </Section>

        {/* Recent Prescriptions */}
        <Section title={`Recent Prescriptions (${recentPrescriptions.length} shown)`}>
          {recentPrescriptions.length > 0 ? (
            <div className="space-y-2">
              {recentPrescriptions.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.patientName}</p>
                      <p className="text-[10px] text-slate-500">{p.date} · {p.diagnosis || 'No diagnosis'}</p>
                    </div>
                  </div>
                  {p.followUpDate && (
                    <span className="text-[10px] font-bold text-blue-600">Follow-up: {formatDate(p.followUpDate)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No prescriptions yet</p>
          )}
        </Section>
      </div>
    </AdminLayout>
  )
}
