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
  Plus,
  Save,
  Star,
  Trash2,
  Users,
  FileText,
  Loader2,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { DoctorLedger, ServiceArea, formatFee, formatDate } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { CITIES, DESIGNATIONS, EXPERIENCE_YEARS, HOME_RADIUS_KM, SPECIALTIES } from '../../lib/options'
import { ChipMultiSelect } from '../../components/ChipMultiSelect'
import { ImageUpload } from '../../components/admin/ImageUpload'
import { confirmDialog } from '../../components/admin/ConfirmDialog'
import { Field } from './CategoriesPage'
import { experienceFromText, experienceToText, splitList } from '../../lib/profileText'
import { hasErrors, intInRange, maxLen, numInRange, required, type Errors } from '../../lib/validate'

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

function maskAccount(value?: string | null): string | null {
  if (!value) return null
  return value.length <= 4 ? '••••' : `••••••${value.slice(-4)}`
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

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</p>
        {hint && <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{hint}</p>}
      </div>
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

  const { data: serviceAreas } = useQuery({
    queryKey: ['admin/service-areas'],
    queryFn: async () => (await api.get<{ areas: ServiceArea[] }>('/admin/service-areas')).areas,
    enabled: !!id,
  })

  const { data: categories } = useQuery({
    queryKey: ['admin/categories'],
    queryFn: async () => (await api.get<{ categories: { id: number; title: string }[] }>('/admin/categories')).categories,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [error2, setError2] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors<'name' | 'phone' | 'designation' | 'bio' | 'fees' | 'photo' | 'categoryId' | 'platformFeePercent' | 'platformFeeHomePercent' | 'platformFeeOnlinePercent' | 'education' | 'experience' | 'registration' | 'expertise' | 'treatments' | 'practice'>>({})

  // Profile form state
  const [profileForm, setProfileForm] = useState<Record<string, unknown>>({})
  // Fees form state
  const [feesForm, setFeesForm] = useState({ home: 0, online: 0, categoryId: 0, platformFeePercent: '' as string | number, platformFeeHomePercent: '' as string | number, platformFeeOnlinePercent: '' as string | number })
  // Location form state
  const [locForm, setLocForm] = useState({ area: '', city: '' })
  // Credentials + tags form state
  const [credForm, setCredForm] = useState({ education: '', experience: '', registrationNumber: '', registrationCouncil: '', expertise: '', treatments: '' })
  // Practice location (doctor_locations) form state
  const [practiceForm, setPracticeForm] = useState({ name: '', address: '', area: '', city: '', state: '', pincode: '', radiusKm: '10', isPrimary: false, active: true })
  const [editingPracticeId, setEditingPracticeId] = useState<number | 'new' | null>(null)

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/doctors/${id}`, body),
    onSuccess: () => {
      setEditingSection(null)
      setError2(null)
      setErrors({})
      qc.invalidateQueries({ queryKey: ['admin/doctor-ledger', id] })
      qc.invalidateQueries({ queryKey: ['admin/doctors'] })
    },
    onError: (err) => setError2(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const practiceMutation = useMutation({
    mutationFn: ({ locationId, body }: { locationId: number | 'new'; body: Record<string, unknown> }) =>
      locationId === 'new'
        ? api.post(`/admin/doctors/${id}/locations`, body)
        : api.patch(`/admin/locations/${locationId}`, body),
    onSuccess: () => {
      setEditingSection(null)
      setEditingPracticeId(null)
      setError2(null)
      setErrors({})
      qc.invalidateQueries({ queryKey: ['admin/doctor-ledger', id] })
    },
    onError: (err) => setError2(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const practiceDelete = useMutation({
    mutationFn: (locationId: number) => api.delete(`/admin/locations/${locationId}`),
    onSuccess: () => {
      setError2(null)
      qc.invalidateQueries({ queryKey: ['admin/doctor-ledger', id] })
    },
    onError: (err) => setError2(err instanceof ApiError ? err.message : 'Delete failed'),
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
  const payoutDetails = doctor.payoutDetails
  const payoutMethod = payoutDetails?.bank?.accountNumber ? 'Bank transfer' : payoutDetails?.upiId ? 'UPI' : null
  const payoutReady = Boolean(payoutDetails?.upiId || (payoutDetails?.bank?.accountNumber && payoutDetails.bank.ifsc))

  function startEditProfile() {
    setProfileForm({
      name: doctor.name, title: doctor.title || '', specialty: doctor.specialty || '',
      gender: doctor.gender || '', phone: doctor.phone || '', designation: doctor.designation || '',
      experienceYears: doctor.experienceYears || 0, patientsTreated: doctor.patientsTreated || 0,
      bio: doctor.bio || '',
      languages: doctor.languages?.join(', ') || '',
      verified: doctor.verified, featured: doctor.featured,
      photo: doctor.photo || '',
      homeVisitsEnabled: doctor.homeVisitsEnabled,
      maxRadiusKm: doctor.maxRadiusKm || '10',
      nextAvailable: doctor.nextAvailable || '',
    })
    setEditingSection('profile')
    setError2(null)
    setErrors({})
  }

  function startEditFees() {
    setFeesForm({
      home: Number(doctor.fees?.home) || 0,
      online: Number(doctor.fees?.online) || 0,
      categoryId: doctor.categoryId || 0,
      platformFeePercent: doctor.platformFeePercent ?? '',
      platformFeeHomePercent: doctor.platformFeeHomePercent ?? '',
      platformFeeOnlinePercent: doctor.platformFeeOnlinePercent ?? '',
    })
    setLocForm({ area: String(doctor.location?.area || ''), city: String(doctor.location?.city || '') })
    setEditingSection('fees')
    setError2(null)
    setErrors({})
  }

  // mirrors doctorCreateSchema.partial() — the server is the authority
  function validateProfile() {
    const next: Errors<'name' | 'phone' | 'designation' | 'bio'> = {
      name: required(String(profileForm.name), 'Name') ?? maxLen(String(profileForm.name), 100, 'Name'),
      phone: profileForm.phone ? maxLen(String(profileForm.phone), 20, 'Phone') : undefined,
      designation: profileForm.designation ? maxLen(String(profileForm.designation), 100, 'Designation') : undefined,
      bio: profileForm.bio ? maxLen(String(profileForm.bio), 5000, 'Bio') : undefined,
    }
    setErrors(next)
    return !hasErrors(next)
  }

  function saveProfile() {
    if (!validateProfile()) return
    saveMutation.mutate({
      name: profileForm.name, title: profileForm.title, specialty: profileForm.specialty,
      gender: profileForm.gender, phone: profileForm.phone || null,
      designation: profileForm.designation || null,
      experienceYears: Number(profileForm.experienceYears),
      patientsTreated: Number(profileForm.patientsTreated),
      bio: profileForm.bio || null,
      languages: String(profileForm.languages).split(',').map((s: string) => s.trim()).filter(Boolean),
      verified: profileForm.verified, featured: profileForm.featured,
      photo: profileForm.photo ? String(profileForm.photo) : null,
      homeVisitsEnabled: Boolean(profileForm.homeVisitsEnabled),
      maxRadiusKm: String(profileForm.maxRadiusKm),
      nextAvailable: profileForm.nextAvailable ? String(profileForm.nextAvailable) : null,
    })
  }

  function startEditCred() {
    setCredForm({
      education: (doctor.education || []).join(', '),
      experience: experienceToText(doctor.experience),
      registrationNumber: doctor.registration?.number || '',
      registrationCouncil: doctor.registration?.council || '',
      expertise: (doctor.expertise || []).join(', '),
      treatments: (doctor.treatments || []).join(', '),
    })
    setEditingSection('credentials')
    setError2(null)
    setErrors({})
  }

  function saveCred() {
    const education = splitList(credForm.education)
    const experience = experienceFromText(credForm.experience)
    const next: Errors<'education' | 'experience' | 'registration'> = {
      education: education.length > 20 ? 'Max 20 entries' : undefined,
      experience: experience.length > 20 ? 'Max 20 entries' : undefined,
      registration: credForm.registrationNumber ? maxLen(credForm.registrationNumber, 60, 'Registration number') : undefined,
    }
    setErrors(next)
    if (hasErrors(next)) return
    saveMutation.mutate({
      education,
      experience,
      // registration is NOT NULL, so clearing the form sends {}
      registration: { number: credForm.registrationNumber.trim(), council: credForm.registrationCouncil.trim() },
    })
  }

  function startEditTags() {
    setCredForm((prev) => ({
      ...prev,
      expertise: (doctor.expertise || []).join(', '),
      treatments: (doctor.treatments || []).join(', '),
    }))
    setEditingSection('tags')
    setError2(null)
    setErrors({})
  }

  function saveTags() {
    saveMutation.mutate({
      expertise: splitList(credForm.expertise),
      treatments: splitList(credForm.treatments),
    })
  }

  function startEditPractice(locationId: number | 'new') {
    const loc = locationId === 'new' ? null : locations.find((l) => l.id === locationId)
    setPracticeForm({
      name: loc?.name || '',
      address: loc?.address || '',
      area: loc?.area || '',
      city: loc?.city || '',
      state: loc?.state || '',
      pincode: loc?.pincode || '',
      radiusKm: loc?.radiusKm || '10',
      isPrimary: loc?.isPrimary ?? false,
      active: loc?.active ?? true,
    })
    setEditingPracticeId(locationId)
    setEditingSection('practice')
    setError2(null)
    setErrors({})
  }

  function savePractice() {
    if (editingPracticeId === null) return
    const next: Errors<'practice'> = { practice: required(practiceForm.name, 'Location name') }
    setErrors(next)
    if (hasErrors(next)) return
    practiceMutation.mutate({
      locationId: editingPracticeId,
      body: {
        name: practiceForm.name,
        address: practiceForm.address || undefined,
        area: practiceForm.area || undefined,
        city: practiceForm.city || undefined,
        state: practiceForm.state || undefined,
        pincode: practiceForm.pincode || undefined,
        radiusKm: practiceForm.radiusKm,
        isPrimary: practiceForm.isPrimary,
        active: practiceForm.active,
      },
    })
  }

  function saveFees() {
    const next: Errors<'fees' | 'categoryId' | 'platformFeePercent' | 'platformFeeHomePercent' | 'platformFeeOnlinePercent'> = {
      fees:
        numInRange(String(Math.round(feesForm.home)), 0, 100000, 'Home fee') ??
        numInRange(String(Math.round(feesForm.online)), 0, 100000, 'Online fee'),
      categoryId: feesForm.categoryId > 0 ? undefined : required('', 'Select a primary category so the right commission rate applies'),
      platformFeePercent: feesForm.platformFeePercent === ''
        ? undefined
        : intInRange(String(feesForm.platformFeePercent), 0, 100, 'Platform fee'),
      platformFeeHomePercent: feesForm.platformFeeHomePercent === ''
        ? undefined
        : intInRange(String(feesForm.platformFeeHomePercent), 0, 100, 'Home visit fee'),
      platformFeeOnlinePercent: feesForm.platformFeeOnlinePercent === ''
        ? undefined
        : intInRange(String(feesForm.platformFeeOnlinePercent), 0, 100, 'Online fee %'),
    }
    setErrors(next)
    if (hasErrors(next)) return
    saveMutation.mutate({
      fees: { home: Math.round(feesForm.home), online: Math.round(feesForm.online) },
      location: { area: locForm.area, city: locForm.city, address: `${locForm.area}, ${locForm.city}` },
      categoryId: feesForm.categoryId || null,
      platformFeePercent: feesForm.platformFeePercent === '' ? null : Number(feesForm.platformFeePercent),
      platformFeeHomePercent: feesForm.platformFeeHomePercent === '' ? null : Number(feesForm.platformFeeHomePercent),
      platformFeeOnlinePercent: feesForm.platformFeeOnlinePercent === '' ? null : Number(feesForm.platformFeeOnlinePercent),
    })
  }

  const saving = saveMutation.isPending
  const feeFallback = doctor.departmentPlatformFeePercent != null ? `${doctor.departmentPlatformFeePercent}%` : null

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
                  <Field label="Name *" error={errors.name}><input required value={String(profileForm.name)} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={inputCls} /></Field>
                  <Field label="Public Title"><input value={String(profileForm.title)} placeholder="e.g. Senior Consultant Physiotherapist" onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })} className={inputCls} /></Field>
                </div>
                <Field label="Specialty *"><ChipMultiSelect value={String(profileForm.specialty || '')} onChange={(v) => setProfileForm({ ...profileForm, specialty: v })} options={SPECIALTIES} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Gender">
                    <select value={String(profileForm.gender)} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} className={selectCls}>
                      <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Experience (yrs)"><select value={Number(profileForm.experienceYears)} onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })} className={selectCls}>{EXPERIENCE_YEARS.map((y) => <option key={y} value={y}>{y} years</option>)}</select></Field>
                  <Field label="Patients Treated"><input type="number" value={Number(profileForm.patientsTreated)} onChange={(e) => setProfileForm({ ...profileForm, patientsTreated: Number(e.target.value) })} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" error={errors.phone}><input value={String(profileForm.phone)} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} /></Field>
                  <Field label="Languages (comma-sep)"><input value={String(profileForm.languages)} onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Designation" error={errors.designation}><select value={String(profileForm.designation)} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} className={selectCls}><option value="">— doctor has not set —</option>{DESIGNATIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                  <Field label="Next Available"><input type="date" value={String(profileForm.nextAvailable)} onChange={(e) => setProfileForm({ ...profileForm, nextAvailable: e.target.value })} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2"><input type="checkbox" checked={Boolean(profileForm.homeVisitsEnabled)} onChange={(e) => setProfileForm({ ...profileForm, homeVisitsEnabled: e.target.checked })} className="accent-teal-600 w-4 h-4" /><span className="font-bold text-slate-600 text-xs">Home visits enabled</span></label>
                  <Field label="Max Radius (km)"><select value={String(profileForm.maxRadiusKm)} onChange={(e) => setProfileForm({ ...profileForm, maxRadiusKm: e.target.value })} className={selectCls}>{HOME_RADIUS_KM.map((r) => <option key={r} value={r}>{r} km</option>)}</select></Field>
                </div>
                <ImageUpload value={String(profileForm.photo || '')} onChange={(v) => setProfileForm({ ...profileForm, photo: v })} folder="doctors" label="Photo" />
                <Field label="Bio" error={errors.bio}><textarea value={String(profileForm.bio)} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} /></Field>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={Boolean(profileForm.verified)} onChange={(e) => setProfileForm({ ...profileForm, verified: e.target.checked })} className="accent-teal-600 w-4 h-4" /><span className="font-bold text-slate-600 text-xs">Verified</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={Boolean(profileForm.featured)} onChange={(e) => setProfileForm({ ...profileForm, featured: e.target.checked })} className="accent-amber-500 w-4 h-4" /><span className="font-bold text-slate-600 text-xs">Prime Physiotherapist</span></label>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow label="Full Name" value={doctor.name} />
                <InfoRow label="Public Title" value={doctor.title} />
                <InfoRow label="Specialty" value={doctor.specialty} />
                <InfoRow label="Slug" value={doctor.slug} />
                <InfoRow label="Gender" value={doctor.gender} />
                <InfoRow label="Phone" value={doctor.phone} />
                <InfoRow label="Designation" value={doctor.designation} />
                <InfoRow label="Employee ID" value={doctor.employeeId} />
                <InfoRow label="Home Visits" value={doctor.homeVisitsEnabled ? `Enabled · up to ${doctor.maxRadiusKm} km` : 'Disabled'} />
                <InfoRow label="Next Available" value={doctor.nextAvailable ? formatDate(doctor.nextAvailable) : null} />
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
              <div className="space-y-4">
                <Group title="Consulting fees" hint="What the patient pays per appointment.">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Home Visit Fee (₹)" error={errors.fees}><input type="number" min={0} value={feesForm.home} onChange={(e) => setFeesForm({ ...feesForm, home: Number(e.target.value) })} className={inputCls} /></Field>
                    <Field label="Online Fee (₹)"><input type="number" min={0} value={feesForm.online} onChange={(e) => setFeesForm({ ...feesForm, online: Number(e.target.value) })} className={inputCls} /></Field>
                  </div>
                </Group>
                <Group title="Payouts & booking">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Platform Fee %" error={errors.platformFeePercent} hint={feeFallback ? `Blank = inherit ${doctor.department || 'department'} default of ${feeFallback}` : `Blank = no default set, so ${doctor.department || 'the department'} has no fee to fall back on`}>
                      <input type="number" min={0} max={100} step={1} value={String(feesForm.platformFeePercent)} placeholder={feeFallback ? `Inherit ${feeFallback}` : 'No default'} onChange={(e) => setFeesForm({ ...feesForm, platformFeePercent: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Primary Category" error={errors.categoryId} hint="Lists this doctor on a category page, and decides which category commission rate applies to their bookings.">
                      <select value={String(feesForm.categoryId)} onChange={(e) => setFeesForm({ ...feesForm, categoryId: Number(e.target.value) })} className={selectCls}>
                        <option value={0} disabled>— select a category —</option>{(categories || []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </Field>
                    <Field label="Home Visit Fee %" error={errors.platformFeeHomePercent} hint="Overrides the platform fee for home visits only.">
                      <input type="number" min={0} max={100} step={1} value={String(feesForm.platformFeeHomePercent)} placeholder={String(doctor.platformFeePercent ?? feeFallback ?? 'No default')} onChange={(e) => setFeesForm({ ...feesForm, platformFeeHomePercent: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Online Fee %" error={errors.platformFeeOnlinePercent} hint="Overrides the platform fee for online consultations only.">
                      <input type="number" min={0} max={100} step={1} value={String(feesForm.platformFeeOnlinePercent)} placeholder={String(doctor.platformFeePercent ?? feeFallback ?? 'No default')} onChange={(e) => setFeesForm({ ...feesForm, platformFeeOnlinePercent: e.target.value })} className={inputCls} />
                    </Field>
                  </div>
                </Group>
                <Group title="Primary location" hint="Search area shown on the public site.">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Area"><select value={locForm.area} onChange={(e) => setLocForm({ ...locForm, area: e.target.value })} className={selectCls}><option value="">—</option>{(serviceAreas || []).filter((a) => a.active).map((a) => <option key={a.id} value={a.name}>{a.name}, {a.city || 'Nagpur'}</option>)}</select></Field>
                    <Field label="City"><select value={locForm.city} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} className={selectCls}><option value="">—</option>{CITIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
                  </div>
                </Group>
              </div>
            ) : (
              <div className="space-y-3">
                <Group title="Consulting fees">
                  <div className="space-y-0">
                    <InfoRow label="Home Visit Fee" value={doctor.fees?.home ? `₹${Number(doctor.fees.home).toLocaleString('en-IN')}` : '—'} />
                    <InfoRow label="Online Fee" value={doctor.fees?.online ? `₹${Number(doctor.fees.online).toLocaleString('en-IN')}` : '—'} />
                  </div>
                </Group>
                <Group title="Payouts & booking">
                  <div className="space-y-0">
                    <InfoRow label="Platform Fee" value={doctor.platformFeePercent != null ? `${doctor.platformFeePercent}%` : feeFallback ? `Inherits ${doctor.department || 'department'} default of ${feeFallback}` : 'No default set'} />
                    <InfoRow label="Home Visit Fee" value={doctor.platformFeeHomePercent != null ? `${doctor.platformFeeHomePercent}%` : doctor.platformFeePercent != null ? `Same as platform fee (${doctor.platformFeePercent}%)` : null} />
                    <InfoRow label="Online Fee" value={doctor.platformFeeOnlinePercent != null ? `${doctor.platformFeeOnlinePercent}%` : doctor.platformFeePercent != null ? `Same as platform fee (${doctor.platformFeePercent}%)` : null} />
                    <InfoRow label="Primary Category" value={doctor.categoryTitle || (doctor.categoryId ? `ID ${doctor.categoryId}` : null)} />
                  </div>
                </Group>
                <Group title="Primary location">
                  <div className="space-y-0">
                    <InfoRow label="Area" value={String(doctor.location?.area || '—')} />
                    <InfoRow label="City" value={String(doctor.location?.city || '—')} />
                  </div>
                </Group>
              </div>
            )}
          </Section>

          {/* Education & Registration */}
          <Section title="Education & Registration" onEdit={startEditCred} editing={editingSection === 'credentials'} onSave={saveCred} onCancel={() => setEditingSection(null)} saving={saving}>
            {editingSection === 'credentials' ? (
              <div className="space-y-3">
                <Field label="Education (comma-sep, max 20)" error={errors.education}>
                  <textarea value={credForm.education} onChange={(e) => setCredForm({ ...credForm, education: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Experience — one per line: Role | Institution | Period" error={errors.experience}>
                  <textarea value={credForm.experience} onChange={(e) => setCredForm({ ...credForm, experience: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Registration No." error={errors.registration}><input value={credForm.registrationNumber} onChange={(e) => setCredForm({ ...credForm, registrationNumber: e.target.value })} className={inputCls} /></Field>
                  <Field label="Council"><input value={credForm.registrationCouncil} onChange={(e) => setCredForm({ ...credForm, registrationCouncil: e.target.value })} className={inputCls} /></Field>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {doctor.education?.length ? (
                  doctor.education.map((edu: string, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{edu}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No education records</p>
                )}
                {doctor.experience?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Experience</p>
                    {doctor.experience.map((exp, i: number) => (
                      <div key={i} className="py-1.5 border-b border-slate-100 last:border-0">
                        <p className="text-xs font-bold text-slate-900">
                          {String(exp.role || '—')}{exp.period ? ` · ${String(exp.period)}` : ''}
                        </p>
                        <p className="text-[10px] text-slate-500">{String(exp.institution || '')}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(doctor.registration?.number || doctor.registration?.council) && (
                  <div className="mt-2 space-y-1">
                    <InfoRow label="Registration No." value={doctor.registration?.number} />
                    <InfoRow label="Council" value={doctor.registration?.council} />
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Expertise & Treatments */}
          <Section title="Expertise & Treatments" onEdit={startEditTags} editing={editingSection === 'tags'} onSave={saveTags} onCancel={() => setEditingSection(null)} saving={saving}>
            {editingSection === 'tags' ? (
              <div className="space-y-3">
                <Field label="Expertise (comma-sep)"><input value={credForm.expertise} onChange={(e) => setCredForm({ ...credForm, expertise: e.target.value })} className={inputCls} /></Field>
                <Field label="Treatments (comma-sep)"><input value={credForm.treatments} onChange={(e) => setCredForm({ ...credForm, treatments: e.target.value })} className={inputCls} /></Field>
              </div>
            ) : (
              <>
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
              </>
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
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase mb-1">
                <Wallet className="w-3 h-3" /> Payout Destination
              </p>
              <div className="space-y-0">
                <InfoRow label="Method" value={payoutMethod} />
                <InfoRow label="UPI ID" value={payoutDetails?.upiId} />
                <InfoRow label="Account Holder" value={payoutDetails?.bank?.holder} />
                <InfoRow label="Account Number" value={maskAccount(payoutDetails?.bank?.accountNumber)} />
                <InfoRow label="IFSC" value={payoutDetails?.bank?.ifsc} />
              </div>
              {!payoutReady && (
                <p className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-700">
                  Incomplete — the doctor must set a UPI ID or full bank details before payout. Set it from their profile; admins cannot edit payout destinations.
                </p>
              )}
            </div>
          </Section>
        </div>

        {/* Practice Locations */}
        <Section title="Practice Locations" editing={editingSection === 'practice'} onSave={savePractice} onCancel={() => setEditingSection(null)} saving={saving || practiceMutation.isPending}>
          {editingSection === 'practice' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label={editingPracticeId === 'new' ? 'Name *' : 'Name'} error={errors.practice}><input value={practiceForm.name} onChange={(e) => setPracticeForm({ ...practiceForm, name: e.target.value })} className={inputCls} /></Field>
                <Field label="Radius (km)"><select value={practiceForm.radiusKm} onChange={(e) => setPracticeForm({ ...practiceForm, radiusKm: e.target.value })} className={selectCls}>{HOME_RADIUS_KM.map((r) => <option key={r} value={r}>{r} km</option>)}</select></Field>
              </div>
              <Field label="Address"><input value={practiceForm.address} onChange={(e) => setPracticeForm({ ...practiceForm, address: e.target.value })} className={inputCls} /></Field>
              <div className="grid grid-cols-4 gap-3">
                <Field label="Area"><input value={practiceForm.area} onChange={(e) => setPracticeForm({ ...practiceForm, area: e.target.value })} className={inputCls} /></Field>
                <Field label="City"><input value={practiceForm.city} onChange={(e) => setPracticeForm({ ...practiceForm, city: e.target.value })} className={inputCls} /></Field>
                <Field label="State"><input value={practiceForm.state} onChange={(e) => setPracticeForm({ ...practiceForm, state: e.target.value })} className={inputCls} /></Field>
                <Field label="Pincode"><input value={practiceForm.pincode} onChange={(e) => setPracticeForm({ ...practiceForm, pincode: e.target.value })} className={inputCls} /></Field>
              </div>
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={practiceForm.isPrimary} onChange={(e) => setPracticeForm({ ...practiceForm, isPrimary: e.target.checked })} className="accent-teal-600 w-4 h-4" /><span className="font-bold text-slate-600 text-xs">Primary location</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={practiceForm.active} onChange={(e) => setPracticeForm({ ...practiceForm, active: e.target.checked })} className="accent-teal-600 w-4 h-4" /><span className="font-bold text-slate-600 text-xs">Active</span></label>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      {loc.name}
                      {loc.isPrimary && <span className="ml-1 text-[9px] text-teal-600">(Primary)</span>}
                      {!loc.active && <span className="ml-1 text-[9px] text-rose-600">(inactive)</span>}
                    </p>
                    <p className="text-[10px] text-slate-500">{[loc.address, loc.area, loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!loc.isPrimary && (
                      <button onClick={() => practiceMutation.mutate({ locationId: loc.id, body: { isPrimary: true } })} disabled={practiceMutation.isPending} title="Set as primary" className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-teal-600 transition-colors">
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => startEditPractice(loc.id)} title="Edit" className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-teal-600 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (await confirmDialog({ title: 'Delete practice location', message: `Delete "${loc.name}"? Patients will stop seeing it as a booking option.`, tone: 'danger' })) practiceDelete.mutate(loc.id)
                      }}
                      disabled={practiceDelete.isPending}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {locations.length === 0 && <p className="text-xs text-slate-400">No practice locations</p>}
              <button onClick={() => startEditPractice('new')} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-500 hover:border-teal-300 hover:text-teal-600 flex items-center justify-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add location
              </button>
            </div>
          )}
        </Section>

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
