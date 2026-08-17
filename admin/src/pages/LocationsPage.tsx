import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import {
  AlertCircle,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { DoctorLocation } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

const inputCls =
  'w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-teal-500 transition-colors'

const emptyForm = {
  name: '',
  address: '',
  area: '',
  city: '',
  state: '',
  pincode: '',
  lat: '',
  lng: '',
  radiusKm: '5',
}

export function LocationsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [homeVisits, setHomeVisits] = useState(false)
  const [maxRadius, setMaxRadius] = useState(25)
  const [settingsDirty, setSettingsDirty] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['doctor/locations'],
    queryFn: async () => {
      const res = await api.get<{ locations: DoctorLocation[]; homeVisitsEnabled: boolean; maxRadiusKm: string }>('/doctor/locations')
      setHomeVisits(res.homeVisitsEnabled)
      setMaxRadius(Number(res.maxRadiusKm) || 25)
      return res
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['doctor/locations'] })

  const addMutation = useMutation({
    mutationFn: (body: typeof form) => api.post('/doctor/locations', body),
    onSuccess: () => { setModalOpen(false); setForm(emptyForm); invalidate() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & typeof form) =>
      api.patch(`/doctor/locations/${id}`, body),
    onSuccess: () => { setModalOpen(false); setEditingId(null); setForm(emptyForm); invalidate() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/doctor/locations/${id}`),
    onSuccess: () => { setDeleteId(null); invalidate() },
  })

  const primaryMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/doctor/locations/${id}/primary`, {}),
    onSuccess: invalidate,
  })

  const settingsMutation = useMutation({
    mutationFn: (body: { homeVisitsEnabled: boolean; maxRadiusKm: number }) =>
      api.patch('/doctor/locations/settings', body),
    onSuccess: () => setSettingsDirty(false),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.patch(`/doctor/locations/${id}`, { active }),
    onSuccess: invalidate,
  })

  const locations = data?.locations ?? []

  function openAdd(lat?: number, lng?: number) {
    setEditingId(null)
    setForm({ ...emptyForm, lat: lat != null ? String(lat) : '', lng: lng != null ? String(lng) : '' })
    setModalOpen(true)
  }

  function openEdit(loc: DoctorLocation) {
    setEditingId(loc.id)
    setForm({
      name: loc.name,
      address: loc.address || '',
      area: loc.area || '',
      city: loc.city || '',
      state: loc.state || '',
      pincode: loc.pincode || '',
      lat: loc.lat || '',
      lng: loc.lng || '',
      radiusKm: loc.radiusKm,
    })
    setModalOpen(true)
  }

  function handleSave() {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form })
    } else {
      addMutation.mutate(form)
    }
  }

  const defaultCenter: [number, number] = [21.1458, 79.0882]

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Locations</h1>
            <p className="text-xs text-slate-500">Manage your practice locations and home visit settings.</p>
          </div>
          <button
            onClick={() => openAdd()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Location
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Settings */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Settings</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Home Visits</span>
                <button
                  onClick={() => { setHomeVisits(v => !v); setSettingsDirty(true) }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${homeVisits ? 'bg-teal-600' : 'bg-slate-300'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${homeVisits ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-600">Max Visitation Radius</span>
                  <span className="text-xs font-extrabold text-teal-600">{maxRadius} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={maxRadius}
                  onChange={(e) => { setMaxRadius(Number(e.target.value)); setSettingsDirty(true) }}
                  className="w-full accent-teal-600"
                />
              </div>
              {settingsDirty && (
                <button
                  onClick={() => settingsMutation.mutate({ homeVisitsEnabled: homeVisits, maxRadiusKm: maxRadius })}
                  disabled={settingsMutation.isPending}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50"
                >
                  {settingsMutation.isPending ? 'Saving…' : 'Save Settings'}
                </button>
              )}
            </div>

            {/* Location List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-10 rounded-3xl bg-white border border-slate-200 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                </div>
              ) : locations.length === 0 ? (
                <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-400">No locations yet</p>
                  <p className="text-xs text-slate-400">Click "Add Location" or click on the map to get started.</p>
                </div>
              ) : (
                locations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`rounded-3xl border bg-white p-4 transition-all ${loc.isPrimary ? 'border-teal-300 ring-1 ring-teal-200' : 'border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {loc.isPrimary && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                          <span className="text-sm font-extrabold text-slate-900 truncate">{loc.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {[loc.area, loc.city].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                          {loc.radiusKm} km
                        </span>
                        <button
                          onClick={() => toggleActive.mutate({ id: loc.id, active: !loc.active })}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${loc.active ? 'bg-teal-600' : 'bg-slate-300'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${loc.active ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => openEdit(loc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                      {!loc.isPrimary && (
                        <button
                          onClick={() => primaryMutation.mutate(loc.id)}
                          disabled={primaryMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                          <Star className="h-3 w-3" /> Set Primary
                        </button>
                      )}
                      {deleteId === loc.id ? (
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => deleteMutation.mutate(loc.id)}
                            disabled={deleteMutation.isPending}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? '…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteId(loc.id)}
                          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel — Map */}
          <div className="lg:col-span-3 rounded-3xl border border-slate-200 overflow-hidden" style={{ minHeight: 500 }}>
            <MapContainer
              center={locations[0]?.lat && locations[0]?.lng ? [Number(locations[0].lat), Number(locations[0].lng)] : defaultCenter}
              zoom={12}
              className="h-full w-full"
              style={{ height: '100%', minHeight: 500 }}
            >
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler onMapClick={(lat, lng) => openAdd(lat, lng)} />
              {locations.filter(l => l.lat && l.lng).map((loc) => {
                const lat = Number(loc.lat)
                const lng = Number(loc.lng)
                const radius = Number(loc.radiusKm) * 1000
                return (
                  <div key={loc.id}>
                    <Marker position={[lat, lng]} />
                    <Circle
                      center={[lat, lng]}
                      radius={radius}
                      pathOptions={{ color: '#14b8a6', fillColor: '#14b8a6', fillOpacity: 0.12, weight: 1 }}
                    />
                  </div>
                )
              })}
            </MapContainer>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingId ? 'Edit Location' : 'Add Location'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {(addMutation.isError || updateMutation.isError) && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {(addMutation.error as ApiError)?.message || (updateMutation.error as ApiError)?.message || 'Something went wrong'}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                  <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                  <input className={inputCls} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Area</label>
                    <input className={inputCls} value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">City</label>
                    <input className={inputCls} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">State</label>
                    <input className={inputCls} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Pincode</label>
                    <input className={inputCls} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Latitude</label>
                    <input className={inputCls} type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Longitude</label>
                    <input className={inputCls} type="number" step="any" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500">Radius (km)</label>
                    <span className="text-xs font-extrabold text-teal-600">{form.radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={form.radiusKm}
                    onChange={e => setForm(f => ({ ...f, radiusKm: e.target.value }))}
                    className="w-full accent-teal-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || addMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50"
                >
                  {(addMutation.isPending || updateMutation.isPending) ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
