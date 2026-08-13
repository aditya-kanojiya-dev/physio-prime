import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CalendarCheck, DollarSign, RefreshCw, Stethoscope, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../../lib/api'
import { AdminInsights } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { MetricCard } from './DashboardPage'

const MODE_COLORS = ['#0EA5E9', '#14B8A6', '#8B5CF6']

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
  fontSize: 12,
  color: '#0F172A',
}

export function InsightsPage() {
  const [range, setRange] = useState('')
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin/insights', range],
    queryFn: async () => {
      const res = await api.get<AdminInsights>(`/admin/insights${range ? `?from=${range}&to=${range}` : ''}`)
      return res
    },
  })

  const revenueByDay = (data?.bookingsByDay || []).map((d) => ({ ...d, revenue: d.revenuePaise / 100 }))
  const modeData = (data?.bookingsByMode || []).map((m) => ({ name: m.mode, value: m.bookings }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Business Insights & Analytics</h1>
            <p className="text-xs text-slate-500">Revenue, bookings, and patient growth trends.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors"
              title="Filter by date"
            />
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : !data ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center">
            <AlertCircle className="w-8 h-8 text-rose-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-bold">Failed to load insights.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <MetricCard
                icon={DollarSign}
                iconCls="bg-emerald-100 text-emerald-700 border-emerald-200"
                label="Total Revenue"
                value={`₹${(data.summary.revenuePaise / 100).toLocaleString('en-IN')}`}
                sub="Paid consultations"
                subIcon={DollarSign}
                subCls="text-emerald-700"
              />
              <MetricCard
                icon={CalendarCheck}
                iconCls="bg-blue-100 text-blue-700 border-blue-200"
                label="Total Bookings"
                value={String(data.summary.totalBookings)}
                sub="All consultation modes"
                subIcon={CalendarCheck}
                subCls="text-blue-700"
              />
              <MetricCard
                icon={Users}
                iconCls="bg-teal-100 text-teal-700 border-teal-200"
                label="New Patients"
                value={String(data.summary.newPatients)}
                sub="Registered patients"
                subIcon={Users}
                subCls="text-teal-700"
              />
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Bookings & Revenue Over Time</h3>
                  <p className="text-xs text-slate-500">{range ? range : 'All time'}</p>
                </div>
              </div>
              {revenueByDay.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line yAxisId="left" type="monotone" dataKey="bookings" name="Bookings" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#14B8A6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">No bookings in this range.</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-4">Bookings by Mode</h3>
                {modeData.length > 0 ? (
                  <>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={modeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                            {modeData.map((_, i) => (
                              <Cell key={i} fill={MODE_COLORS[i % MODE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {modeData.map((m, i) => (
                        <div key={m.name} className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-slate-600 capitalize">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODE_COLORS[i % MODE_COLORS.length] }} />
                            {m.name}
                          </span>
                          <span className="text-slate-500">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 py-8 text-center">No bookings yet.</p>
                )}
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 lg:col-span-2">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-4">Mode Comparison</h3>
                {modeData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F9' }} />
                        <Bar dataKey="value" name="Bookings" radius={[8, 8, 0, 0]}>
                          {modeData.map((_, i) => (
                            <Cell key={i} fill={MODE_COLORS[i % MODE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-8 text-center">No bookings yet.</p>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-4">Top Doctors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data.topDoctors || []).map((d) => (
                  <div key={d.doctorId} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="p-2 rounded-xl bg-teal-100 text-teal-700 shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{d.doctorName}</p>
                      <p className="text-[11px] text-slate-500">{d.bookings} bookings · ₹{(d.revenuePaise / 100).toLocaleString('en-IN')} revenue</p>
                    </div>
                  </div>
                ))}
                {!data.topDoctors.length && <p className="text-xs text-slate-400">No doctor activity yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
