import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Loader2,
  Wallet,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import { formatFee, type PayoutSummary, type Payout } from '../lib/types'
import { Modal, inputCls, Field } from './admin/CategoriesPage'

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border border-blue-200',
  failed: 'bg-rose-100 text-rose-700 border border-rose-200',
}

export function PayoutsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank_transfer')
  const [error, setError] = useState<string | null>(null)

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['doctor/payouts/summary'],
    queryFn: () => api.get<PayoutSummary>('/doctor/payouts/summary'),
  })

  const { data: payoutsResp, isLoading: payoutsLoading } = useQuery({
    queryKey: ['doctor/payouts', page],
    queryFn: () => api.get<{ payouts: Payout[]; pagination: { page: number; totalPages: number; total: number } }>(`/doctor/payouts?page=${page}&limit=15`),
  })

  const requestMutation = useMutation({
    mutationFn: (body: { amountPaise: number; paymentMethod: string }) =>
      api.post('/doctor/payouts/request', body),
    onSuccess: () => {
      setModalOpen(false)
      setAmount('')
      setError(null)
      qc.invalidateQueries({ queryKey: ['doctor/payouts'] })
      qc.invalidateQueries({ queryKey: ['doctor/payouts/summary'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Request failed'),
  })

  const s = summary ?? ({} as PayoutSummary)
  const payouts = payoutsResp?.payouts ?? []
  const pagination = payoutsResp?.pagination

  const handleRequest = () => {
    setError(null)
    const rupees = parseFloat(amount)
    if (!rupees || rupees <= 0) { setError('Enter a valid amount'); return }
    if (rupees * 100 > (s.availableBalancePaise ?? 0)) { setError('Amount exceeds available balance'); return }
    requestMutation.mutate({ amountPaise: Math.round(rupees * 100), paymentMethod: method })
  }

  return (
    <div
      className="min-h-screen rounded-3xl space-y-8"
      style={{ background: 'linear-gradient(180deg, #F4FBF9 0%, #F0FDFA 60%, #E9F6F2 100%)' }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payouts</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Manage your earnings and payout history</p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-600 to-blue-600 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase opacity-80">Available Balance</span>
              <div className="p-2 rounded-2xl bg-white/20">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black">{formatFee(s.availableBalancePaise ?? 0)}</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-white text-teal-700 text-xs font-extrabold shadow-lg hover:bg-slate-50 transition-all"
            >
              Request Payout
            </button>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Pending Payout</span>
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{formatFee(s.pendingPayoutPaise ?? 0)}</p>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Total Paid</span>
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{formatFee(s.totalPaidPaise ?? 0)}</p>
          </div>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">Payout History</h3>
        {payoutsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold">No payouts yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Method</th>
                    <th className="pb-3">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4 font-bold text-slate-900">{formatFee(p.amountPaise)}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${statusStyles[p.status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-500 capitalize">{p.paymentMethod ?? '—'}</td>
                      <td className="py-3 text-slate-400 font-mono text-[10px]">{p.transactionId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400">
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <Modal title="Request Payout" onClose={() => { setModalOpen(false); setError(null) }}>
          <div className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <Field label="Amount (₹)">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
                placeholder="e.g. 5000"
              />
            </Field>
            <div className="space-y-1">
              <label className="font-bold text-slate-600">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
                  { value: 'upi', label: 'UPI', icon: Download },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                      method === m.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    <span className="font-bold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleRequest}
              disabled={requestMutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white rounded-2xl shadow-lg shadow-teal-600/30 transition-all text-xs disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {requestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payout'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
