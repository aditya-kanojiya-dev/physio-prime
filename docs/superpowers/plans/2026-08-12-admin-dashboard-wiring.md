# Admin Dashboard — Wire-Up & Completion Plan

> **Context:** The admin pages already exist under `admin/src/pages/admin/`, styled from the drafts in `admin/admin-drafts/`. They are NOT wired into the router and DO NOT compile. This plan fixes compile errors, creates the two missing pages, and exposes `/admin/*` behind an `admin`-role guard — all while keeping the existing teal/blue palette and the drafts' layout.

## Current State

- Drafts (design reference, imports `../../services/api` — stale, do NOT import from here): `admin/admin-drafts/`
  - `AdminDashboardPage.tsx` · `AdminDoctorsPage.tsx` · `AdminAppointmentsPage.tsx` · `AdminCategoriesPage.tsx` · `AdminSymptomsPage.tsx` · `AdminLoginPage.tsx`
- Real pages (already ported to `../../lib/api` + react-query, follow the drafts): `admin/src/pages/admin/`
  - `DashboardPage.tsx` ✓ · `DoctorsPage.tsx` ✓ · `AppointmentsPage.tsx` ✓ · `PatientsPage.tsx` ✓ · `CategoriesPage.tsx` ✓
  - **Missing:** `SymptomsPage.tsx`, `InsightsPage.tsx`
- Layout: `admin/src/components/admin/AdminLayout.tsx` — currently renders `<Outlet />`, but every page wraps content in `<AdminLayout>...</AdminLayout>` (children). Mismatch.
- Router: `admin/src/App.tsx` — only `/login` + doctor shell routes. **No `/admin/*` routes at all.**
- Auth: `admin/src/lib/auth.tsx` (Supabase, `useAuth().user.role`) + `admin/src/lib/api.ts` (`MeUser.role`).
- API (already implemented, `admin` role required): `api/src/routes/admin.ts`
  - `GET /admin/insights` · `GET/PATCH /admin/doctors/:id`
  - `GET /admin/doctor-applications` · `POST /admin/doctor-applications/:id/decide`
  - `GET /admin/patients` · `GET /admin/appointments` (filters + pagination)
  - `POST /admin/users` · `PATCH /admin/users/:id`
  - CRUD `/admin/categories` · `/admin/symptoms`
- Types: `admin/src/lib/types.ts` — `AdminDoctor`, `AdminApplication`, `AdminPatient`, `AdminAppointment`, `AdminCategory`, `AdminSymptom`, `AdminInsights` all defined.

## Design Constraints (from drafts, keep them)

- Dark admin theme: `bg-slate-950`, cards `rounded-3xl bg-slate-950 border border-slate-800`, table header `bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider`.
- Accent gradients: `from-teal-600 to-blue-600` for primary buttons, `from-blue-600 to-teal-500` for active nav.
- Status pills: `bg-{emerald|rose|amber}-500/20 text-{...}-400 border-{...}-500/30`.
- Money as paise from API → `₹(paise/100).toLocaleString('en-IN')` in UI.
- Reuse shared exports already present: `StatusPill` (from admin/AppointmentsPage), `Modal`, `Field`, `inputCls` (from admin/CategoriesPage).

## Tasks

### 1. Fix AdminLayout children vs Outlet
`admin/src/components/admin/AdminLayout.tsx`
- Replace `<Outlet />` usage: accept `children: React.ReactNode` and render `{children}` inside `<main>`.
- Remove `Outlet` import. (Nav already lists all 7 routes: Dashboard, Doctors, Appointments, Patients, Categories, Symptoms, Insights.)

### 2. Fix CategoriesPage type error
`admin/src/pages/admin/CategoriesPage.tsx`
- `style={{ color: c.color }}` → `c.color ?? undefined` (`string | null` vs `Color | undefined`).

### 3. Create SymptomsPage
`admin/src/pages/admin/SymptomsPage.tsx` (mirror `CategoriesPage` structure + draft `AdminSymptomsPage` card grid)
- `useQuery(['admin/symptoms'])` → `GET /admin/symptoms` → `{ symptoms: AdminSymptom[] }`.
- Card grid `sm:grid-cols-2 lg:grid-cols-3`: image or icon placeholder, title, description, footer `popularFor` + `recoveryEstimate`.
- CRUD modal (create/edit/delete) with fields: `title`, `slug` (auto-lowercase), `iconName`, `description`, `recoveryEstimate`, `image`, `sortOrder`, `active`.
- Add button: `bg-gradient-to-r from-teal-600 to-blue-600`.
- Empty state + error banner like CategoriesPage.

### 4. Create InsightsPage
`admin/src/pages/admin/InsightsPage.tsx` (uses `recharts`, already a dependency)
- `useQuery(['admin/insights', range])` → `GET /admin/insights?from=&to=` (reuse `parseRange` pattern from DashboardPage date input).
- Content:
  - 3 metric cards (revenue, total bookings, new patients) reusing the `MetricCard` pattern from DashboardPage.
  - `LineChart` — bookings & revenue over time from `bookingsByDay`.
  - `PieChart` / `BarChart` — bookings by mode from `bookingsByMode`.
  - Top doctors list from `topDoctors`.
- Keep dark-card wrappers: `rounded-3xl bg-slate-950 border border-slate-800 p-6`.

### 5. Wire /admin/* routes
`admin/src/App.tsx`
- Add `RequireAdmin` guard component (mirror `RequireDoctor`): `hydrated` → `user` → `user.role === 'admin'`, else `<Navigate to="/login" replace />` / role-mismatch screen.
- Add routes:
  ```
  { path: '/admin/dashboard', element: <RequireAdmin><DashboardPage/></RequireAdmin> },
  { path: '/admin/doctors',    ... DoctorsPage },
  { path: '/admin/appointments', ... AppointmentsPage },
  { path: '/admin/patients',   ... PatientsPage },
  { path: '/admin/categories', ... CategoriesPage },
  { path: '/admin/symptoms',   ... SymptomsPage },
  { path: '/admin/insights',   ... InsightsPage },
  ```
- Import all pages from `./pages/admin/*`.

### 6. Admin post-login redirect
`admin/src/pages/LoginPage.tsx`
- On success + on already-authenticated redirect: `user.role === 'admin' ? '/admin/dashboard' : '/appointments'`.
- Update line 50 (`if (hydrated && user) return <Navigate to="/appointments" replace />`) and `navigate('/appointments')` in `submit`.

### 7. Verify
- `cd admin && npx tsc --noEmit` — clean.
- `cd admin && npm run lint` — clean.
- Optional smoke: `npm run dev` in `admin/`, log in as admin seed, visit each `/admin/*` route.

## Notes
- Do NOT touch the drafts folder; it is read-only design reference.
- Do NOT add new deps (recharts already present).
- Doctor portal (`RequireDoctor`, Shell) unchanged.
