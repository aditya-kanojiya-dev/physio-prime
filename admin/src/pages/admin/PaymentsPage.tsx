import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Loader2, Search, Wallet } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminAppointment } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatusPill } from './AppointmentsPage'

const PAYMENT_FILTERS = ['all', 'pending', 'paid', 'failed', 'refunded'] as const

export function PaymentsPage() {
  const [filter, setFilter] = useState<(typeof PAYMENT_FILTERS)[number]>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin/appointments', 'payments', filter, search, page],
    queryFn: async () => {
      const q = new URLSearchParams({ page: String(page) })
      if (filter !== 'all') q.set('paymentStatus', filter)
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

  const totalCollected = (data?.appointments || [])
    .filter((a) => a.paymentStatus === 'paid')
    .reduce((sum, a) => sum + a.feePaise, 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Payments Ledger</h1>
            <p className="text-xs text-slate-500">Revenue, razorpay references, and payment status for every consultation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
            {PAYMENT_FILTERS.map((st) => (
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
                {st}
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
            No payments found.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Booking & Date</th>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Razorpay References</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500" />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.bookingId} className="hover:bg-slate-100/50 transition-colors">
                        <td className="p-4">
                          <span className="font-extrabold text-teal-700 text-xs font-mono">{a.bookingId}</span>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" /> {a.date} • {a.timeSlot}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-extrabold text-slate-900">{a.patientName}</p>
                          <p className="text-[11px] text-slate-500">{a.doctorName}</p>
                        </td>
                        <td className="p-4 font-black text-slate-900">₹{(a.feePaise / 100).toLocaleString('en-IN')}</td>
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
                          {a.razorpayOrderId ? (
                            <div className="space-y-0.5 font-mono text-[10px] text-slate-500">
                              <p className="flex items-center gap-1">
                                <Wallet className="w-3 h-3 text-slate-400" /> Order: {a.razorpayOrderId}
                              </p>
                              {a.razorpayPaymentId && <p>Payment: {a.razorpayPaymentId}</p>}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-600">
              Collected on this page: ₹{(totalCollected / 100).toLocaleString('en-IN')}
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
      </div>
    </AdminLayout>
  )
}
