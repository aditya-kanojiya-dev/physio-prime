import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { getStoredUser } from '../lib/api'

const BENEFITS = [
  {
    icon: CalendarDays,
    title: 'Manage your schedule',
    desc: 'Set weekly availability in minutes.',
  },
  {
    icon: ClipboardList,
    title: 'Appointments at a glance',
    desc: 'Upcoming visits, status, and video links.',
  },
  {
    icon: UserRound,
    title: 'Own your profile',
    desc: 'Fees, bio, and expertise under your control.',
  },
]

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'

export function LoginPage() {
  const { user, hydrated, login, signup } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (hydrated && user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/appointments'} replace />

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setError(null)
    setFieldError(null)
    setPassword('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)
    if (mode === 'signup' && password.length < 8) {
      setFieldError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await signup(name.trim(), email.trim(), password)
      navigate(getStoredUser()?.role === 'admin' ? '/admin/dashboard' : '/appointments')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh]">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-teal-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight">PhysioPrime</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-teal-300/80">Doctor Portal</div>
          </div>
        </div>

        <div className="relative max-w-sm">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Your practice, one clear view.</h1>
          <ul className="mt-8 space-y-5">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-teal-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-0.5 text-xs text-teal-200/70">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-teal-200/50">Secure access for verified PhysioPrime practitioners.</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-teal-50/60 to-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-teal-900">PhysioPrime</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600">Doctor Portal</div>
            </div>
          </div>

          <div className="mb-6 lg:hidden">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome to the doctor portal</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your schedule, appointments, and profile.</p>
          </div>

          {/* Segmented tabs */}
          <div className="mb-6 flex gap-6 border-b border-slate-200">
            {(
              [
                { value: 'login', label: 'Log in' },
                { value: 'signup', label: 'Create account' },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => switchMode(t.value)}
                className={`relative pb-2.5 text-sm font-semibold transition-colors ${
                  mode === t.value ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t.label}
                <span
                  className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-teal-600 transition-transform duration-200 ease-out ${
                    mode === t.value ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            ))}
          </div>

          <form key={mode} onSubmit={submit} className="animate-auth-enter space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="ml-1 text-xs font-semibold text-slate-600">Full name</label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Dr. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="ml-1 text-xs font-semibold text-slate-600">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-xs font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldError) setFieldError(null)
                  }}
                  className={`${inputClass} pr-11`}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldError && <p className="ml-1 mt-1 text-xs font-medium text-red-600">{fieldError}</p>}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </span>
              ) : mode === 'login' ? (
                'Log in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            This portal is for verified PhysioPrime practitioners only. Signing up with a patient account is blocked.
          </p>
        </div>
      </main>
    </div>
  )
}
