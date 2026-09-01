import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  Globe2,
  Loader2,
  MapPin,
  XCircle,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { DoctorLocation } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'

const CITY = 'Nagpur'

interface MasterLocations {
  areas: string[]
  panIndia: string
}

export function LocationsPage() {
  const qc = useQueryClient()
  const [homeVisits, setHomeVisits] = useState(false)
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const master = useQuery({
    queryKey: ['locations/master'],
    queryFn: async () => (await api.get<MasterLocations>('/doctors/locations/master')),
  })

  const current = useQuery({
    queryKey: ['doctor/locations'],
    queryFn: async () => {
      const res = await api.get<{ locations: DoctorLocation[]; homeVisitsEnabled: boolean }>('/doctor/locations')
      setHomeVisits(!!res.homeVisitsEnabled)
      return res
    },
  })

  const myLocations = current.data?.locations ?? []
  const invalidate = () => qc.invalidateQueries({ queryKey: ['doctor/locations'] })

  // Area name -> active location row
  const byArea = useMemo(() => {
    const m = new Map<string, DoctorLocation>()
    for (const l of myLocations) if (l.active && l.area) m.set(l.area, l)
    return m
  }, [myLocations])

  const addMutation = useMutation({
    mutationFn: (area: string) =>
      api.post('/doctor/locations', { name: area, area, city: CITY, active: true, radiusKm: '10' }),
    onSuccess: invalidate,
    onError: (e: ApiError) => setError(e.message),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/doctor/locations/${id}`),
    onSuccess: invalidate,
    onError: (e: ApiError) => setError(e.message),
  })

  const settingsMutation = useMutation({
    mutationFn: (body: { homeVisitsEnabled: boolean; radiusKm: number }) =>
      api.patch('/doctor/locations/settings', { homeVisitsEnabled: body.homeVisitsEnabled, maxRadiusKm: String(body.radiusKm) }),
    onSuccess: () => setSettingsDirty(false),
    onError: (e: ApiError) => setError(e.message),
  })

  const areas = master.data?.areas ?? []
  const toggle = (area: string) => {
    setError(null)
    const loc = byArea.get(area)
    if (loc) removeMutation.mutate(loc.id)
    else addMutation.mutate(area)
  }

  const busy = addMutation.isPending || removeMutation.isPending

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Home Visit Locations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap the neighborhoods you're comfortable visiting for home visits. Online consultations are available Pan-India automatically.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Home visits master toggle */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-900">Offer Home Visits</p>
              <p className="text-xs text-slate-500">Turn home visits on/off. Off = your locations won't be offered to patients.</p>
            </div>
            <button
              onClick={() => { setHomeVisits(v => !v); setSettingsDirty(true) }}
              disabled={settingsMutation.isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50 ${homeVisits ? 'bg-teal-600' : 'bg-slate-300'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${homeVisits ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {settingsDirty && (
            <button
              onClick={() => settingsMutation.mutate({ homeVisitsEnabled: homeVisits, radiusKm: 10 })}
              disabled={settingsMutation.isPending}
              className="mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50"
            >
              {settingsMutation.isPending ? 'Saving…' : 'Save Home Visits Setting'}
            </button>
          )}
        </div>

        {/* Neighborhood toggle grid */}
        {master.isLoading || current.isLoading ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mb-3">Locations you serve</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {areas.map((area) => {
                const selected = !!byArea.get(area)
                return (
                  <button
                    key={area}
                    onClick={() => toggle(area)}
                    disabled={busy || settingsMutation.isPending}
                    className={`relative flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all disabled:opacity-60 ${
                      selected
                        ? 'border-teal-300 bg-teal-50 text-teal-700 ring-1 ring-teal-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{area}</span>
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
              Unselected neighborhoods show patients "not available for this location" for home visits.
            </p>
          </div>
        )}

        {/* Pan-India note */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
          <Globe2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-emerald-800">{master.data?.panIndia ?? 'Pan-India'} (Online)</p>
            <p className="text-xs text-emerald-700">
              Video consultations are available to patients anywhere in India regardless of the locations above.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
