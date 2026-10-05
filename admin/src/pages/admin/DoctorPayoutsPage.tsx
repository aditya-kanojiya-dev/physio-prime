import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
  import { RefreshCw, DollarSign, CheckCircle, XCircle, Clock, CreditCard, Banknote, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { confirmDialog } from '../../components/admin/ConfirmDialog'
import { StatusPill } from './AppointmentsPage'
import { hasErrors, maxLen, required, type Errors } from '../../lib/validate'
import { Field } from './CategoriesPage'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

interface PayoutDetails {
  upiId?: string | null
  bank?: { holder?: string | null; accountNumber?: string | null; ifsc?: string | null } | null
}

/** A doctor the admin can pay without waiting for a request. */
interface PayableDoctor {
  id: number
  name: string
  slug: string
  department: string | null
  payoutDetails: PayoutDetails | null
  earnedPaise: number
  reservedPaise: number
  availablePaise: number
}

interface PayoutPreview {
  amountPaise: number
  availablePaise: number
  overlapWith: { id: number; periodStart: string | null; periodEnd: string | null } | null
}

interface AdminPayout {
  id: number
  amountPaise: number
  status: string
  paymentMethod: string | null
  transactionId: string | null
  notes: string | null
  periodStart: string | null
  periodEnd: string | null
  createdAt: string
  processedAt: string | null
  doctorId: number
  doctorName: string
  doctorSlug: string
  payoutDetails: PayoutDetails | null
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
  const [actionError, setActionError] = useState<string | null>(null)
  const [payFor, setPayFor] = useState<PayableDoctor | null>(null)

  const { data: summary } = useQuery({
    queryKey: ['admin/payouts/summary'],
    queryFn: () => api.get<PayoutSummary>('/admin/payouts/summary'),
  })

  const { data: payable } = useQuery({
    queryKey: ['admin/payouts/doctors'],
    queryFn: () => api.get<{ doctors: PayableDoctor[] }>('/admin/payouts/doctors'),
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
      setActionError(null)
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Request failed'
      setActionError(`Could not update payout: ${msg}`)
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

        {/* Pay a doctor directly, for a period, without waiting for a request. */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="flex items-center gap-2 p-4 border-b border-slate-200">
            <Send className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Pay a doctor</h2>
            <span className="text-[10px] font-bold text-slate-400">Amount is computed from that period&rsquo;s completed + paid appointments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Earned</th>
                  <th className="p-4">Reserved</th>
                  <th className="p-4">Available</th>
                  <th className="p-4">Sends to</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {!payable?.doctors.filter((d) => d.availablePaise > 0).length ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-sm font-bold">No doctor has a payable balance</td>
                  </tr>
                ) : (
                  payable.doctors
                    .filter((d) => d.availablePaise > 0)
                    .map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-extrabold text-slate-900">{d.name}</p>
                          <p className="text-[10px] text-slate-500">{d.department ?? d.slug}</p>
                        </td>
                        <td className="p-4 text-slate-600">{fmt(d.earnedPaise)}</td>
                        <td className="p-4 text-slate-600">{fmt(d.reservedPaise)}</td>
                        <td className="p-4 font-black text-slate-900">{fmt(d.availablePaise)}</td>
                        <td className="p-4 text-[10px] text-slate-500">
                          {describePayoutDetails(d.payoutDetails)}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setPayFor(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-[10px] font-bold hover:bg-teal-100 transition-all"
                          >
                            <Send className="w-3 h-3" /> Pay
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
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
                          {payout.periodStart && payout.periodEnd && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {payout.periodStart} &rarr; {payout.periodEnd}
                            </p>
                          )}
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
                                onClick={async () => { if (await confirmDialog({ title: 'Reject Payout', message: `Reject this payout?` })) updateMutation.mutate({ id: payout.id, status: 'failed', notes: 'Rejected by admin' }) }}
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
                                onClick={async () => { if (await confirmDialog({ title: 'Mark Payout Failed', message: `Mark as failed?` })) updateMutation.mutate({ id: payout.id, status: 'failed' }) }}
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

        {actionError && (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {actionError}
          </div>
        )}

        {/* Pay a doctor for a period */}
        {payFor && (
          <PayDoctorModal
            doctor={payFor}
            onClose={() => setPayFor(null)}
            onPaid={() => {
              setPayFor(null)
              queryClient.invalidateQueries({ queryKey: ['admin/payouts'] })
              queryClient.invalidateQueries({ queryKey: ['admin/payouts/doctors'] })
              queryClient.invalidateQueries({ queryKey: ['admin/payouts/summary'] })
            }}
          />
        )}

        {/* Complete Payout Modal */}
        {processingId && (
          <CompletePayoutModal
            payoutId={processingId}
            error={actionError}
            onComplete={(transactionId, notes) => {
              setActionError(null)
              updateMutation.mutate({ id: processingId, status: 'completed', transactionId, notes: notes || null })
            }}
            onClose={() => {
              setProcessingId(null)
              setActionError(null)
            }}
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

/** Where a doctor's money goes, so the admin can make the transfer by hand. */
function describePayoutDetails(d: PayoutDetails | null | undefined): React.ReactNode {
  const bank = d?.bank
  if (bank?.accountNumber && bank.ifsc) {
    return `${bank.holder ?? '—'} · ${bank.accountNumber} · ${bank.ifsc}`
  }
  if (d?.upiId) return `UPI ${d.upiId}`
  return <span className="text-amber-600 font-bold">Not set — doctor hasn&rsquo;t added any</span>
}

/** Last calendar month, the period an admin pays out most often. */
function lastMonth(): { start: string; end: string } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { start: iso(start), end: iso(end) }
}

function PayDoctorModal({ doctor, onClose, onPaid }: { doctor: PayableDoctor; onClose: () => void; onPaid: () => void }) {
  const [periodStart, setPeriodStart] = useState(() => lastMonth().start)
  const [periodEnd, setPeriodEnd] = useState(() => lastMonth().end)
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('bank_transfer')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Errors<'periodStart' | 'periodEnd' | 'notes'>>({})
  const [error, setError] = useState<string | null>(null)

  const rangeOk = ISO_DATE.test(periodStart) && ISO_DATE.test(periodEnd) && periodStart <= periodEnd

  const { data: preview } = useQuery({
    queryKey: ['admin/payouts/preview', doctor.id, periodStart, periodEnd],
    enabled: rangeOk,
    queryFn: () =>
      api.get<PayoutPreview>(
        `/admin/payouts/preview?doctorId=${doctor.id}&periodStart=${periodStart}&periodEnd=${periodEnd}`,
      ),
  })

  const pay = useMutation({
    mutationFn: () =>
      api.post('/admin/payouts', {
        doctorId: doctor.id,
        periodStart,
        periodEnd,
        paymentMethod: method,
        notes: notes.trim() || undefined,
      }),
    onSuccess: onPaid,
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create the payout'),
  })

  const submit = () => {
    const next: Errors<'periodStart' | 'periodEnd' | 'notes'> = {
      periodStart: ISO_DATE.test(periodStart) ? null : 'Start date must be YYYY-MM-DD',
      periodEnd: ISO_DATE.test(periodEnd) ? null : 'End date must be YYYY-MM-DD',
      notes: notes.trim() ? maxLen(notes, 500, 'Notes') : undefined,
    }
    if (next.periodStart === null && next.periodEnd === null && periodStart > periodEnd) {
      next.periodEnd = 'End date must be on or after the start date'
    }
    setErrors(next)
    if (hasErrors(next)) return
    setError(null)
    pay.mutate()
  }

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`
  const blocked = !rangeOk || !!preview?.overlapWith || (preview?.amountPaise ?? 0) <= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-extrabold text-slate-900">Pay {doctor.name}</h3>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-semibold space-y-1">
          <p>Available: <span className="font-black text-slate-900">{fmt(doctor.availablePaise)}</span></p>
          <p>Send to: {describePayoutDetails(doctor.payoutDetails)}</p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Period start" error={errors.periodStart}>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => { setPeriodStart(e.target.value); setErrors((p) => ({ ...p, periodStart: undefined })) }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
            />
          </Field>
          <Field label="Period end" error={errors.periodEnd}>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => { setPeriodEnd(e.target.value); setErrors((p) => ({ ...p, periodEnd: undefined })) }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
            />
          </Field>
        </div>

        <div className="space-y-1">
          <span className="font-bold text-slate-600">Payment method</span>
          <div className="grid grid-cols-2 gap-2">
            {([['bank_transfer', 'Bank transfer', CreditCard], ['upi', 'UPI', Banknote]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  method === value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Notes (optional)" error={errors.notes}>
          <input
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setErrors((p) => ({ ...p, notes: undefined })) }}
            placeholder="Reference for this payout"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
          />
        </Field>

        {rangeOk && preview && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 space-y-1">
            <p>
              This period is worth{' '}
              <span className="font-black text-slate-900">{fmt(preview.amountPaise)}</span>
              {preview.amountPaise > preview.availablePaise && (
                <span className="text-rose-600"> — more than the {fmt(preview.availablePaise)} available</span>
              )}
            </p>
            {preview.overlapWith && (
              <p className="text-rose-600 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                Overlaps payout #{preview.overlapWith.id} ({preview.overlapWith.periodStart} to {preview.overlapWith.periodEnd}) — that would pay the same appointment twice.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all">Cancel</button>
          <button
            onClick={submit}
            disabled={pay.isPending || blocked}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-40"
          >
            {pay.isPending ? 'Creating…' : `Create payout${preview ? ` of ${fmt(preview.amountPaise)}` : ''}`}
          </button>
        </div>
      </div>
    </div>
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

function CompletePayoutModal({ payoutId, error, onComplete, onClose }: { payoutId: number; error: string | null; onComplete: (txId: string, notes: string) => void; onClose: () => void }) {
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Errors<'transactionId' | 'notes'>>({})
  const txId = transactionId.trim()

  const submit = () => {
    const next: Errors<'transactionId' | 'notes'> = {
      transactionId: required(txId, 'Transaction ID'),
      notes: notes.trim() ? maxLen(notes, 500, 'Notes') : undefined,
    }
    setErrors(next)
    if (hasErrors(next)) return
    onComplete(txId, notes)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900">Complete Payout</h3>
        <p className="text-xs text-slate-500">Mark payout #{payoutId} as completed with the UPI ref / bank ref from the transfer.</p>
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}
        <Field label="Transaction ID (required)" error={errors.transactionId}>
          <input
            value={transactionId}
            onChange={(e) => {
              setTransactionId(e.target.value)
              setErrors((p) => ({ ...p, transactionId: undefined }))
            }}
            placeholder="UPI ref / bank ref"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
          />
        </Field>
        <Field label="Notes (optional)" error={errors.notes}>
          <input
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              setErrors((p) => ({ ...p, notes: undefined }))
            }}
            placeholder="Any internal notes"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-bold shadow-md transition-all">
            Confirm Complete
          </button>
        </div>
      </div>
    </div>
  )
}
