import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  Layers,
  DollarSign,
  Wallet,
  X,
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
  { to: '/earnings', label: 'Earnings', icon: DollarSign },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/payouts', label: 'Payouts', icon: Wallet },
]

export function AdminLayout({ children, portal = 'admin' }: { children: React.ReactNode; portal?: 'admin' | 'doctor' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isDoctor = portal === 'doctor'
  const nav = isDoctor ? doctorNav : adminNav
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:bg-white lg:px-4 lg:py-6">
        <SideNav nav={nav} isDoctor={isDoctor} onLogout={handleLogout} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white px-4 py-6 shadow-2xl">
            <div className="flex justify-end">
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SideNav nav={nav} isDoctor={isDoctor} onLogout={handleLogout} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="-ml-2 p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 text-white">
              {isDoctor ? <Stethoscope className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">PhysioPrime</span>
          </div>
          <div className="min-w-0 text-right">
            <div className="truncate text-xs font-bold text-slate-900">{user?.name || user?.email}</div>
            <div className="text-[10px] text-slate-500">{user?.role}</div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <header className="mb-6 hidden items-center justify-between lg:flex">
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
    </div>
  )
}

function SideNav({
  nav,
  isDoctor,
  onLogout,
  onNavigate,
}: {
  nav: { to: string; label: string; icon: React.ElementType }[]
  isDoctor: boolean
  onLogout: () => void
  onNavigate?: () => void
}) {
  return (
    <>
      <NavLink to={isDoctor ? '/appointments' : '/admin/dashboard'} onClick={onNavigate} className="flex items-center gap-3 px-2">
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
            onClick={onNavigate}
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
        onClick={onLogout}
        className="mt-8 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </>
  )
}
