import React from 'react'
import { Navigate, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import { LoginPage } from './pages/LoginPage'
import { Shell } from './pages/Shell'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { SchedulePage } from './pages/SchedulePage'
import { ProfilePage } from './pages/ProfilePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
})

function RequireDoctor({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth()
  const location = useLocation()
  if (!hydrated) return <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'doctor') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-slate-600">
        <p className="text-lg font-semibold">This portal is for doctors only.</p>
        <p className="text-sm text-slate-400">Logged in as {user.email} ({user.role}).</p>
      </div>
    )
  }
  if (location.pathname === '/') return <Navigate to="/appointments" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireDoctor>
        <Shell />
      </RequireDoctor>
    ),
    children: [
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
