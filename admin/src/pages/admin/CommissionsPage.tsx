import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminDoctor, DoctorCategoryCommission } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { confirmDialog } from '../../components/admin/ConfirmDialog'
import { intInRange, numInRange } from '../../lib/validate'
import { formatPaise, resolveRate, splitFee } from '../../lib/commission'
  import { Modal, inputCls } from './CategoriesPage'

const FALLBACK = 30
const FALLBACK_SOURCE = `${FALLBACK}% fallback`

// The category column header and the rows share one grid template, so the four
// inputs cannot drift out of line. The trailing column is a fixed 4.5rem (two
// 32px buttons + a 6px gap) because `auto` sizes per <li> and would differ
// between the empty header cell and a real row.
const RATE_GRID = 'grid grid-cols-2 sm:grid-cols-[repeat(4,minmax(0,1fr))_4.5rem] gap-2 items-end'

// mirrors categoryCommissionSchema: int 0..100 percent, int >= 0 paise
interface CommissionBody {
  platformFeeHomePercent: number | null
  platformFeeOnlinePercent: number | null
  consultationFeeHomePaise: number | null
  consultationFeeOnlinePaise: number | null
}

export function CommissionsPage() {
  const qc = useQueryClient()
  const [selectedDoctor, setSelectedDoctor] = useState<AdminDoctor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addCategoryId, setAddCategoryId] = useState<number>(0)

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin/doctors'],
    queryFn: async () => (await api.get<{ doctors: AdminDoctor[] }>('/admin/doctors')).doctors,
  })

  const { data: allCategories } = useQuery({
    queryKey: ['admin/categories'],
    queryFn: async () => (await api.get<{ categories: { id: number; title: string }[] }>('/admin/categories')).categories,
  })

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['admin/doctor-commissions', selectedDoctor?.id],
    queryFn: async () =>
      selectedDoctor
        ? await api.get<{ commissions: DoctorCategoryCommission[] }>(`/admin/doctors/${selectedDoctor.id}/category-commissions`).then((r) => r.commissions)
        : null,
    enabled: selectedDoctor !== null,
  })

  const saveCommission = useMutation({
    mutationFn: ({ doctorId, categoryId, body }: { doctorId: number; categoryId: number; body: CommissionBody }) =>
      api.put(`/admin/doctors/${doctorId}/category-commissions/${categoryId}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin/doctor-commissions', selectedDoctor?.id] }); qc.invalidateQueries({ queryKey: ['admin/doctors'] }) },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const addCommission = useMutation({
    mutationFn: () => {
      if (!selectedDoctor || !addCategoryId) throw new Error('Select a category')
      return api.put(`/admin/doctors/${selectedDoctor.id}/category-commissions/${addCategoryId}`, {
        platformFeeHomePercent: null,
        platformFeeOnlinePercent: null,
        consultationFeeHomePaise: null,
        consultationFeeOnlinePaise: null,
      })
    },
    onSuccess: () => { setAddCategoryId(0); qc.invalidateQueries({ queryKey: ['admin/doctor-commissions', selectedDoctor?.id] }); qc.invalidateQueries({ queryKey: ['admin/doctors'] }) },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Add failed'),
  })

  const removeCommission = useMutation({
    mutationFn: ({ doctorId, categoryId }: { doctorId: number; categoryId: number }) =>
      api.delete(`/admin/doctors/${doctorId}/category-commissions/${categoryId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin/doctor-commissions', selectedDoctor?.id] }); qc.invalidateQueries({ queryKey: ['admin/doctors'] }) },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Remove failed'),
  })

  const saveRates = useMutation({
    mutationFn: (body: { platformFeeHomePercent: number | null; platformFeeOnlinePercent: number | null }) =>
      api.patch(`/admin/doctors/${selectedDoctor!.id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin/doctors'] }) },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const assignedCategoryIds = useMemo(() => new Set((commissions || []).map((c) => c.categoryId)), [commissions])
  const unassignedCategories = useMemo(
    () => (allCategories || []).filter((c) => !assignedCategoryIds.has(c.id)),
    [allCategories, assignedCategoryIds],
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Commissions</h1>
          <p className="text-xs text-slate-500">
            Click a doctor to set per-category commission rates and consultation fees.
          </p>
        </div>

        <p className="text-[11px] text-slate-400">
          Each rate falls back: category override, then the doctor's own rate, then the department default, then {FALLBACK}%.
        </p>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(doctors || []).map((d) => {
              const commissions = d.categoryCommissions ?? []
              return (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDoctor(d); setAddCategoryId(0); setError(null) }}
                  className="flex flex-col p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-600/10 text-left transition-all group"
                >
                  <p className="font-extrabold text-slate-900 text-sm truncate">{d.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {[d.specialty, d.department].filter(Boolean).join(' · ') || 'No specialty'}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {(['home', 'online'] as const).map((mode) => {
                      const overrides = categoryRateCount(commissions)
                      const source = rateSource(d, mode)
                      const isDefault = source === FALLBACK_SOURCE
                      return (
                        <div key={mode} className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                              {MODE_SHORT[mode]}
                            </p>
                            {overrides > 0 && (
                              <span className="shrink-0 rounded-full bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[11px] font-extrabold text-teal-800">
                                {overrides} {overrides > 1 ? 'rates' : 'rate'}
                              </span>
                            )}
                          </div>
                          {/* the rate is the point of this tile, so it never dims. An
                              unconfigured rate is flagged by the "Default" line instead. */}
                          <p className="mt-1 text-2xl font-black leading-none text-slate-900">
                            {rateFor(d, mode)}
                            <span className="text-sm font-extrabold align-top">%</span>
                          </p>
                          <p
                            className={`mt-2 text-[11px] font-bold ${isDefault ? 'text-amber-800' : 'text-slate-500'}`}
                            title={isDefault ? 'No rate set for this doctor, department or category, so this is the platform default.' : source}
                          >
                            {isDefault ? 'Default · not set' : source}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </button>
              )
            })}
            {(doctors || []).length === 0 && <p className="text-sm text-slate-400">No doctors yet.</p>}
          </div>
        )}
      </div>

      {/* Commission Modal */}
      {selectedDoctor && (
        <Modal title={`${selectedDoctor.name} — Commissions`} onClose={() => setSelectedDoctor(null)} width="max-w-3xl">
          <RatePanel doctor={selectedDoctor} save={saveRates} />
          {commissionsLoading ? (
            <div className="min-h-[12vh] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-extrabold text-slate-900">Category rates</p>
                <p className="text-slate-400 leading-snug">
                  Set a <span className="font-extrabold text-slate-600">home</span> and a
                  <span className="font-extrabold text-slate-600"> video</span> commission for this category. Each applies when a
                  patient books this doctor from that category page, and overrides the doctor's own rate for that visit type.
                  Leave a field blank to inherit the doctor's rate. The consultation fee is a reference figure; payouts always use
                  what the patient was actually charged.
                </p>
              </div>
              {(!commissions || commissions.length === 0) && (
                <p className="text-slate-400 py-2">No category commissions set yet. Add a category below.</p>
              )}

              <ul className="max-h-[45vh] overflow-y-auto pr-1 divide-y divide-slate-100">
                <li className="sticky top-0 z-10 bg-white pt-2 pb-1.5">
                  <div className={`hidden sm:${RATE_GRID} text-[11px] font-extrabold uppercase tracking-wide text-slate-500`}>
                    <span>Home %</span>
                    <span>Video %</span>
                    <span>Home ₹</span>
                    <span>Video ₹</span>
                    <span />
                  </div>
                </li>
                {(commissions || []).map((c) => (
                  <CommissionRow
                    key={c.categoryId}
                    commission={c}
                    doctorId={selectedDoctor.id}
                    save={saveCommission}
                    remove={removeCommission}
                  />
                ))}
              </ul>

              {unassignedCategories.length > 0 && (
                <div className="flex items-end gap-2 pt-2 border-t border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-600 mb-1">Add category</p>
                    <select value={addCategoryId} onChange={(e) => setAddCategoryId(Number(e.target.value))} className={inputCls}>
                      <option value={0}>Select category…</option>
                      {unassignedCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => addCommission.mutate()}
                    disabled={!addCategoryId || addCommission.isPending}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {addCommission.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </AdminLayout>
  )
}

const MODE_LABEL = { home: 'Home visit', online: 'Online consultation' } as const

function rateFor(doctor: AdminDoctor, mode: 'home' | 'online'): number {
  return resolveRate(
    { home: doctor.platformFeeHomePercent, online: doctor.platformFeeOnlinePercent, shared: doctor.platformFeePercent, department: doctor.departmentPlatformFeePercent },
    mode,
  )
}

const MODE_SHORT = { home: 'Home', online: 'Video' } as const

// Where a rate comes from, so a 30% reads differently when it is a real
// configured rate than when it is only the last-resort default. Pass `typed`
// to preview unsaved input from the rate panel instead of the saved doctor row.
function rateSource(
  doctor: AdminDoctor,
  mode: 'home' | 'online',
  typed?: { home: number | null; online: number | null },
): string {
  const own = typed ? typed[mode] : mode === 'home' ? doctor.platformFeeHomePercent : doctor.platformFeeOnlinePercent
  if (own !== null && !Number.isNaN(own)) return 'own rate'
  if (doctor.platformFeePercent !== null) return 'shared rate'
  if (doctor.departmentPlatformFeePercent != null) return `${doctor.department} default`
  return FALLBACK_SOURCE
}

// A category row is "in effect" when either per-mode rate is set. Both blank
// means the category simply inherits the doctor's rates.
function categoryRateCount(commissions: DoctorCategoryCommission[]): number {
  return commissions.filter((c) => c.platformFeeHomePercent !== null || c.platformFeeOnlinePercent !== null).length
}

function RatePanel({
  doctor,
  save,
}: {
  doctor: AdminDoctor;
  save: { mutate: (b: { platformFeeHomePercent: number | null; platformFeeOnlinePercent: number | null }) => void; isPending: boolean };
}) {
  const [home, setHome] = useState(doctor.platformFeeHomePercent === null ? '' : String(doctor.platformFeeHomePercent))
  const [online, setOnline] = useState(doctor.platformFeeOnlinePercent === null ? '' : String(doctor.platformFeeOnlinePercent))
  const [err, setErr] = useState('')

  const typed = { home: home === '' ? null : Number(home), online: online === '' ? null : Number(online) }
  const fallback = doctor.platformFeePercent ?? doctor.departmentPlatformFeePercent ?? FALLBACK

  const handleSave = () => {
    const e1 = home === '' ? null : intInRange(home, 0, 100, 'Home visit rate')
    const e2 = online === '' ? null : intInRange(online, 0, 100, 'Online rate')
    if (e1 || e2) { setErr(e1 ?? e2!); return }
    setErr('')
    save.mutate({ platformFeeHomePercent: typed.home, platformFeeOnlinePercent: typed.online })
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-[13px]">
      <div>
        <p className="font-extrabold text-slate-900">Platform commission</p>
        <p className="text-slate-500 leading-snug">
          Physio Prime's cut of each booking. Blank inherits the shared rate
          {doctor.platformFeePercent !== null ? ` of ${doctor.platformFeePercent}%` : ` (${fallback}%)`}. A category rate set
          below takes priority for bookings from that category page.
        </p>
      </div>
      {(['home', 'online'] as const).map((mode) => {
        const rate = resolveRate(
          { home: typed.home, online: typed.online, shared: doctor.platformFeePercent, department: doctor.departmentPlatformFeePercent },
          mode,
        )
        const grossPaise = (Number(doctor.fees?.[mode]) || 0) * 100
        const { platformFeePaise, doctorPaise } = splitFee(grossPaise, rate)
        const setValue = mode === 'home' ? setHome : setOnline
        const source = rateSource(doctor, mode, typed)
        return (
          <div key={mode} className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            <div className="flex items-center gap-1.5 w-52 shrink-0">
              <span className="font-bold text-slate-700">{MODE_LABEL[mode]}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={mode === 'home' ? home : online}
                onChange={(e) => setValue(e.target.value)}
                placeholder={String(fallback)}
                className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                aria-label={`${MODE_LABEL[mode]} commission percent`}
              />
              <span className="text-[11px] text-slate-500 font-bold">%</span>
            </div>
            <p className={`text-[11px] font-bold ${source === FALLBACK_SOURCE ? 'text-amber-800' : 'text-slate-500'}`}>
              {source === FALLBACK_SOURCE ? 'Default · not set' : source}
            </p>
            <p className="ml-auto flex items-baseline gap-1.5 text-[13px] font-extrabold whitespace-nowrap">
              <span className="text-[11px] font-bold text-slate-500">on</span>
              <span className="text-slate-900">{formatPaise(grossPaise)}</span>
              <span className="text-slate-300">|</span>
              <span className="text-teal-700">doctor {formatPaise(doctorPaise)}</span>
              <span className="text-slate-900">platform {formatPaise(platformFeePaise)}</span>
            </p>
          </div>
        )
      })}
      {err && <p role="alert" className="text-xs font-bold text-rose-600">{err}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={save.isPending}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save rates
        </button>
      </div>
    </div>
  )
}

function CommissionRow({
  commission,
  doctorId,
  save,
  remove,
}: {
  commission: DoctorCategoryCommission
  doctorId: number
  save: { mutate: (arg: { doctorId: number; categoryId: number; body: CommissionBody }) => void; isPending: boolean }
  remove: { mutate: (arg: { doctorId: number; categoryId: number }) => void; isPending: boolean }
}) {
  const asText = (v: number | null) => (v === null ? '' : String(v))
  const [home, setHome] = useState(asText(commission.platformFeeHomePercent))
  const [online, setOnline] = useState(asText(commission.platformFeeOnlinePercent))
  const asRupees = (paise: number | null) => (paise === null ? '' : String(paise / 100))
  const [homeFee, setHomeFee] = useState(asRupees(commission.consultationFeeHomePaise))
  const [onlineFee, setOnlineFee] = useState(asRupees(commission.consultationFeeOnlinePaise))
  const [dirty, setDirty] = useState(false)
  const [err, setErr] = useState('')

  // mirrors categoryCommissionSchema: int 0..100 percent, int >= 0 paise
  const toPaise = (raw: string) => (raw === '' ? null : Math.round(Number(raw) * 100))
  const feeErr = (raw: string, label: string) => {
    if (raw === '') return null
    const paise = toPaise(raw)
    return Number.isFinite(paise)
      ? numInRange(String(paise), 0, Number.MAX_SAFE_INTEGER, label)
      : `Enter a valid ${label.toLowerCase()}`
  }

  const handleSave = () => {
    setErr('')
    const firstErr =
      (home === '' ? null : intInRange(home, 0, 100, 'Home commission')) ??
      (online === '' ? null : intInRange(online, 0, 100, 'Video commission')) ??
      feeErr(homeFee, 'Home fee') ??
      feeErr(onlineFee, 'Video fee')
    if (firstErr) { setErr(firstErr); return }
    save.mutate({
      doctorId,
      categoryId: commission.categoryId,
      body: {
        platformFeeHomePercent: home === '' ? null : Number(home),
        platformFeeOnlinePercent: online === '' ? null : Number(online),
        consultationFeeHomePaise: toPaise(homeFee),
        consultationFeeOnlinePaise: toPaise(onlineFee),
      },
    })
    setDirty(false)
  }

  const inEffect = home !== '' || online !== ''

  // One field, one shape. Labels sit above the input so the four columns read
  // as columns; `unit` puts the % / ₹ on the control instead of in the label.
  const field = (
    label: string,
    unit: '%' | '₹',
    value: string,
    set: (v: string) => void,
    { title, aria }: { title: string; aria: string },
  ) => (
    <label className="block min-w-0">
      <span className="flex items-center gap-0.5 mb-1 text-[11px] font-bold text-slate-500">
        {label} <span className="text-slate-400">{unit}</span>
      </span>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => { set(e.target.value); setDirty(true) }}
          placeholder="—"
          aria-label={aria}
          className="w-full p-2 pl-5 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          title={title}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">{unit}</span>
      </div>
    </label>
  )

  const title = commission.categoryTitle || 'Unknown'

  return (
    <li className="py-3">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-900 min-w-0 truncate">{title}</span>
        {inEffect ? (
          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-extrabold text-[11px] uppercase tracking-wide" title="Bookings from this category page use these rates.">
            In use
          </span>
        ) : (
          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-extrabold text-[11px] uppercase tracking-wide" title="All rates blank, so bookings from this category page inherit the doctor's own rates.">
            Inherits
          </span>
        )}
      </div>

      <div className={`mt-2 ${RATE_GRID}`}>
        {field('Home', '%', home, setHome, {
          title: 'Commission % for home visits booked from this category page (blank = inherit the doctor rate)',
          aria: `${title} home visit commission percent`,
        })}
        {field('Video', '%', online, setOnline, {
          title: 'Commission % for video consultations booked from this category page (blank = inherit the doctor rate)',
          aria: `${title} video consult commission percent`,
        })}
        {field('Home', '₹', homeFee, setHomeFee, {
          title: 'Consultation fee in ₹ (reference only; blank = inherit the doctor\'s own fee)',
          aria: `${title} home visit fee in rupees`,
        })}
        {field('Video', '₹', onlineFee, setOnlineFee, {
          title: 'Consultation fee in ₹ (reference only; blank = inherit the doctor\'s own fee)',
          aria: `${title} video consult fee in rupees`,
        })}
        <div className="col-span-2 sm:col-span-1 flex gap-1.5 sm:justify-end w-[4.5rem]">
          <button
            onClick={handleSave}
            disabled={!dirty || save.isPending}
            className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-30"
            title="Save"
            aria-label={`Save ${title} commission`}
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={async () => { if (await confirmDialog({ title: 'Remove Commission', message: 'Remove this category commission?' })) remove.mutate({ doctorId, categoryId: commission.categoryId }) }}
            disabled={remove.isPending}
            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
            title="Remove"
            aria-label={`Remove ${title} commission`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {err && <p role="alert" className="mt-1.5 text-[11px] font-bold text-rose-600">{err}</p>}
    </li>
  )
}
