import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  Cake,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Ruler,
  Search,
  UserRound,
  Weight,
  X,
} from 'lucide-react'
import { api } from '../../lib/api'
import { AdminPatient, PatientDetail } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatusPill } from './AppointmentsPage'
import { formatDate } from '../../lib/types'

export function PatientsPage() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin/patients', q],
    queryFn: async () => (await api.get<{ patients: AdminPatient[] }>(`/admin/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`)).patients,
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin/patients/detail', selected],
    queryFn: async () => (selected ? await api.get<PatientDetail>(`/admin/patients/${selected}`) : null),
    enabled: selected !== null,
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Patient Registry</h1>
          <p className="text-xs text-slate-500">Full patient profiles, consultations, payments, and prescriptions.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setQ(search)
          }}
          className="relative max-w-md"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </form>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Bookings</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500" />
                    </td>
                  </tr>
                ) : (data || []).length > 0 ? (
                  (data || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-100/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                          <UserRound className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {p.phone || '—'}
                        </p>
                      </td>
                      <td className="p-4">
                        <StatusPill tone={p.status === 'active' ? 'emerald' : 'slate'} label={p.status} />
                      </td>
                      <td className="p-4 font-black text-slate-900 text-sm">{p.appointmentCount}</td>
                      <td className="p-4 text-slate-500">{p.createdAt.slice(0, 10)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelected(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-[10px] transition-all flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {detailLoading || !detail ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            ) : (
              <PatientDetailView detail={detail} onClose={() => setSelected(null)} />
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function PatientDetailView({ detail, onClose }: { detail: PatientDetail; onClose: () => void }) {
  const p = detail.patient
  const addr = (p.address as Record<string, string> | null) || {}
  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white font-black">
            {p.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{p.name}</h2>
            <p className="text-xs text-slate-500">{p.email}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <InfoTile label="Phone" value={p.phone || '—'} icon={Phone} />
        <InfoTile label="Gender" value={p.gender || '—'} icon={UserRound} />
        <InfoTile label="Date of Birth" value={p.dob ? formatDate(p.dob) : '—'} icon={Cake} />
        <InfoTile label="Weight" value={p.weight ? `${p.weight} kg` : '—'} icon={Weight} />
        <InfoTile label="Height" value={p.height ? `${p.height} cm` : '—'} icon={Ruler} />
        <InfoTile
          label="Address"
          value={[addr.street, addr.city, addr.pin].filter(Boolean).join(', ') || '—'}
          icon={MapPin}
        />
      </div>

      <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Appointments</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{detail.summary.appointmentCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Paid Consultations</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{detail.summary.paidCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Total Spent</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{(detail.summary.totalSpentPaise / 100).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="px-6">
        <h3 className="text-base font-extrabold text-slate-900 mb-3">Appointment History</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Fee</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {detail.appointments.map((a) => (
                <tr key={a.bookingId}>
                  <td className="p-3">
                    <span className="font-extrabold text-teal-700 font-mono text-[10px]">{a.bookingId}</span>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" /> {a.date} • {a.timeSlot}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold">{a.doctorName}</p>
                    <p className="text-[10px] text-slate-500">{a.symptom}</p>
                  </td>
                  <td className="p-3 capitalize text-slate-600">{a.mode}</td>
                  <td className="p-3 font-bold">₹{(a.feePaise / 100).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <StatusPill
                      tone={a.paymentStatus === 'paid' ? 'emerald' : a.paymentStatus === 'failed' ? 'rose' : a.paymentStatus === 'refunded' ? 'amber' : 'slate'}
                      label={a.paymentStatus}
                    />
                  </td>
                  <td className="p-3">
                    <StatusPill
                      tone={a.status === 'completed' ? 'emerald' : a.status === 'cancelled' ? 'rose' : a.status === 'upcoming' ? 'amber' : 'slate'}
                      label={a.status.replace('_', ' ')}
                    />
                  </td>
                </tr>
              ))}
              {detail.appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No appointments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 pb-6">
        <h3 className="text-base font-extrabold text-slate-900 mb-3">Prescriptions</h3>
        {detail.prescriptions.length === 0 ? (
          <p className="text-xs text-slate-400 p-4 rounded-2xl bg-slate-50 border border-slate-200">No prescriptions yet.</p>
        ) : (
          <div className="space-y-4">
            {detail.prescriptions.map((rx) => (
              <div key={rx.id} className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-extrabold text-slate-900 text-sm">Dr. {rx.doctorName}</p>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {formatDate(rx.date)} • Rx #{rx.id}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  <span className="font-extrabold">Diagnosis:</span> {rx.diagnosis || '—'}
                </p>
                {rx.medicines.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rx.medicines.map((m, i) => (
                      <li key={i} className="text-xs text-slate-700 flex flex-wrap gap-1">
                        <span className="font-extrabold text-teal-800">• {m.name}</span>
                        {m.dosage && <span>({m.dosage})</span>}
                        {m.frequency && <span>{m.frequency}</span>}
                        {m.duration && <span>for {m.duration}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {rx.advice && <p className="text-xs text-slate-600 mt-2"><span className="font-extrabold">Advice:</span> {rx.advice}</p>}
                {rx.followUpDate && (
                  <p className="text-xs font-bold text-teal-700 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Follow-up: {formatDate(rx.followUpDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoTile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
      <div className="p-2 rounded-xl bg-white border border-slate-200 text-teal-700 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900 break-words">{value}</p>
      </div>
    </div>
  )
}
