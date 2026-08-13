import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Loader2, Phone, Search, X } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminAppointment } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { formatDate, formatFee } from '../../lib/types'

const FILTERS = ['all', 'upcoming', 'completed', 'cancelled', 'no_show'] as const

export function AppointmentsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<AdminAppointment | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin/appointments', filter, search, page],
    queryFn: async () => {
      const q = new URLSearchParams({ page: String(page) })
      if (filter !== 'all') q.set('status', filter)
      if (search) q.set('q', search)
      const res = await api.get<{ appointments: AdminAppointment[]; pagination: { page: number; pages: number; total: number } }>(
        `/admin/appointments?${q}`,
      )
      return res
    },
  })

  const filtered = (data?.appointments || []).filter((a) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      a.patientName.toLowerCase().includes(s) ||
      (a.doctorName || '').toLowerCase().includes(s) ||
      a.bookingId.toLowerCase().includes(s)
    )
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Appointments CRM Manager</h1>
            <p className="text-xs text-slate-500">View patient consultations, monitor session status, and revenues.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
            {FILTERS.map((st) => (
              <button
                key={st}
                onClick={() => {
                  setFilter(st)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  filter === st ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient, Doctor, or Booking ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        {data?.pagination.total === 0 && !isLoading ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-sm">
            No appointments found.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Booking ID & Date</th>
                    <th className="p-4">Patient Info</th>
                    <th className="p-4">Assigned Doctor</th>
                    <th className="p-4">Mode & Fee</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500" />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.bookingId} className="hover:bg-slate-100/50 transition-colors">
                        <td className="p-4">
                          <button
                            onClick={() => setViewing(a)}
                            className="font-extrabold text-teal-700 text-xs font-mono hover:underline text-left"
                          >
                            {a.bookingId}
                          </button>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" /> {a.date} • {a.timeSlot}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-extrabold text-slate-900">
                            {a.patientName}
                            {a.patientRelation && (
                              <span className="ml-1.5 text-[10px] font-extrabold uppercase tracking-wide text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                                for {a.patientRelation}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {a.patientPhone}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-extrabold text-slate-700">{a.doctorName}</p>
                          <p className="text-[10px] text-slate-500">{a.symptom}</p>
                        </td>
                        <td className="p-4 font-extrabold">
                          <span className="capitalize text-teal-700">{a.mode} Visit</span>
                          <p className="text-[11px] text-slate-600 font-bold">₹{(a.feePaise / 100).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="p-4">
                          <StatusPill
                            tone={
                              a.paymentStatus === 'paid'
                                ? 'emerald'
                                : a.paymentStatus === 'failed'
                                  ? 'rose'
                                  : a.paymentStatus === 'refunded'
                                    ? 'amber'
                                    : 'slate'
                            }
                            label={a.paymentStatus}
                          />
                        </td>
                        <td className="p-4">
                          <StatusPill
                            tone={
                              a.status === 'upcoming'
                                ? 'amber'
                                : a.status === 'completed'
                                  ? 'emerald'
                                  : a.status === 'cancelled'
                                    ? 'rose'
                                    : 'slate'
                            }
                            label={a.status.replace('_', ' ')}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && data.pagination.pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="text-slate-500">
              Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} total
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-all"
              >
                Prev
              </button>
              <button
                disabled={page >= data.pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {viewing && <AppointmentDetailModal appointment={viewing} onClose={() => setViewing(null)} />}
      </div>
    </AdminLayout>
  )
}

function AppointmentDetailModal({ appointment: a, onClose }: { appointment: AdminAppointment; onClose: () => void }) {
  const payTone =
    a.paymentStatus === 'paid'
      ? 'emerald'
      : a.paymentStatus === 'failed'
        ? 'rose'
        : a.paymentStatus === 'refunded'
          ? 'amber'
          : 'slate'
  const statusTone =
    a.status === 'upcoming'
      ? 'amber'
      : a.status === 'completed'
        ? 'emerald'
        : a.status === 'cancelled'
          ? 'rose'
          : 'slate'

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Booking ID', value: <span className="font-mono text-teal-700">{a.bookingId}</span> },
    { label: 'Patient', value: a.patientName },
    ...(a.patientRelation ? [{ label: 'Booked For', value: a.patientRelation }] : []),
    { label: 'Phone', value: a.patientPhone },
    { label: 'Assigned Doctor', value: a.doctorName },
    { label: 'Date', value: formatDate(a.date) },
    { label: 'Time Slot', value: a.timeSlot },
    { label: 'Mode', value: `${a.mode} visit` },
    { label: 'Symptom / Issue', value: a.symptom || '—' },
    { label: 'Fee', value: formatFee(a.feePaise) },
    { label: 'Payment', value: <StatusPill tone={payTone} label={a.paymentStatus} /> },
    { label: 'Status', value: <StatusPill tone={statusTone} label={a.status.replace('_', ' ')} /> },
    ...(a.razorpayOrderId
      ? [{ label: 'Razorpay Order', value: <span className="font-mono">{a.razorpayOrderId}</span> }]
      : []),
    ...(a.razorpayPaymentId
      ? [{ label: 'Razorpay Payment', value: <span className="font-mono">{a.razorpayPaymentId}</span> }]
      : []),
    { label: 'Booked', value: a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN') : '—' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-3 z-10">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Appointment Details</h3>
            <p className="text-xs text-slate-500">{a.bookingId}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
            {rows.map((r) => (
              <div key={r.label}>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{r.label}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{r.value}</p>
              </div>
            ))}
          </div>

          {a.address && Object.keys(a.address).length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Address</p>
              <p className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                {Object.entries(a.address)
                  .map(([k, v]) => (v ? `${k}: ${v}` : null))
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>
            </div>
          )}

          {a.videoCallLink && (
            <div className="mt-4">
              <a
                href={a.videoCallLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-teal-600 hover:underline"
              >
                Join video call →
              </a>
            </div>
          )}

          {a.status === 'cancelled' && a.cancellationReason && (
            <div className="mt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Cancellation Reason
              </p>
              <p className="text-sm font-bold text-slate-900 bg-rose-50 border border-rose-200 rounded-2xl p-3">
                {a.cancellationReason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function StatusPill({ tone, label }: { tone: 'emerald' | 'rose' | 'amber' | 'slate' | 'teal' | 'blue'; label: string }) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-500 border-slate-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${tones[tone]}`}>{label}</span>
}
