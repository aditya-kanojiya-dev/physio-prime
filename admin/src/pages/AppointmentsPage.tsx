import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import { Appointment, AppointmentStatus, formatDate, formatFee } from '../lib/types'

const statusStyles: Record<AppointmentStatus, string> = {
  upcoming: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
  no_show: 'bg-amber-50 text-amber-700',
}

const FILTERS: { label: string; value: '' | AppointmentStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No show', value: 'no_show' },
]

export function AppointmentsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'' | AppointmentStatus>('')
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['doctor/appointments', filter],
    queryFn: async () => {
      const res = await api.get<{ appointments: Appointment[] }>(
        `/doctor/appointments${filter ? `?status=${filter}` : ''}`,
      )
      return res.appointments
    },
  })

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch<{ appointment: Appointment }>(`/doctor/appointments/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor/appointments'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  })

  if (isLoading) return <div className="text-slate-400">Loading appointments…</div>

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
              filter === value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!data || data.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-slate-200 p-10 text-center text-slate-400 shadow-xl">
          No appointments{filter ? ` with status "${filter}"` : ''} yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xl"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    {formatDate(a.date)} · {a.timeSlot}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[a.status]}`}>
                    {a.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {a.patientName}
                  {a.patientPhone ? <span className="text-slate-400"> · {a.patientPhone}</span> : null}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {a.mode} · {formatFee(a.feePaise)}
                  {a.videoCallLink ? (
                    <>
                      {' · '}
                      <a href={a.videoCallLink} target="_blank" rel="noreferrer" className="text-teal-600 underline">
                        join video call
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
              {a.status === 'upcoming' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => update.mutate({ id: a.id, status: 'completed' })}
                    disabled={update.isPending}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => update.mutate({ id: a.id, status: 'no_show' })}
                    disabled={update.isPending}
                    className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50"
                  >
                    No show
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
