import React, { Suspense, lazy } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import { LoginPage } from './pages/LoginPage'

const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
const PatientsPage = lazy(() => import('./pages/PatientsPage').then(m => ({ default: m.PatientsPage as any })))
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const EarningsPage = lazy(() => import('./pages/EarningsPage').then(m => ({ default: m.EarningsPage })))
const PatientPaymentsPage = lazy(() => import('./pages/PatientPaymentsPage').then(m => ({ default: m.PatientPaymentsPage })))
const PayoutsPage = lazy(() => import('./pages/PayoutsPage').then(m => ({ default: m.PayoutsPage })))
const LocationsPage = lazy(() => import('./pages/LocationsPage').then(m => ({ default: m.LocationsPage })))
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })))
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })))
const CommunityDetailPage = lazy(() => import('./pages/CommunityDetailPage').then(m => ({ default: m.CommunityDetailPage })))
const DoctorBlogsPage = lazy(() => import('./pages/DoctorBlogsPage').then(m => ({ default: m.DoctorBlogsPage })))
const DoctorBlogFormPage = lazy(() => import('./pages/DoctorBlogFormPage').then(m => ({ default: m.DoctorBlogFormPage })))
const DoctorOverviewPage = lazy(() => import('./pages/DoctorOverviewPage').then(m => ({ default: m.DoctorOverviewPage })))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AdminDoctorsPage = lazy(() => import('./pages/admin/DoctorsPage').then(m => ({ default: m.DoctorsPage })))
const AdminLocationsPage = lazy(() => import('./pages/admin/LocationsPage').then(m => ({ default: m.LocationsPage })))
const CommissionsPage = lazy(() => import('./pages/admin/CommissionsPage').then(m => ({ default: m.CommissionsPage })))
const DoctorLedgerPage = lazy(() => import('./pages/admin/DoctorLedgerPage').then(m => ({ default: m.DoctorLedgerPage })))
const AdminAppointmentsPage = lazy(() => import('./pages/admin/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
const AdminPatientsPage = lazy(() => import('./pages/admin/PatientsPage').then(m => ({ default: m.PatientsPage })))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const SymptomsPage = lazy(() => import('./pages/admin/SymptomsPage').then(m => ({ default: m.SymptomsPage })))
const InsightsPage = lazy(() => import('./pages/admin/InsightsPage').then(m => ({ default: m.InsightsPage })))
const BlogsPage = lazy(() => import('./pages/admin/BlogsPage').then(m => ({ default: m.BlogsPage })))
const BlogFormPage = lazy(() => import('./pages/admin/BlogFormPage').then(m => ({ default: m.BlogFormPage })))
const TestimonialsPage = lazy(() => import('./pages/admin/TestimonialsPage').then(m => ({ default: m.TestimonialsPage })))
const MediaLibraryPage = lazy(() => import('./pages/admin/MediaLibraryPage').then(m => ({ default: m.MediaLibraryPage })))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage').then(m => ({ default: m.AdminProfilePage })))
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage').then(m => ({ default: m.PaymentsPage })))
const DoctorPayoutsPage = lazy(() => import('./pages/admin/DoctorPayoutsPage').then(m => ({ default: m.DoctorPayoutsPage })))

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
      { path: 'patients', element: <PatientsPage /> },
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
      { path: 'doctors', element: <AdminDoctorsPage /> },
      { path: 'doctors/:id', element: <DoctorLedgerPage /> },
      { path: 'locations', element: <AdminLocationsPage /> },
      { path: 'commissions', element: <CommissionsPage /> },
      { path: 'appointments', element: <AdminAppointmentsPage /> },
      { path: 'patients', element: <AdminPatientsPage /> },
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
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  )
}
