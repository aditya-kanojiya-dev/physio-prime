import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  DollarSign,
  MessageCircle,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { api } from '../lib/api'
import { formatFee } from '../lib/types'
import { useAuth } from '../lib/auth'
import { AdminLayout } from '../components/admin/AdminLayout'

export function DoctorOverviewPage() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })

  const { data: appointments } = useQuery<{ appointments: any[] }>({
    queryKey: ['doctor/appointments', 'today'],
    queryFn: () => api.get('/doctor/appointments?date=today'),
  })

  const { data: earnings } = useQuery<{ summary: Record<string, any> }>({
    queryKey: ['doctor/earnings/summary', 'month'],
    queryFn: () => api.get('/doctor/earnings/summary?period=month'),
  })

  const { data: chart } = useQuery<{ chart: { date: string; earnings: number }[] }>({
    queryKey: ['doctor/earnings/chart', 'week'],
    queryFn: () => api.get('/doctor/earnings/chart?period=week'),
  })

  const { data: community } = useQuery<{ posts: any[] }>({
    queryKey: ['community/posts', 'top'],
    queryFn: () => api.get('/community/posts?sort=top&limit=3'),
  })

  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/doctor/conversations'),
    select: (data: any) => ({ ...data, conversations: data.conversations?.slice(0, 3) }),
  })

  const { data: locations } = useQuery({
    queryKey: ['doctor/locations'],
    queryFn: () => api.get('/doctor/locations'),
    select: (data: any) => ({ ...data, locations: data.locations?.filter((l: any) => l.active) }),
  })

  const todayAppts: any[] = appointments?.appointments ?? []
  const chartData: any[] = chart?.chart ?? []
  const posts: any[] = community?.posts ?? []
  const conversations: any[] = convData?.conversations ?? []
  const activeLocations: any[] = locations?.locations ?? []
  const summary = earnings?.summary ?? {}

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}, Dr. {user?.name?.split(' ')[0] || ''}
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {today} — Here's your practice overview for today.
          </p>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            icon={CalendarCheck}
            iconCls="bg-blue-100 text-blue-700 border-blue-200"
            label="Today's Appointments"
            value={String(todayAppts.length)}
            sub="Scheduled for today"
            subIcon={Clock}
            subCls="text-blue-700"
          />
          <MetricCard
            icon={DollarSign}
            iconCls="bg-emerald-100 text-emerald-700 border-emerald-200"
            label="Monthly Earnings"
            value={formatFee(summary.totalEarningsPaise ?? 0)}
            sub="This month"
            subIcon={TrendingUp}
            subCls="text-emerald-700"
          />
          <MetricCard
            icon={Wallet}
            iconCls="bg-amber-100 text-amber-700 border-amber-200"
            label="Pending Payout"
            value={formatFee(summary.pendingPayoutPaise ?? 0)}
            sub="Awaiting settlement"
            subIcon={Clock}
            subCls="text-amber-700"
          />
          <MetricCard
            icon={CheckCircle}
            iconCls="bg-teal-100 text-teal-700 border-teal-200"
            label="Completed Visits"
            value={String(summary.completedVisits ?? 0)}
            sub="All-time completed"
            subIcon={TrendingUp}
            subCls="text-teal-700"
          />
        </div>

        {/* Mini Earnings Chart */}
        {chartData.length > 0 && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Earnings — Last 7 Days</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="earnings" stroke="#0d9488" fill="url(#earnGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Row 1: Upcoming Appointments + Recent Community */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-3">Upcoming Appointments</h3>
            <div className="space-y-3">
              {todayAppts.slice(0, 5).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{a.patientName || a.patient?.name || 'Patient'}</p>
                    <p className="text-slate-500">{a.time || a.date} · {a.mode}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    a.mode === 'online' ? 'bg-teal-100 text-teal-700' :
                    a.mode === 'home' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {a.mode}
                  </span>
                </div>
              ))}
              {!todayAppts.length && <p className="text-xs text-slate-400">No appointments today.</p>}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-3">Recent Community</h3>
            <div className="space-y-3">
              {posts.map((p: any) => (
                <Link key={p.id} to={`/community/${p.id}`} className="block p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100 transition-colors">
                  <p className="font-bold text-slate-900">{p.title}</p>
                  <p className="text-slate-500 mt-1">▲ {p.votes ?? 0} votes</p>
                </Link>
              ))}
              {!posts.length && <p className="text-xs text-slate-400">No posts yet.</p>}
            </div>
          </div>
        </div>

        {/* Row 2: Unread Messages + Location Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-3">Unread Messages</h3>
            <div className="space-y-3">
              {conversations.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{c.otherPartyName || c.doctorName || 'Conversation'}</p>
                    <p className="text-slate-500 truncate">{c.lastMessage || 'No messages'}</p>
                  </div>
                </div>
              ))}
              {!conversations.length && <p className="text-xs text-slate-400">No unread messages.</p>}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-3">Location Status</h3>
            <div className="space-y-3">
              {activeLocations.map((l: any) => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{l.name}</p>
                    <p className="text-slate-500 truncate">{l.address || l.area || ''}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
              ))}
              {!activeLocations.length && <p className="text-xs text-slate-400">No active locations.</p>}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function MetricCard({
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
