import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, DollarSign, CheckCircle, XCircle, Clock, CreditCard, Banknote, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatusPill } from './AppointmentsPage'

interface AdminPayout {
  id: number
  amountPaise: number
  status: string
  paymentMethod: string | null
  transactionId: string | null
  notes: string | null
  createdAt: string
  processedAt: string | null
  doctorId: number
  doctorName: string
  doctorSlug: string
}

interface PayoutSummary {
  totalPaidPaise: number
  totalPendingPaise: number
  totalRevenuePaise: number
}

const STATUS_FILTERS = ['all', 'pending', 'processing', 'completed', 'failed'] as const

export function DoctorPayoutsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [processingId, setProcessingId] = useState<number | null>(null)

  const { data: summary } = useQuery({
    queryKey: ['admin/payouts/summary'],
    queryFn: () => api.get<PayoutSummary>('/admin/payouts/summary'),
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin/payouts', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      return api.get<{ payouts: AdminPayout[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/payouts?${params}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...patch }: { id: number; status: string; transactionId?: string; notes?: string | null }) =>
      api.patch(`/admin/payouts/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin/payouts/summary'] })
      setProcessingId(null)
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Request failed'
      if (processingId) setProcessingId(null)
      alert(`Could not update payout: ${msg}`)
    },
  })

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Doctor Payouts</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage payout requests from doctors.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={fmt(summary?.totalRevenuePaise ?? 0)} color="blue" />
          <SummaryCard icon={<CheckCircle className="w-5 h-5" />} label="Total Paid Out" value={fmt(summary?.totalPaidPaise ?? 0)} color="emerald" />
          <SummaryCard icon={<Clock className="w-5 h-5" />} label="Pending Payouts" value={fmt(summary?.totalPendingPaise ?? 0)} color="amber" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin/payouts'] })} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Requested</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {(!data?.payouts.length) ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-sm font-bold">No payouts found</td>
                    </tr>
                  ) : (
                    data.payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-extrabold text-slate-900">{payout.doctorName}</p>
                          <p className="text-[10px] text-slate-500">ID: {payout.doctorId}</p>
                        </td>
                        <td className="p-4 font-black text-slate-900">{fmt(payout.amountPaise)}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            {payout.paymentMethod === 'upi' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                            {payout.paymentMethod === 'upi' ? 'UPI' : payout.paymentMethod === 'bank_transfer' ? 'Bank' : '—'}
                          </span>
                          {payout.transactionId && (
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{payout.transactionId}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <StatusPill
                            tone={
                              payout.status === 'completed' ? 'emerald'
                                : payout.status === 'failed' ? 'rose'
                                  : payout.status === 'processing' ? 'blue'
                                    : 'amber'
                            }
                            label={payout.status}
                          />
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(payout.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {payout.processedAt && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">
                              Processed {new Date(payout.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {payout.status === 'pending' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateMutation.mutate({ id: payout.id, status: 'processing' })}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition-all"
                              >
                                <RefreshCw className="w-3 h-3" /> Process
                              </button>
                              <button
                                onClick={() => { if (confirm('Reject this payout?')) updateMutation.mutate({ id: payout.id, status: 'failed', notes: 'Rejected by admin' }) }}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-all"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {payout.status === 'processing' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setProcessingId(payout.id)}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-all"
                              >
                                <CheckCircle className="w-3 h-3" /> Complete
                              </button>
                              <button
                                onClick={() => { if (confirm('Mark as failed?')) updateMutation.mutate({ id: payout.id, status: 'failed' }) }}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-all"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {payout.status === 'completed' && (
                            <span className="text-[10px] font-bold text-emerald-600">Done</span>
                          )}
                          {payout.status === 'failed' && (
                            <span className="text-[10px] font-bold text-red-500">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complete Payout Modal */}
        {processingId && (
          <CompletePayoutModal
            payoutId={processingId}
            onComplete={(transactionId, notes) => {
              updateMutation.mutate({ id: processingId, status: 'completed', transactionId, notes: notes || null })
            }}
            onClose={() => setProcessingId(null)}
          />
        )}

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))} disabled={page >= data.pagination.pages} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'blue' | 'emerald' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function CompletePayoutModal({ payoutId, onComplete, onClose }: { payoutId: number; onComplete: (txId: string, notes: string) => void; onClose: () => void }) {
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const txId = transactionId.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900">Complete Payout</h3>
        <p className="text-xs text-slate-500">Mark payout #{payoutId} as completed with the UPI ref / bank ref from the transfer.</p>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Transaction ID (required)</label>
          <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="UPI ref / bank ref" className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any internal notes" className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all">Cancel</button>
          <button onClick={() => onComplete(txId, notes)} disabled={!txId} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50">
            Confirm Complete
          </button>
        </div>
      </div>
    </div>
  )
}
