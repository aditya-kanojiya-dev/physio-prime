import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarDays, LogOut, Stethoscope, UserRound } from 'lucide-react'
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
      <aside className="w-56 shrink-0 border-r border-teal-100 bg-white px-4 py-6">
        <div className="px-2 text-lg font-bold text-teal-800">PhysioPrime</div>
        <div className="px-2 text-xs text-slate-400">Doctor Portal</div>
        <nav className="mt-8 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'
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
          className="mt-8 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </aside>
      <main className="flex-1 bg-teal-50/40 p-8">
        <header className="mb-6 flex items-center justify-between">
          <div />
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-700">{user?.name || user?.email}</div>
            <div className="text-xs text-slate-400">{user?.email}</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
