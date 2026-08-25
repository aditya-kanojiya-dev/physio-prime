import React from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
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
import { MessagesPage } from './pages/MessagesPage'
import { CommunityPage } from './pages/CommunityPage'
import { CommunityDetailPage } from './pages/CommunityDetailPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { DoctorsPage } from './pages/admin/DoctorsPage'
import { DoctorLedgerPage } from './pages/admin/DoctorLedgerPage'
import { AppointmentsPage as AdminAppointmentsPage } from './pages/admin/AppointmentsPage'
import { PatientsPage } from './pages/admin/PatientsPage'
import { CategoriesPage } from './pages/admin/CategoriesPage'
import { SymptomsPage } from './pages/admin/SymptomsPage'
import { InsightsPage } from './pages/admin/InsightsPage'
import { BlogsPage } from './pages/admin/BlogsPage'
import { BlogFormPage } from './pages/admin/BlogFormPage'
import { TestimonialsPage } from './pages/admin/TestimonialsPage'
import { MediaLibraryPage } from './pages/admin/MediaLibraryPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { AdminProfilePage } from './pages/admin/AdminProfilePage'
import { PaymentsPage } from './pages/admin/PaymentsPage'
import { DoctorPayoutsPage } from './pages/admin/DoctorPayoutsPage'
import { DoctorBlogsPage } from './pages/DoctorBlogsPage'
import { DoctorBlogFormPage } from './pages/DoctorBlogFormPage'
import { DoctorOverviewPage } from './pages/DoctorOverviewPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
})

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user, hydrated } = useAuth()
  if (!hydrated) return <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-slate-600">
        <p className="text-lg font-semibold">This portal is for {role}s only.</p>
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
      <RequireRole role="doctor">
        <Outlet />
      </RequireRole>
    ),
    children: [
      { index: true, element: <DoctorOverviewPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'patients', element: <DoctorPatientsPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'earnings', element: <EarningsPage /> },
      { path: 'payments', element: <PatientPaymentsPage /> },
      { path: 'payouts', element: <PayoutsPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'community', element: <CommunityPage /> },
      { path: 'community/:id', element: <CommunityDetailPage /> },
      { path: 'blogs', element: <DoctorBlogsPage /> },
      { path: 'blogs/:id', element: <DoctorBlogFormPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireRole role="admin">
        <Outlet />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'doctors', element: <DoctorsPage /> },
      { path: 'doctors/:id', element: <DoctorLedgerPage /> },
      { path: 'appointments', element: <AdminAppointmentsPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'symptoms', element: <SymptomsPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'blogs', element: <BlogsPage /> },
      { path: 'blogs/:id', element: <BlogFormPage /> },
      { path: 'testimonials', element: <TestimonialsPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'payouts', element: <DoctorPayoutsPage /> },
      { path: 'media', element: <MediaLibraryPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
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
