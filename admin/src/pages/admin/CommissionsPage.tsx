import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Pencil, Percent, X } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminDoctor } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatusPill } from './AppointmentsPage'

const FALLBACK = 30

function OverrideCell({ doctor }: { doctor: AdminDoctor }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: (v: number | null) => api.patch(`/admin/doctors/${doctor.id}`, { platformFeePercent: v }),
    onSuccess: () => {
      setEditing(false)
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin/doctors'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  if (!editing) {
    const override = doctor.platformFeePercent !== null && doctor.platformFeePercent !== undefined
    return (
      <div className="flex items-center gap-2">
        {override ? (
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-extrabold">
            {doctor.platformFeePercent}%
          </span>
        ) : (
          <span className="text-slate-400">Inherit</span>
        )}
        <button
          onClick={() => {
            setVal(doctor.platformFeePercent === null ? '' : String(doctor.platformFeePercent))
            setEditing(true)
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all"
          title="Set commission"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <input
        type="number"
        min={0}
        max={100}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Inherit"
        className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
      />
      <button
        onClick={() => save.mutate(val === '' ? null : Number(val))}
        disabled={save.isPending}
        className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-50"
        title="Save (empty = inherit department default)"
      >
        {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={() => {
          setEditing(false)
          setError(null)
        }}
        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
        title="Cancel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {error && <span className="text-[10px] font-bold text-rose-600 w-full">{error}</span>}
    </div>
  )
}

export function CommissionsPage() {
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin/doctors'],
    queryFn: async () => (await api.get<{ doctors: AdminDoctor[] }>('/admin/doctors')).doctors,
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Commissions</h1>
          <p className="text-xs text-slate-500">
            Effective platform fee per doctor: doctor override → department default → {FALLBACK}% fallback. Click the pencil to
            set a doctor's rate (empty = use the department default).
          </p>
        </div>

        <div className="flex gap-3 text-[11px]">
          {[
            { label: `Fallback ${FALLBACK}%`, color: 'bg-slate-100 text-slate-600 border-slate-200' },
            { label: 'Department default', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Doctor override', color: 'bg-teal-50 text-teal-700 border-teal-200' },
          ].map((g) => (
            <span key={g.label} className={`px-3 py-1.5 rounded-full border font-extrabold ${g.color}`}>
              {g.label}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Department Default</th>
                    <th className="p-4">Doctor Override</th>
                    <th className="p-4">Effective</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {(doctors || []).map((d) => {
                    const deptFee = d.departmentPlatformFeePercent ?? null
                    const effective = d.platformFeePercent ?? deptFee ?? FALLBACK
                    return (
                      <tr key={d.id} className="hover:bg-slate-100/50 transition-colors">
                        <td className="p-4">
                          <p className="font-extrabold text-slate-900 text-sm">{d.name}</p>
                          <p className="text-[10px] text-slate-400">{d.specialty || 'No specialty'}</p>
                        </td>
                        <td className="p-4">{d.department || '—'}</td>
                        <td className="p-4 text-slate-500">{deptFee !== null ? `${deptFee}%` : '—'}</td>
                        <td className="p-4">
                          <OverrideCell doctor={d} />
                        </td>
                        <td className="p-4 font-black text-blue-700 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" /> {effective}%
                        </td>
                        <td className="p-4">
                          <StatusPill tone={d.status === 'inactive' ? 'rose' : 'emerald'} label={d.status === 'inactive' ? 'OFF' : 'ON'} />
                        </td>
                      </tr>
                    )
                  })}
                  {(doctors || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No doctors yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}