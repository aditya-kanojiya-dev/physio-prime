import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  FileText,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  Layers,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarCheck },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/symptoms', label: 'Symptoms', icon: FileText },
  { to: '/admin/insights', label: 'Insights', icon: BarChart3 },
]

const doctorNav = [
  { to: '/appointments', label: 'Appointments', icon: CalendarCheck },
  { to: '/patients', label: 'My Patients', icon: Users },
  { to: '/schedule', label: 'Schedule', icon: Stethoscope },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function AdminLayout({ children, portal = 'admin' }: { children: React.ReactNode; portal?: 'admin' | 'doctor' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isDoctor = portal === 'doctor'
  const nav = isDoctor ? doctorNav : adminNav

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-4 py-6">
        <NavLink to={isDoctor ? '/appointments' : '/admin/dashboard'} className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 text-white shadow-md shadow-blue-500/30">
            {isDoctor ? <Stethoscope className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">
              Physio<span className="text-gradient">Prime</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {isDoctor ? 'Doctor Portal' : 'Admin Portal'}
            </div>
          </div>
        </NavLink>
        <nav className="mt-8 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
          className="mt-8 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </aside>
      <main className="h-screen flex-1 overflow-y-auto p-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <UserRound className="h-4 w-4" />
            {user?.role}
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900">{user?.name || user?.email}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
