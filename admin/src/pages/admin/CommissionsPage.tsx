import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
  import { AlertCircle, Check, Loader2, Percent, Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminDoctor, DoctorCategoryCommission } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { confirmDialog } from '../../components/admin/ConfirmDialog'
  import { Modal, inputCls } from './CategoriesPage'

const FALLBACK = 30

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
    mutationFn: ({ doctorId, categoryId, body }: { doctorId: number; categoryId: number; body: { platformFeePercent: number | null; consultationFeePaise: number | null } }) =>
      api.put(`/admin/doctors/${doctorId}/category-commissions/${categoryId}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin/doctor-commissions', selectedDoctor?.id] }); qc.invalidateQueries({ queryKey: ['admin/doctors'] }) },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const addCommission = useMutation({
    mutationFn: () => {
      if (!selectedDoctor || !addCategoryId) throw new Error('Select a category')
      return api.put(`/admin/doctors/${selectedDoctor.id}/category-commissions/${addCategoryId}`, {
        platformFeePercent: null,
        consultationFeePaise: null,
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

        <div className="flex gap-3 text-[11px]">
          {[
            { label: `Fallback ${FALLBACK}%`, color: 'bg-slate-100 text-slate-600 border-slate-200' },
            { label: 'Department default', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Category override', color: 'bg-teal-50 text-teal-700 border-teal-200' },
          ].map((g) => (
            <span key={g.label} className={`px-3 py-1.5 rounded-full border font-extrabold ${g.color}`}>
              {g.label}
            </span>
          ))}
        </div>

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
              const deptFee = d.departmentPlatformFeePercent ?? null
              const commissions = d.categoryCommissions ?? []
              return (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDoctor(d); setAddCategoryId(0); setError(null) }}
                  className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-600/10 text-left transition-all group"
                >
                  <p className="font-extrabold text-slate-900 text-sm truncate">{d.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{d.specialty || 'No specialty'}</p>
                  <p className="text-[11px] text-slate-400">{d.department || 'No department'}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {commissions.length === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-extrabold text-[10px]">
                        <Percent className="w-3 h-3" /> {deptFee ?? FALLBACK}% default
                      </span>
                    ) : (
                      commissions.slice(0, 3).map((c) => (
                        <span key={c.categoryId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-extrabold text-[10px]">
                          {c.categoryTitle ?? '?'}: {c.platformFeePercent ?? deptFee ?? FALLBACK}%
                        </span>
                      ))
                    )}
                    {commissions.length > 3 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-extrabold text-[10px]">
                        +{commissions.length - 3} more
                      </span>
                    )}
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
        <Modal title={`${selectedDoctor.name} — Category Commissions`} onClose={() => setSelectedDoctor(null)}>
          {commissionsLoading ? (
            <div className="min-h-[12vh] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <p className="text-slate-500 font-bold">
                {selectedDoctor.department ? `Department: ${selectedDoctor.department}` : 'No department'}
                {selectedDoctor.departmentPlatformFeePercent !== null && selectedDoctor.departmentPlatformFeePercent !== undefined
                  ? ` (${selectedDoctor.departmentPlatformFeePercent}% default)`
                  : ` (${FALLBACK}% default)`}
              </p>

              {(!commissions || commissions.length === 0) && (
                <p className="text-slate-400 py-2">No category commissions set yet. Add a category below.</p>
              )}

              <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1 divide-y divide-slate-100">
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

function CommissionRow({
  commission,
  doctorId,
  save,
  remove,
}: {
  commission: DoctorCategoryCommission
  doctorId: number
  save: { mutate: (arg: { doctorId: number; categoryId: number; body: { platformFeePercent: number | null; consultationFeePaise: number | null } }) => void; isPending: boolean }
  remove: { mutate: (arg: { doctorId: number; categoryId: number }) => void; isPending: boolean }
}) {
  const [pct, setPct] = useState(commission.platformFeePercent === null ? '' : String(commission.platformFeePercent))
  const [fee, setFee] = useState(commission.consultationFeePaise === null ? '' : String(commission.consultationFeePaise / 100))
  const [dirty, setDirty] = useState(false)

  const handleSave = () => {
    save.mutate({
      doctorId,
      categoryId: commission.categoryId,
      body: {
        platformFeePercent: pct === '' ? null : Number(pct),
        consultationFeePaise: fee === '' ? null : Math.round(Number(fee) * 100),
      },
    })
    setDirty(false)
  }

  return (
    <li className="flex items-center gap-2 py-2.5">
      <span className="font-bold text-slate-900 min-w-0 shrink-0">{commission.categoryTitle || 'Unknown'}</span>
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => { setPct(e.target.value); setDirty(true) }}
            placeholder="Dept"
            className="w-14 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            title="Commission % (blank = inherit dept default)"
          />
          <span className="text-[10px] text-slate-400 font-bold">%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-bold">₹</span>
          <input
            type="number"
            min={0}
            value={fee}
            onChange={(e) => { setFee(e.target.value); setDirty(true) }}
            placeholder="Fee"
            className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            title="Consultation fee in ₹ (blank = inherit doctor default)"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || save.isPending}
          className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-30"
          title="Save"
        >
          {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={async () => { if (await confirmDialog({ title: 'Remove Commission', message: `Remove this category commission?` })) remove.mutate({ doctorId, categoryId: commission.categoryId }) }}
          disabled={remove.isPending}
          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  )
}
