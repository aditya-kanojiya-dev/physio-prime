import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Activity,
  CalendarCheck,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '../../lib/api'
import { AdminInsights } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'

const modeMeta: Record<string, { label: string; bar: string; text: string }> = {
  home: { label: 'Home Consultation Visits', bar: 'from-blue-600 to-teal-400', text: 'text-blue-700' },
  online: { label: 'Online Tele-Consultations', bar: 'bg-teal-500', text: 'text-teal-700' },
}

export function DashboardPage() {
  const [range, setRange] = useState('')
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin/insights', range],
    queryFn: async () => {
      const res = await api.get<AdminInsights>(`/admin/insights${range ? `?from=${range}&to=${range}` : ''}`)
      return res
    },
  })

  const totalMode = data?.bookingsByMode.reduce((n, m) => n + m.bookings, 0) || 0
  const completedCount = data?.bookingsByDay.reduce((n, d) => n + d.bookings, 0) || 0

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Executive CRM Dashboard</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Real-time platform overview, appointments analytics, and booking health.
            </p>
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
        ) : (
          <>
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                icon={DollarSign}
                iconCls="bg-emerald-100 text-emerald-700 border-emerald-200"
                label="Total Consultation Revenue"
                value={`₹${(data?.summary.revenuePaise || 0).toLocaleString('en-IN')}`}
                sub={`${data?.bookingsByMode.length || 0} consultation modes`}
                subIcon={TrendingUp}
                subCls="text-emerald-700"
              />
              <MetricCard
                icon={CalendarCheck}
                iconCls="bg-blue-100 text-blue-700 border-blue-200"
                label="Total Patient Bookings"
                value={String(data?.summary.totalBookings || 0)}
                sub={`${completedCount} booked sessions`}
                subIcon={CheckCircle}
                subCls="text-blue-700"
              />
              <MetricCard
                icon={Stethoscope}
                iconCls="bg-teal-100 text-teal-700 border-teal-200"
                label="Total Patients"
                value={String(data?.summary.newPatients || 0)}
                sub="Registered patients"
                subIcon={Users}
                subCls="text-teal-700"
              />
              <MetricCard
                icon={Activity}
                iconCls="bg-amber-100 text-amber-700 border-amber-200"
                label="Peak Booking Day"
                value={
                  data?.bookingsByDay.length
                    ? data.bookingsByDay.reduce((a, b) => (b.bookings > a.bookings ? b : a)).date.slice(5)
                    : '—'
                }
                sub="Most sessions in one day"
                subIcon={Clock}
                subCls="text-amber-700"
              />
            </div>

            {/* Analytics & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mode distribution */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Consultation Mode Distribution</h3>
                    <p className="text-xs text-slate-500">Analysis by Home Visit and Online Video Appointments</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 px-3 py-1 bg-teal-100 rounded-full border border-teal-200">
                    {range ? range : 'All time'}
                  </span>
                </div>
                <div className="space-y-4">
                  {(data?.bookingsByMode || []).map((m) => {
                    const meta = modeMeta[m.mode] || { label: m.mode, bar: 'bg-slate-500', text: 'text-slate-600' }
                    const pct = totalMode ? Math.round((m.bookings / totalMode) * 100) : 0
                    return (
                      <div key={m.mode} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">{meta.label}</span>
                          <span className={meta.text}>
                            {pct}% ({m.bookings})
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${meta.bar} ${meta.bar.startsWith('bg-') ? '' : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {!data?.bookingsByMode.length && <p className="text-xs text-slate-400">No bookings yet.</p>}
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Link to="/admin/appointments" className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-center text-xs font-bold text-slate-700 transition-all">
                    Manage Appointments
                  </Link>
                  <Link to="/admin/doctors" className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-center text-xs font-bold text-slate-700 transition-all">
                    Manage Doctors
                  </Link>
                  <Link to="/admin/categories" className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-center text-xs font-bold text-slate-700 transition-all">
                    Edit Categories
                  </Link>
                </div>
              </div>

              {/* Top doctors */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-6">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-4">Top Doctors</h3>
                <div className="space-y-4">
                  {(data?.topDoctors || []).map((d) => (
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
                  {!data?.topDoctors.length && <p className="text-xs text-slate-400">No doctor activity yet.</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export function MetricCard({
  icon: Icon,
  iconCls,
  label,
  value,
  sub,
  subIcon: SubIcon,
  subCls,
}: {
  icon: React.ElementType
  iconCls: string
  label: string
  value: string
  sub: string
  subIcon: React.ElementType
  subCls: string
}) {
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-500">{label}</span>
        <div className={`p-3 rounded-2xl border ${iconCls}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <div className={`flex items-center gap-1.5 text-[11px] font-bold ${subCls}`}>
        <SubIcon className="w-3.5 h-3.5" /> {sub}
      </div>
    </div>
  )
}
