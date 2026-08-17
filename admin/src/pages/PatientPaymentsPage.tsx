import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Loader2, Search } from 'lucide-react'
import { api } from '../lib/api'
import { PaymentRecord, formatFee } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'
import { StatusPill } from './admin/AppointmentsPage'

const STATUS_FILTERS = ['all', 'paid', 'pending', 'failed', 'refunded'] as const

const STATUS_TONE: Record<string, 'emerald' | 'amber' | 'rose' | 'slate'> = {
  paid: 'emerald',
  pending: 'amber',
  failed: 'rose',
  refunded: 'slate',
}

export function PatientPaymentsPage() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['doctor/payments', page, status, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (status !== 'all') params.set('status', status)
      if (search) params.set('search', search)
      return api.get<{ payments: PaymentRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/doctor/payments?${params}`,
      )
    },
  })

  const payments = data?.payments || []

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Patient Payments</h1>
          <p className="text-xs text-slate-500">Track payment status for your appointments</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  status === s ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search patient or booking ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
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
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount (₹)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500" />
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.bookingId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-extrabold text-slate-900">{p.patientName}</td>
                        <td className="p-4 font-mono text-teal-700 font-extrabold">{p.bookingId}</td>
                        <td className="p-4 font-extrabold capitalize">{p.mode}</td>
                        <td className="p-4">{p.date}</td>
                        <td className="p-4 font-extrabold">{formatFee(p.feePaise)}</td>
                        <td className="p-4">
                          <StatusPill tone={STATUS_TONE[p.paymentStatus] || 'slate'} label={p.paymentStatus} />
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-500">{p.razorpayPaymentId || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="text-slate-500">
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} total
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
                disabled={page >= data.pagination.totalPages}
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
