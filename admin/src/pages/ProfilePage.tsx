import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, User, Briefcase, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { DoctorProfile } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'
import { ChangePasswordModal } from '../components/admin/ChangePasswordModal'
import { ImageUpload } from '../components/admin/ImageUpload'

const inputCls = 'w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-teal-500 transition-colors'
const labelCls = 'font-bold text-slate-600'

type Tab = 'personal' | 'professional' | 'security'

function splitList(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function ProfilePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('personal')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // --- form state ---
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [designation, setDesignation] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [department, setDepartment] = useState('')
  const [address, setAddress] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [languages, setLanguages] = useState('')
  const [expertise, setExpertise] = useState('')
  const [treatments, setTreatments] = useState('')
  const [homeFee, setHomeFee] = useState('')
  const [onlineFee, setOnlineFee] = useState('')
  const [clinicFee, setClinicFee] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor/profile'],
    queryFn: async () => {
      const res = await api.get<{ doctor: DoctorProfile }>('/doctor/profile')
      return res.doctor
    },
  })

  if (doctor && !hydrated) {
    setName(doctor.name || '')
    setBio(doctor.bio || '')
    setPhoto(doctor.photo || '')
    setGender(doctor.gender || '')
    setPhone(doctor.phone || '')
    setDesignation(doctor.designation || '')
    setEmployeeId(doctor.employeeId || '')
    setDepartment(doctor.department || '')
    setAddress(doctor.address?.full as string || '')
    setExperienceYears(String(doctor.experienceYears ?? ''))
    setLanguages((doctor.languages || []).join(', '))
    setExpertise((doctor.expertise || []).join(', '))
    setTreatments((doctor.treatments || []).join(', '))
    setHomeFee(String(doctor.fees?.home ?? ''))
    setOnlineFee(String(doctor.fees?.online ?? ''))
    setClinicFee(String(doctor.fees?.clinic ?? ''))
    setHydrated(true)
  }

  const save = useMutation({
    mutationFn: () =>
      api.patch<{ doctor: DoctorProfile }>('/doctor/profile', {
        name,
        bio: bio || undefined,
        photo: photo || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        designation: designation || undefined,
        employeeId: employeeId || undefined,
        department: department || undefined,
        address: address ? { full: address } : undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        fees: {
          home: Number(homeFee) || 0,
          online: Number(onlineFee) || 0,
          clinic: Number(clinicFee) || 0,
        },
        languages: splitList(languages),
        expertise: splitList(expertise),
        treatments: splitList(treatments),
      }),
    onSuccess: (res) => {
      setMessage('Profile saved successfully')
      setError(null)
      qc.setQueryData(['doctor/profile'], res.doctor)
      setTimeout(() => setMessage(null), 3000)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Save failed')
      setMessage(null)
    },
  })

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage your personal and professional information.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-bold">{message}</div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-bold">{error}</div>
        )}

        {isLoading ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : tab === 'personal' ? (
          /* ---- Personal Tab ---- */
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-700"><User className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500">Your basic personal details.</p>
              </div>
            </div>
            <div>
              <label className={labelCls}>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <ImageUpload value={photo} onChange={setPhoto} folder="doctors" label="Photo" />
            <div>
              <label className={labelCls}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50">
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : tab === 'professional' ? (
          /* ---- Professional Tab ---- */
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700"><Briefcase className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Professional Details</h2>
                <p className="text-xs text-slate-500">Your consultation and professional information.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Designation</label>
                <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Senior Physiotherapist" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Orthopedic" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Employee ID</label>
                <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Experience (years)</label>
                <input type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['home', 'online', 'clinic'] as const).map((m) => (
                <div key={m} className="space-y-1">
                  <label className={labelCls}>Fees – {m} (₹)</label>
                  <input type="number" min={0} value={m === 'home' ? homeFee : m === 'online' ? onlineFee : clinicFee} onChange={(e) => m === 'home' ? setHomeFee(e.target.value) : m === 'online' ? setOnlineFee(e.target.value) : setClinicFee(e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>

            <div>
              <label className={labelCls}>Languages (comma separated)</label>
              <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Hindi, Marathi" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expertise (comma separated)</label>
              <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Joint Pain, Sports Injury" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Treatments (comma separated)</label>
              <input value={treatments} onChange={(e) => setTreatments(e.target.value)} placeholder="Manual Therapy, Dry Needling" className={inputCls} />
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50">
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* ---- Security Tab ---- */
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700"><Lock className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Account Security</h2>
                <p className="text-xs text-slate-500">Manage your password.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-sm font-bold text-slate-900">Password</p>
                <p className="text-xs text-slate-500">Change your account password.</p>
              </div>
              <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all">
                Change Password
              </button>
            </div>
          </div>
        )}

        <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      </div>
    </AdminLayout>
  )
}
