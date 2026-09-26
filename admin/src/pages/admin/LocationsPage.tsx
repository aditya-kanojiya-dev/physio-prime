import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Edit3, Loader2, MapPin, Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminDoctor, LocationRow, ServiceArea } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { confirmDialog } from '../../components/admin/ConfirmDialog'
import { StatusPill } from './AppointmentsPage'
import { Field, Modal, inputCls } from './CategoriesPage'
import { CITIES } from '../../lib/options'
import { hasErrors, intInRange, maxLen, type Errors } from '../../lib/validate'

const emptyAreaForm = { name: '', city: 'Nagpur', active: true, sortOrder: 0 }

type Tab = 'areas' | 'doctor-locations'

export function LocationsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('areas')
  const [areaModalOpen, setAreaModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null)
  const [areaForm, setAreaForm] = useState(emptyAreaForm)
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null)
  const [addDoctorId, setAddDoctorId] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors<'name' | 'city' | 'sortOrder'>>({})

  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['admin/service-areas'],
    queryFn: async () => (await api.get<{ areas: ServiceArea[] }>('/admin/service-areas')).areas,
  })

  const { data: doctors } = useQuery({
    queryKey: ['admin/doctors'],
    queryFn: async () => (await api.get<{ doctors: AdminDoctor[] }>('/admin/doctors')).doctors,
  })

  const { data: locRows, isLoading: locLoading } = useQuery({
    queryKey: ['admin/locations'],
    queryFn: async () => (await api.get<{ locations: LocationRow[] }>('/admin/locations')).locations,
  })

  const invalidateAreas = () => qc.invalidateQueries({ queryKey: ['admin/service-areas'] })
  const invalidateLocs = () => qc.invalidateQueries({ queryKey: ['admin/locations'] })

  const saveArea = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      editingArea ? api.patch(`/admin/service-areas/${editingArea.id}`, body) : api.post('/admin/service-areas', body),
    onSuccess: () => { setAreaModalOpen(false); invalidateAreas() },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const submitArea = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const next: Errors<'name' | 'city' | 'sortOrder'> = {
      name: areaForm.name ? maxLen(areaForm.name, 100, 'Name') : 'Name is required',
      city: areaForm.city ? maxLen(areaForm.city, 100, 'City') : undefined,
      sortOrder: intInRange(String(areaForm.sortOrder), 0, 100000, 'Sort order'),
    }
    setErrors(next)
    if (hasErrors(next)) return
    saveArea.mutate({ name: areaForm.name.trim(), city: areaForm.city || null, active: areaForm.active, sortOrder: Number(areaForm.sortOrder) })
  }

  const removeArea = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/service-areas/${id}`),
    onSuccess: invalidateAreas,
  })

  // Map: area name → Map<doctorId, row> for fast lookups & deduping
  const areaDoctorsMap = useMemo(() => {
    const map = new Map<string, Map<number, LocationRow>>()
    for (const r of locRows ?? []) {
      const area = r.area
      if (!area) continue
      if (!map.has(area)) map.set(area, new Map())
      map.get(area)!.set(r.doctorId, r)
    }
    return map
  }, [locRows])

  const addLocation = useMutation({
    mutationFn: () => {
      if (!selectedArea || !addDoctorId) throw new Error('Select a doctor')
      return api.post(`/admin/doctors/${addDoctorId}/locations`, {
        name: selectedArea.name,
        area: selectedArea.name,
        city: selectedArea.city || 'Nagpur',
        state: 'Maharashtra',
        radiusKm: '10',
        isPrimary: false,
        active: true,
      })
    },
    onSuccess: () => { setAddDoctorId(0); invalidateLocs() },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Add failed'),
  })

  const removeLocation = useMutation({
    mutationFn: (locationId: number) => api.delete(`/admin/locations/${locationId}`),
    onSuccess: invalidateLocs,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Remove failed'),
  })

  const activeAreas = useMemo(() => (areas ?? []).filter((a) => a.active), [areas])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Locations</h1>
          <p className="text-xs text-slate-500">Manage the master service-area list and which doctors are available for each location.</p>
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
                onClick={() => { setEditingArea(null); setAreaForm(emptyAreaForm); setAreaModalOpen(true) }}
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
                        onClick={() => { setEditingArea(a); setAreaForm({ name: a.name, city: a.city || 'Nagpur', active: a.active, sortOrder: a.sortOrder }); setAreaModalOpen(true) }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-teal-700 border border-slate-200 transition-all"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => { if (await confirmDialog({ title: 'Delete Service Area', message: `Delete area "${a.name}"?` })) removeArea.mutate(a.id) }}
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
            {locLoading ? (
              <div className="min-h-[20vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            ) : activeAreas.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-3xl">
                No active service areas. Add one under Service Areas first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAreas.map((a) => {
                  const doctorMap = areaDoctorsMap.get(a.name)
                  const count = doctorMap?.size ?? 0
                  return (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedArea(a); setAddDoctorId(0) }}
                      className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-600/10 text-left transition-all group"
                    >
                      <p className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-500 shrink-0" /> {a.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">{a.city || 'Nagpur'}</p>
                      <p className="mt-3 text-xs font-bold text-teal-700 bg-teal-50 rounded-full px-3 py-1 inline-block">
                        {count} doctor{count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Area modal */}
      {areaModalOpen && (
        <Modal title={editingArea ? 'Edit Service Area' : 'Add Service Area'} onClose={() => setAreaModalOpen(false)}>
          <form
            onSubmit={submitArea}
            noValidate
            className="space-y-4 text-xs"
          >
            <Field label="Name *" error={errors.name}>
              <input value={areaForm.name} onChange={(e) => { setAreaForm({ ...areaForm, name: e.target.value }); setErrors((p) => ({ ...p, name: undefined })) }} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" error={errors.city}>
                <select value={areaForm.city} onChange={(e) => { setAreaForm({ ...areaForm, city: e.target.value }); setErrors((p) => ({ ...p, city: undefined })) }} className={inputCls}>
                  <option value="">—</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sort Order" error={errors.sortOrder}>
                <input
                  type="number"
                  value={areaForm.sortOrder}
                  onChange={(e) => { setAreaForm({ ...areaForm, sortOrder: Number(e.target.value) }); setErrors((p) => ({ ...p, sortOrder: undefined })) }}
                  className={inputCls}
                />
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

      {/* Location Detail modal — list/add/remove doctors for the selected area */}
      {selectedArea && (
        <Modal title={`${selectedArea.name} — Doctors`} onClose={() => setSelectedArea(null)}>
          {locLoading ? (
            <div className="min-h-[12vh] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : (
            <LocationDetailModal
              area={selectedArea}
              doctorMap={areaDoctorsMap.get(selectedArea.name)}
              allDoctors={doctors ?? []}
              addDoctorId={addDoctorId}
              setAddDoctorId={setAddDoctorId}
              addLocation={addLocation}
              removeLocation={removeLocation}
            />
          )}
        </Modal>
      )}
    </AdminLayout>
  )
}

// ------------------------------------------------------------------
// Inner component: the modal content for a single area's doctors list
// ------------------------------------------------------------------
function LocationDetailModal({
  area,
  doctorMap,
  allDoctors,
  addDoctorId,
  setAddDoctorId,
  addLocation,
  removeLocation,
}: {
  area: ServiceArea
  doctorMap: Map<number, LocationRow> | undefined
  allDoctors: AdminDoctor[]
  addDoctorId: number
  setAddDoctorId: (v: number) => void
  addLocation: { mutate: () => void; isPending: boolean }
  removeLocation: { mutate: (id: number) => void; isPending: boolean }
}) {
  const assignedIds = useMemo(() => new Set(doctorMap?.keys()), [doctorMap])
  const candidates = useMemo(() => allDoctors.filter((d) => d.status === 'active' && !assignedIds.has(d.id)), [allDoctors, assignedIds])

  return (
    <div className="space-y-4 text-xs">
      {(!doctorMap || doctorMap.size === 0) && <p className="text-slate-400 text-sm py-2">No doctors assigned to this area yet.</p>}

      {/* Assigned list */}
      <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1 divide-y divide-slate-100">
        {Array.from(doctorMap?.entries() ?? []).map(([id, row]) => (
          <li key={id} className="flex items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">{row.doctorName}</p>
              <p className="text-[11px] text-slate-400">{row.specialty || 'No specialty'}</p>
            </div>
            <button
              onClick={async () => { if (await confirmDialog({ title: 'Remove Doctor', message: `Remove ${row.doctorName} from ${area.name}?` })) removeLocation.mutate(row.id) }}
              disabled={removeLocation.isPending}
              className="p-2 rounded-xl bg-rose-100 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shrink-0"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Add doctor */}
      {candidates.length > 0 ? (
        <div className="flex items-end gap-2 pt-2 border-t border-slate-100">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-600 mb-1">Add doctor</p>
            <select
              value={addDoctorId}
              onChange={(e) => setAddDoctorId(Number(e.target.value))}
              className={inputCls}
            >
              <option value={0}>Select doctor…</option>
              {candidates.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialty || 'General'})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => addLocation.mutate()}
            disabled={!addDoctorId || addLocation.isPending}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
          >
            {addLocation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
      ) : (
        <p className="text-slate-400 text-[11px] pt-2 border-t border-slate-100">All active doctors are already assigned to this area.</p>
      )}
    </div>
  )
}
