import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, CalendarDays, LogOut, Stethoscope, UserRound } from 'lucide-react'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/schedule', label: 'Schedule', icon: Stethoscope },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function Shell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white/85 px-4 py-6 backdrop-blur-md">
        <NavLink to="/appointments" className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 text-white shadow-md shadow-blue-500/30">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">
              Physio<span className="text-gradient">Prime</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Doctor Portal</div>
          </div>
        </NavLink>
        <nav className="mt-8 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
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
          className="mt-8 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </aside>
      <main className="flex-1 p-8">
        <header className="mb-6 flex items-center justify-between">
          <div />
          <div className="text-right">
            <div className="text-sm font-bold text-slate-700">{user?.name || user?.email}</div>
            <div className="text-xs text-slate-400">{user?.email}</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
