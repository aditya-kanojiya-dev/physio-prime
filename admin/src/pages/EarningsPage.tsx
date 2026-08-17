import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { api } from '../lib/api'
import { formatFee, type EarningsSummary, type EarningsComparison, type PaymentRecord } from '../lib/types'

type Period = 'weekly' | 'monthly' | 'yearly'

const periods: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

function TrendBadge({ comparison }: { comparison?: EarningsComparison }) {
  if (!comparison) return null
  const positive = comparison.percentChange >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
        positive
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-rose-100 text-rose-700 border border-rose-200'
      }`}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}
      {comparison.percentChange.toFixed(1)}%
    </span>
  )
}

const statusStyles: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200',
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-3">
      <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-black text-slate-900">{formatFee(payload[0].value)}</p>
    </div>
  )
}

export function EarningsPage() {
  const [period, setPeriod] = useState<Period>('monthly')

  const { data: summaryResp, isLoading: summaryLoading } = useQuery({
    queryKey: ['doctor/earnings/summary', period],
    queryFn: () => api.get<{ summary: EarningsSummary; comparison: EarningsComparison }>(`/doctor/earnings/summary?period=${period}`),
  })

  const { data: chartResp, isLoading: chartLoading } = useQuery({
    queryKey: ['doctor/earnings/chart', period],
    queryFn: () => api.get<{ dataPoints: { date: string; earningsPaise: number; appointments: number }[]; period: string }>(`/doctor/earnings/chart?period=${period}`),
  })

  const { data: paymentsResp, isLoading: paymentsLoading } = useQuery({
    queryKey: ['doctor/payments', 1],
    queryFn: () => api.get<{ payments: PaymentRecord[] }>(`/doctor/payments?limit=5`),
  })

  const s = summaryResp?.summary
  const cmp = summaryResp?.comparison
  const chartData = chartResp?.dataPoints ?? []
  const payments = paymentsResp?.payments ?? []

  return (
    <div
      className="min-h-screen rounded-3xl space-y-8"
      style={{ background: 'linear-gradient(180deg, #F4FBF9 0%, #F0FDFA 60%, #E9F6F2 100%)' }}
    >
      {/* Header + Period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Track your practice revenue</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === p.value
                  ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 p-6 rounded-3xl bg-gradient-to-br from-teal-600 to-blue-600 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase opacity-80">Total Earnings</span>
              <div className="p-2 rounded-2xl bg-white/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black">{formatFee(s?.totalEarningsPaise ?? 0)}</p>
            <TrendBadge comparison={cmp} />
          </div>
          <MetricCard icon={CheckCircle} iconCls="bg-emerald-100 text-emerald-700" label="Paid Earnings" value={formatFee(s?.paidEarningsPaise ?? 0)} />
          <MetricCard icon={Clock} iconCls="bg-amber-100 text-amber-700" label="Pending Earnings" value={formatFee(s?.pendingEarningsPaise ?? 0)} />
          <MetricCard icon={CreditCard} iconCls="bg-slate-100 text-slate-600" label="Upcoming Payout" value={formatFee(s?.pendingEarningsPaise ?? 0)} />
          <MetricCard icon={Banknote} iconCls="bg-blue-100 text-blue-700" label="Net Earnings" value={formatFee(s?.netEarningsPaise ?? 0)} />
        </div>
      )}

      {/* Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Earnings Trend</h3>
            {cmp && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                {cmp.percentChange >= 0 ? '+' : ''}{cmp.percentChange.toFixed(1)}% vs last period
              </span>
            )}
          </div>
        </div>
        {chartLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-bold">Loading chart…</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891B2" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0891B2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 100).toLocaleString('en-IN')}`}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earningsPaise"
                  stroke="#0891B2"
                  strokeWidth={2.5}
                  fill="url(#gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">Recent Payments</h3>
        {paymentsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                  <th className="pb-3 pr-4">Patient</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Mode</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.bookingId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-bold text-slate-900">{p.patientName}</td>
                    <td className="py-3 pr-4 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 font-bold text-slate-900">{formatFee(p.feePaise)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                          statusStyles[p.paymentStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 capitalize">{p.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  iconCls,
  label,
  value,
}: {
  icon: React.ElementType
  iconCls: string
  label: string
  value: string
}) {
  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase text-slate-500">{label}</span>
        <div className={`p-2.5 rounded-2xl ${iconCls}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}
