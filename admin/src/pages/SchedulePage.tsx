import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { DAY_NAMES, ScheduleDay } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'

const EMPTY_DAY = (dayOfWeek: number): ScheduleDay => ({
  dayOfWeek,
  startTime: '07:00',
  endTime: '21:00',
  breakStart: '13:00',
  breakEnd: '14:00',
  active: false,
})

const inputCls =
  'rounded-xl bg-white border border-slate-200 px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-500 transition-colors'

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

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Weekly Schedule</h1>
            <p className="text-xs text-slate-500">Set your working hours and breaks for each day of the week.</p>
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save schedule'}
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((d, i) => (
              <div
                key={d.dayOfWeek}
                className={`rounded-3xl border bg-white p-4 ${d.active ? 'border-teal-200' : 'border-slate-200 opacity-70'}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <input
                      type="checkbox"
                      checked={d.active}
                      onChange={(e) => patch(i, { active: e.target.checked })}
                      className="h-4 w-4 accent-teal-600"
                    />
                    {DAY_NAMES[d.dayOfWeek]}
                  </label>
                  {d.active ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={d.startTime}
                        onChange={(e) => patch(i, { startTime: e.target.value })}
                        className={inputCls}
                      />
                      <span className="text-slate-400">–</span>
                      <input
                        type="time"
                        value={d.endTime}
                        onChange={(e) => patch(i, { endTime: e.target.value })}
                        className={inputCls}
                      />
                      <span className="ml-3 text-xs font-bold text-slate-500">Break</span>
                      <input
                        type="time"
                        value={d.breakStart || ''}
                        onChange={(e) => patch(i, { breakStart: e.target.value || null })}
                        className={inputCls}
                      />
                      <span className="text-slate-400">–</span>
                      <input
                        type="time"
                        value={d.breakEnd || ''}
                        onChange={(e) => patch(i, { breakEnd: e.target.value || null })}
                        className={inputCls}
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">Off</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Slots are 45-minute sessions within working hours, minus the break. A 3-hour window fits about 3–4 sessions. Changes take effect immediately after saving.
        </p>
      </div>
    </AdminLayout>
  )
}
