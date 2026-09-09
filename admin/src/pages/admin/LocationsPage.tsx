import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Building2, CheckCircle2, Edit3, Loader2, MapPin, Plus, Trash2, UserRound, XCircle } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminDoctor, DoctorLocation, ServiceArea } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatusPill } from './AppointmentsPage'
import { Field, Modal, inputCls } from './CategoriesPage'
import { CITIES } from '../../lib/options'

const emptyAreaForm = { name: '', city: 'Nagpur', active: true, sortOrder: 0 }

type Tab = 'areas' | 'doctor-locations'

export function LocationsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('areas')
  const [areaModalOpen, setAreaModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null)
  const [areaForm, setAreaForm] = useState(emptyAreaForm)
  const [doctorId, setDoctorId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['admin/service-areas'],
    queryFn: async () => (await api.get<{ areas: ServiceArea[] }>('/admin/service-areas')).areas,
  })

  const { data: doctors } = useQuery({
    queryKey: ['admin/doctors'],
    queryFn: async () => (await api.get<{ doctors: AdminDoctor[] }>('/admin/doctors')).doctors,
  })

  const { data: locations, isLoading: locLoading } = useQuery({
    queryKey: ['admin/doctors/locations', doctorId],
    queryFn: async () =>
      doctorId ? (await api.get<{ locations: DoctorLocation[] }>(`/admin/doctors/${doctorId}/locations`)).locations : [],
    enabled: doctorId !== null,
  })

  const invalidateAreas = () => qc.invalidateQueries({ queryKey: ['admin/service-areas'] })
  const invalidateLocs = () => qc.invalidateQueries({ queryKey: ['admin/doctors/locations'] })

  const saveArea = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      editingArea ? api.patch(`/admin/service-areas/${editingArea.id}`, body) : api.post('/admin/service-areas', body),
    onSuccess: () => {
      setAreaModalOpen(false)
      invalidateAreas()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const removeArea = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/service-areas/${id}`),
    onSuccess: invalidateAreas,
  })

  // Doctor availability = the service areas they have an active location row for
  const locByArea = new Map<string, DoctorLocation>()
  for (const l of locations ?? []) if (l.active && l.area) locByArea.set(l.area, l)

  const toggleLoc = useMutation({
    mutationFn: (area: ServiceArea) => {
      const existing = locByArea.get(area.name)
      return existing
        ? api.delete(`/admin/locations/${existing.id}`)
        : api.post(`/admin/doctors/${doctorId}/locations`, {
            name: area.name,
            area: area.name,
            city: area.city || 'Nagpur',
            state: 'Maharashtra',
            radiusKm: '10',
            isPrimary: false,
            active: true,
          })
    },
    onSuccess: invalidateLocs,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Locations</h1>
          <p className="text-xs text-slate-500">Manage the master service-area list and which locations each doctor is available to visit.</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex gap-2">
          {(['areas', 'doctor-locations'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                tab === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
              }`}
            >
              {t === 'areas' ? 'Service Areas' : 'Doctor Availability'}
            </button>
          ))}
        </div>

        {tab === 'areas' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingArea(null)
                  setAreaForm(emptyAreaForm)
                  setAreaModalOpen(true)
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Area
              </button>
            </div>
            {areasLoading ? (
              <div className="min-h-[20vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(areas || []).map((a) => (
                  <div key={a.id} className="p-4 rounded-3xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm truncate flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-teal-500 shrink-0" /> {a.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{a.city || 'Nagpur'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill tone={a.active ? 'emerald' : 'slate'} label={a.active ? 'Active' : 'Hidden'} />
                      <button
                        onClick={() => {
                          setEditingArea(a)
                          setAreaForm({ name: a.name, city: a.city || 'Nagpur', active: a.active, sortOrder: a.sortOrder })
                          setAreaModalOpen(true)
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-teal-700 border border-slate-200 transition-all"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete area "${a.name}"?`)) removeArea.mutate(a.id)
                        }}
                        className="p-2 rounded-xl bg-rose-100 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(areas || []).length === 0 && <p className="text-sm text-slate-400">No service areas yet.</p>}
              </div>
            )}
          </div>
        )}

        {tab === 'doctor-locations' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                <Building2 className="w-4 h-4 text-teal-500" /> Doctor:
              </div>
              <select
                value={doctorId ?? ''}
                onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} sm:flex-1`}
              >
                <option value="">Select a doctor…</option>
                {(doctors || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty || 'No specialty'})
                  </option>
                ))}
              </select>
            </div>

            {doctorId === null ? (
              <div className="p-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-3xl">
                <UserRound className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Select a doctor to see and edit which locations they're available to visit
              </div>
            ) : locLoading ? (
              <div className="min-h-[20vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            ) : (
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mb-3">Available for visiting</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(areas || []).map((a) => {
                    const selected = !!locByArea.get(a.name)
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleLoc.mutate(a)}
                        disabled={toggleLoc.isPending || !a.active}
                        className={`relative flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all disabled:opacity-60 ${
                          selected
                            ? 'border-teal-300 bg-teal-50 text-teal-700 ring-1 ring-teal-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{a.name}</span>
                        </span>
                        {selected ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Toggle an area on to make this doctor available for home visits there; toggle off to remove it.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {areaModalOpen && (
        <Modal title={editingArea ? 'Edit Service Area' : 'Add Service Area'} onClose={() => setAreaModalOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              saveArea.mutate({
                name: areaForm.name,
                city: areaForm.city || null,
                active: areaForm.active,
                sortOrder: Number(areaForm.sortOrder),
              })
            }}
            className="space-y-4 text-xs"
          >
            <Field label="Name *">
              <input required value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City">
                <select value={areaForm.city} onChange={(e) => setAreaForm({ ...areaForm, city: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sort Order">
                <input type="number" value={areaForm.sortOrder} onChange={(e) => setAreaForm({ ...areaForm, sortOrder: Number(e.target.value) })} className={inputCls} />
              </Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={areaForm.active} onChange={(e) => setAreaForm({ ...areaForm, active: e.target.checked })} className="accent-teal-600 w-4 h-4" />
              <span className="font-bold text-slate-600">Active (visible on site)</span>
            </label>
            <button
              type="submit"
              disabled={saveArea.isPending}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white rounded-2xl shadow-lg shadow-teal-600/30 transition-all text-xs disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saveArea.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Area'}
            </button>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}