import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Loader2, Phone, XCircle, CalendarDays, FilePlus2, X, ChevronRight } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Appointment, AppointmentStatus, DoctorAppointmentDetail, formatDate, formatFee } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'
import { StatusPill } from './admin/AppointmentsPage'

const FILTERS: { label: string; value: '' | AppointmentStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No show', value: 'no_show' },
]

const statusTone: Record<AppointmentStatus, 'amber' | 'emerald' | 'rose' | 'slate'> = {
  upcoming: 'amber',
  completed: 'emerald',
  cancelled: 'rose',
  no_show: 'slate',
}

export function AppointmentsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'' | AppointmentStatus>('')
  const [error, setError] = useState<string | null>(null)
  const [prescriptionFor, setPrescriptionFor] = useState<Appointment | null>(null)
  const [viewing, setViewing] = useState<Appointment | null>(null)
  const [rxForm, setRxForm] = useState({
    diagnosis: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    advice: '',
    followUpDate: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['doctor/appointments', filter],
    queryFn: async () => {
      const res = await api.get<{ appointments: Appointment[] }>(
        `/doctor/appointments${filter ? `?status=${filter}` : ''}`,
      )
      return res.appointments
    },
  })

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch<{ appointment: Appointment }>(`/doctor/appointments/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor/appointments'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  })

  const writeRx = useMutation({
    mutationFn: (id: string) => {
      const medicines = rxForm.medicines.filter((m) => m.name.trim())
      return api.post(`/doctor/appointments/${id}/prescription`, {
        diagnosis: rxForm.diagnosis || undefined,
        medicines,
        advice: rxForm.advice || undefined,
        followUpDate: rxForm.followUpDate || undefined,
      })
    },
    onSuccess: () => {
      setPrescriptionFor(null)
      setRxForm({ diagnosis: '', medicines: [{ name: '', dosage: '', frequency: '', duration: '' }], advice: '', followUpDate: '' })
      qc.invalidateQueries({ queryKey: ['doctor/appointments'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Prescription failed'),
  })

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Appointments</h1>
            <p className="text-xs text-slate-500">View your patient sessions and mark them completed or no show.</p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
            {FILTERS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  filter === value
                    ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {!data || data.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-sm">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500" />
            ) : (
              <>No appointments{filter ? ` with status "${filter}"` : ''} yet.</>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Patient Info</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Mode & Fee</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {data.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-100/50 transition-colors">
                      <td className="p-4">
                        <button
                          onClick={() => setViewing(a)}
                          className="font-extrabold text-slate-900 hover:text-teal-700 flex items-center gap-1 transition-colors"
                        >
                          {a.patientName} <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                        {a.patientRelation && (
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-teal-600 mt-0.5">
                            for {a.patientRelation}
                          </p>
                        )}
                        {a.patientPhone ? (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {a.patientPhone}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-teal-700 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-slate-400" /> {formatDate(a.date)}
                        </span>
                        <p className="text-[11px] text-slate-500">{a.timeSlot}</p>
                      </td>
                      <td className="p-4 font-extrabold">
                        <span className="capitalize text-teal-700">{a.mode} Visit</span>
                        <p className="text-[11px] text-slate-600 font-bold">{formatFee(a.feePaise)}</p>
                      </td>
                      <td className="p-4">
                        <StatusPill tone={statusTone[a.status]} label={a.status.replace('_', ' ')} />
                      </td>
                      <td className="p-4">
                        {a.status === 'upcoming' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => update.mutate({ id: a.id, status: 'completed' })}
                              disabled={update.isPending}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Completed
                            </button>
                            <button
                              onClick={() => update.mutate({ id: a.id, status: 'no_show' })}
                              disabled={update.isPending}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> No show
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end flex-wrap">
                            {a.videoCallLink && (
                              <a
                                href={a.videoCallLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-teal-600 underline font-bold text-[10px]"
                              >
                                join video call
                              </a>
                            )}
                            {a.status === 'completed' && (
                              <button
                                onClick={() => setPrescriptionFor(a)}
                                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] transition-all flex items-center gap-1"
                              >
                                <FilePlus2 className="w-3 h-3" /> Write Prescription
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {viewing && <AppointmentDetailModal appointment={viewing} onClose={() => setViewing(null)} />}

      {prescriptionFor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-3 z-10">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Write Prescription</h3>
                <p className="text-xs text-slate-500">
                  {prescriptionFor.patientName} · {formatDate(prescriptionFor.date)} · {prescriptionFor.timeSlot}
                </p>
              </div>
              <button onClick={() => setPrescriptionFor(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="p-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                writeRx.mutate(prescriptionFor.id)
              }}
            >
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Diagnosis</label>
                <textarea
                  rows={2}
                  value={rxForm.diagnosis}
                  onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })}
                  placeholder="e.g. Acute lumbar sprain, right side"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Medicines</label>
                  <button
                    type="button"
                    onClick={() =>
                      setRxForm({ ...rxForm, medicines: [...rxForm.medicines, { name: '', dosage: '', frequency: '', duration: '' }] })
                    }
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700"
                  >
                    + Add medicine
                  </button>
                </div>
                <div className="space-y-2">
                  {rxForm.medicines.map((m, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <input
                        value={m.name}
                        onChange={(e) =>
                          setRxForm({
                            ...rxForm,
                            medicines: rxForm.medicines.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)),
                          })
                        }
                        placeholder="Medicine name"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500 col-span-2 sm:col-span-4"
                      />
                      <input
                        value={m.dosage}
                        onChange={(e) =>
                          setRxForm({
                            ...rxForm,
                            medicines: rxForm.medicines.map((x, xi) => (xi === i ? { ...x, dosage: e.target.value } : x)),
                          })
                        }
                        placeholder="Dosage"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                      <input
                        value={m.frequency}
                        onChange={(e) =>
                          setRxForm({
                            ...rxForm,
                            medicines: rxForm.medicines.map((x, xi) => (xi === i ? { ...x, frequency: e.target.value } : x)),
                          })
                        }
                        placeholder="Frequency"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                      <input
                        value={m.duration}
                        onChange={(e) =>
                          setRxForm({
                            ...rxForm,
                            medicines: rxForm.medicines.map((x, xi) => (xi === i ? { ...x, duration: e.target.value } : x)),
                          })
                        }
                        placeholder="Duration"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                      {rxForm.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRxForm({ ...rxForm, medicines: rxForm.medicines.filter((_, xi) => xi !== i) })
                          }
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 text-right"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Advice / Notes</label>
                <textarea
                  rows={2}
                  value={rxForm.advice}
                  onChange={(e) => setRxForm({ ...rxForm, advice: e.target.value })}
                  placeholder="e.g. Ice 15 min thrice daily, avoid lifting for 2 weeks"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Follow-up Date (optional)</label>
                <input
                  type="date"
                  value={rxForm.followUpDate}
                  onChange={(e) => setRxForm({ ...rxForm, followUpDate: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={writeRx.isPending}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {writeRx.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Prescription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function AppointmentDetailModal({ appointment: a, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['doctor/appointments', a.id],
    queryFn: async () => await api.get<DoctorAppointmentDetail>(`/doctor/appointments/${a.id}`),
  })

  const rx = data?.prescription

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-3 z-10">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Appointment Details</h3>
            <p className="text-xs text-slate-500 font-mono">{a.bookingId}</p>
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
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Patient</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {a.patientName}
                    {a.patientRelation && (
                      <span className="ml-1.5 text-[10px] font-extrabold uppercase tracking-wide text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                        for {a.patientRelation}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{a.patientPhone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">When</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                    {formatDate(a.date)} · {a.timeSlot}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mode</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{a.mode} visit</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Symptom</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{a.symptom || 'General'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Fee</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatFee(a.feePaise)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payment</p>
                  <p className="mt-0.5">
                    <StatusPill
                      tone={a.paymentStatus === 'paid' ? 'emerald' : a.paymentStatus === 'failed' ? 'rose' : 'amber'}
                      label={a.paymentStatus}
                    />
                  </p>
                </div>
              </div>

              {a.address && Object.keys(a.address).length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Address</p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl p-3 mt-0.5">
                    {Object.entries(a.address)
                      .map(([k, v]) => (v ? `${k}: ${v}` : null))
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
              )}

              {a.videoCallLink && (
                <a
                  href={a.videoCallLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  Join video call →
                </a>
              )}

              {a.status === 'cancelled' && a.cancellationReason && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Cancellation Reason
                  </p>
                  <p className="text-sm font-bold text-slate-900 bg-rose-50 border border-rose-200 rounded-2xl p-3 mt-0.5">
                    {a.cancellationReason}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Prescription
                </p>
                {!rx ? (
                  <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                    No prescription written for this appointment yet.
                  </p>
                ) : (
                  <div className="p-4 rounded-2xl bg-white border border-teal-200">
                    {rx.diagnosis && <p className="text-xs font-extrabold text-slate-900">{rx.diagnosis}</p>}
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
                    {rx.followUpDate && (
                      <p className="mt-2 text-[11px] font-bold text-teal-700">
                        Follow-up {formatDate(rx.followUpDate)}
                      </p>
                    )}
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
