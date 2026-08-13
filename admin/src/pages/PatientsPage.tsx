import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Loader2, Phone, Search, X } from 'lucide-react'
import { api } from '../lib/api'
import { DoctorPatient, DoctorPatientDetail, formatDate, formatFee } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'
import { StatusPill } from './admin/AppointmentsPage'

export function PatientsPage() {
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<DoctorPatient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['doctor/patients'],
    queryFn: async () => (await api.get<{ patients: DoctorPatient[] }>('/doctor/patients')).patients,
  })

  const filtered = (data || []).filter((p) => {
    if (!search) return true
    const s = search.toLowerCase()
    return p.name.toLowerCase().includes(s) || (p.email || '').toLowerCase().includes(s) || (p.phone || '').includes(s)
  })

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Patients</h1>
          <p className="text-xs text-slate-500">Patients you have consulted. Tap a patient to see their history.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-sm">
            No patients found{search ? ' for that search' : ' yet. Complete an appointment to add a patient.'}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Visits</th>
                    <th className="p-4">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filtered.map((p) => (
                    <tr key={p.id} onClick={() => setViewing(p)} className="hover:bg-teal-50/50 cursor-pointer transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white font-black flex items-center justify-center shrink-0">
                            {p.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{p.name}</p>
                            {p.gender && (
                              <p className="text-[10px] text-slate-400 capitalize">{p.gender}{p.age != null ? ` · ${p.age} yrs` : ''}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="flex items-center gap-1 text-[11px] text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" /> {p.phone || '—'}
                        </p>
                        <p className="text-[11px] text-slate-500">{p.email}</p>
                      </td>
                      <td className="p-4 font-extrabold text-teal-700">{p.visitCount}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                          <CalendarDays className="w-3 h-3 text-slate-400" /> {p.lastVisit ? formatDate(p.lastVisit) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {viewing && <PatientDetailModal patientId={viewing.id} onClose={() => setViewing(null)} />}
    </AdminLayout>
  )
}

function PatientDetailModal({ patientId, onClose }: { patientId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['doctor/patients', patientId],
    queryFn: async () => await api.get<DoctorPatientDetail>(`/doctor/patients/${patientId}`),
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-3 z-10">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Patient Details</h3>
            <p className="text-xs text-slate-500">History with you — appointments and prescriptions.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading || !data ? (
            <div className="min-h-[30vh] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white font-black flex items-center justify-center text-lg shrink-0">
                  {data.patient.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900">{data.patient.name}</p>
                  <p className="text-xs text-slate-500 truncate">{data.patient.email}</p>
                  <p className="text-xs text-slate-500">
                    {data.patient.phone || '—'}
                    {data.patient.gender ? ` · ${data.patient.gender}` : ''}
                    {data.patient.age != null ? ` · ${data.patient.age} yrs` : ''}
                    {data.patient.height || data.patient.weight
                      ? ` · ${data.patient.height || '?'}cm / ${data.patient.weight || '?'}kg`
                      : ''}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-3">Appointment History</h4>
                {data.appointments.length === 0 ? (
                  <p className="text-xs text-slate-400">No appointments recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {data.appointments.map((a) => (
                      <div key={a.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">
                            {formatDate(a.date)} · {a.timeSlot}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {a.mode} visit · {a.symptom || 'General'} · {formatFee(a.feePaise)}
                          </p>
                        </div>
                        <StatusPill
                          tone={
                            a.status === 'completed'
                              ? 'emerald'
                              : a.status === 'upcoming'
                                ? 'amber'
                                : a.status === 'cancelled'
                                  ? 'rose'
                                  : 'slate'
                          }
                          label={a.status.replace('_', ' ')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-3">Prescriptions</h4>
                {data.prescriptions.length === 0 ? (
                  <p className="text-xs text-slate-400">No prescriptions written yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.prescriptions.map((rx) => (
                      <div key={rx.id} className="p-4 rounded-2xl bg-white border border-teal-200">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-bold text-slate-500">
                            {rx.date ? formatDate(rx.date) : ''} · {new Date(rx.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          {rx.followUpDate && (
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                              Follow-up {formatDate(rx.followUpDate)}
                            </span>
                          )}
                        </div>
                        {rx.diagnosis && <p className="text-xs font-extrabold text-slate-900 mt-2">{rx.diagnosis}</p>}
                        {rx.medicines.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {rx.medicines.map((m, i) => (
                              <p key={i} className="text-xs font-bold text-slate-700">
                                • {m.name}
                                {m.dosage ? ` — ${m.dosage}` : ''}
                                {m.frequency ? `, ${m.frequency}` : ''}
                                {m.duration ? `, ${m.duration}` : ''}
                              </p>
                            ))}
                          </div>
                        )}
                        {rx.advice && (
                          <p className="mt-2 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2">
                            {rx.advice}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
