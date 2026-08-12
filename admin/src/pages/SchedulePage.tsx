import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import { DAY_NAMES, ScheduleDay } from '../lib/types'

const EMPTY_DAY = (dayOfWeek: number): ScheduleDay => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '17:00',
  breakStart: '13:00',
  breakEnd: '14:00',
  active: false,
})

export function SchedulePage() {
  const qc = useQueryClient()
  const [days, setDays] = useState<ScheduleDay[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { isLoading } = useQuery({
    queryKey: ['doctor/schedules'],
    queryFn: async () => {
      const res = await api.get<{ schedules: ScheduleDay[] }>('/doctor/schedules')
      setDays(
        Array.from({ length: 7 }, (_, i) => res.schedules.find((s) => s.dayOfWeek === i) || EMPTY_DAY(i)),
      )
      return res.schedules
    },
  })

  function patch(index: number, part: Partial<ScheduleDay>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...part } : d)))
  }

  const save = useMutation({
    mutationFn: () => api.put<{ schedules: ScheduleDay[] }>('/doctor/schedules', { schedules: days }),
    onSuccess: (res) => {
      setMessage('Schedule saved.')
      qc.setQueryData(['doctor/schedules'], res.schedules)
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  if (isLoading) return <div className="text-slate-400">Loading schedule…</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-700">Weekly Schedule</h1>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save schedule'}
        </button>
      </div>
      {message && <p className="mb-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {days.map((d, i) => (
          <div key={d.dayOfWeek} className={`rounded-2xl border bg-white p-4 ${d.active ? 'border-teal-200' : 'border-slate-200 opacity-70'}`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={d.active}
                  onChange={(e) => patch(i, { active: e.target.checked })}
                  className="h-4 w-4 accent-teal-600"
                />
                {DAY_NAMES[d.dayOfWeek]}
              </label>
              {d.active ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={d.startTime}
                    onChange={(e) => patch(i, { startTime: e.target.value })}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="time"
                    value={d.endTime}
                    onChange={(e) => patch(i, { endTime: e.target.value })}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  />
                  <span className="ml-3 text-xs text-slate-400">Break</span>
                  <input
                    type="time"
                    value={d.breakStart || ''}
                    onChange={(e) => patch(i, { breakStart: e.target.value || null })}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="time"
                    value={d.breakEnd || ''}
                    onChange={(e) => patch(i, { breakEnd: e.target.value || null })}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400">Off</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Slots are every 30 minutes within working hours, minus the break. Changes take effect immediately after saving.
      </p>
    </div>
  )
}
