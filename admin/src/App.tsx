import React from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import { LoginPage } from './pages/LoginPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { PatientsPage as DoctorPatientsPage } from './pages/PatientsPage'
import { SchedulePage } from './pages/SchedulePage'
import { ProfilePage } from './pages/ProfilePage'
import { EarningsPage } from './pages/EarningsPage'
import { PatientPaymentsPage } from './pages/PatientPaymentsPage'
import { PayoutsPage } from './pages/PayoutsPage'
import { LocationsPage } from './pages/LocationsPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { DoctorsPage } from './pages/admin/DoctorsPage'
import { AppointmentsPage as AdminAppointmentsPage } from './pages/admin/AppointmentsPage'
import { PatientsPage } from './pages/admin/PatientsPage'
import { CategoriesPage } from './pages/admin/CategoriesPage'
import { SymptomsPage } from './pages/admin/SymptomsPage'
import { InsightsPage } from './pages/admin/InsightsPage'

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

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth()
  if (!hydrated) return <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-slate-600">
        <p className="text-lg font-semibold">This portal is for admins only.</p>
        <p className="text-sm text-slate-400">Logged in as {user.email} ({user.role}).</p>
      </div>
    )
  }
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireDoctor>
        <Outlet />
      </RequireDoctor>
    ),
    children: [
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'patients', element: <DoctorPatientsPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'earnings', element: <EarningsPage /> },
      { path: 'payments', element: <PatientPaymentsPage /> },
      { path: 'payouts', element: <PayoutsPage /> },
      { path: 'locations', element: <LocationsPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <Outlet />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'doctors', element: <DoctorsPage /> },
      { path: 'appointments', element: <AdminAppointmentsPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'symptoms', element: <SymptomsPage /> },
      { path: 'insights', element: <InsightsPage /> },
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
