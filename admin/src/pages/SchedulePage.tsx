import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, Copy, CircleOff, CircleCheck } from 'lucide-react'
import { api } from '../lib/api'
import { AdminLayout } from '../components/admin/AdminLayout'

const WINDOWS = [
  { start: '07:00', end: '09:00', label: 'Early Morning' },
  { start: '09:00', end: '12:00', label: 'Morning' },
  { start: '12:00', end: '15:00', label: 'Afternoon' },
  { start: '15:00', end: '18:00', label: 'Evening' },
  { start: '18:00', end: '21:00', label: 'Night' },
] as const

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

type CellState = { active: boolean; maxPatients: number }
type DaySchedule = Record<string, CellState>
type ScheduleState = Record<number, DaySchedule>

function emptyState(): ScheduleState {
  const s: ScheduleState = {}
  for (const d of DAY_ORDER) {
    s[d] = {}
    for (const w of WINDOWS) {
      s[d][w.start] = { active: false, maxPatients: 3 }
    }
  }
  return s
}

export function SchedulePage() {
  const qc = useQueryClient()
  const [state, setState] = useState<ScheduleState>(emptyState)

  const { isLoading } = useQuery({
    queryKey: ['doctor/schedules'],
    queryFn: async () => {
      const res = await api.get<{ schedules: { dayOfWeek: number; windowStart: string; maxPatients: number; active: boolean }[] }>('/doctor/schedules')
      const next = emptyState()
      for (const s of res.schedules) {
        if (next[s.dayOfWeek]?.[s.windowStart]) {
          next[s.dayOfWeek][s.windowStart] = { active: s.active, maxPatients: s.maxPatients }
        }
      }
      setState(next)
      return res.schedules
    },
  })

  const save = useMutation({
    mutationFn: () => {
      const windows: { dayOfWeek: number; windowStart: string; windowEnd: string; maxPatients: number; active: boolean }[] = []
      for (const d of DAY_ORDER) {
        for (const w of WINDOWS) {
          const c = state[d][w.start]
          windows.push({ dayOfWeek: d, windowStart: w.start, windowEnd: w.end, maxPatients: c.maxPatients, active: c.active })
        }
      }
      return api.put('/doctor/schedules', { windows })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor/schedules'] }),
  })

  function toggle(day: number, start: string) {
    setState((prev) => ({
      ...prev,
      [day]: { ...prev[day], [start]: { ...prev[day][start], active: !prev[day][start].active } },
    }))
  }

  function setCapacity(day: number, start: string, val: number) {
    setState((prev) => ({
      ...prev,
      [day]: { ...prev[day], [start]: { ...prev[day][start], maxPatients: val } },
    }))
  }

  function copyMondayToAll() {
    const mon = state[1]
    setState((prev) => {
      const next = { ...prev }
      for (const d of DAY_ORDER) {
        if (d === 1) continue
        next[d] = { ...mon }
      }
      return next
    })
  }

  function allOff() {
    setState((prev) => {
      const next = { ...prev }
      for (const d of DAY_ORDER) {
        for (const w of WINDOWS) {
          next[d][w.start] = { ...next[d][w.start], active: false }
        }
      }
      return next
    })
  }

  function allOn() {
    setState((prev) => {
      const next = { ...prev }
      for (const d of DAY_ORDER) {
        for (const w of WINDOWS) {
          next[d][w.start] = { active: true, maxPatients: 3 }
        }
      }
      return next
    })
  }

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white shadow-xl">
          <h1 className="text-2xl font-black">My Schedule</h1>
          <p className="mt-1 text-sm text-white/80">Manage your weekly availability and patient capacity.</p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyMondayToAll}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Monday to all weekdays
          </button>
          <button
            onClick={allOff}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <CircleOff className="w-3.5 h-3.5" />
            All off
          </button>
          <button
            onClick={allOn}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <CircleCheck className="w-3.5 h-3.5" />
            All on (3)
          </button>
        </div>

        {/* Week grid */}
        {isLoading ? (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl flex items-center justify-center p-10">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px] grid grid-cols-[140px_repeat(7,1fr)] gap-1">
              {/* Header row */}
              <div className="p-2" />
              {DAY_NAMES.map((name, i) => (
                <div key={name} className="rounded-2xl bg-slate-100 p-3 text-center text-xs font-bold text-slate-600">
                  {name}
                </div>
              ))}

              {/* Window rows */}
              {WINDOWS.map((w) => (
                <React.Fragment key={w.start}>
                  {/* Label column */}
                  <div className="flex flex-col justify-center rounded-2xl bg-slate-50 border border-slate-200 p-3">
                    <span className="text-xs font-bold text-slate-900">{w.label}</span>
                    <span className="text-[10px] text-slate-500">{w.start}–{w.end}</span>
                  </div>

                  {/* Day cells */}
                  {DAY_ORDER.map((day) => {
                    const cell = state[day][w.start]
                    return (
                      <button
                        key={`${day}-${w.start}`}
                        onClick={() => toggle(day, w.start)}
                        className={`group relative rounded-2xl border p-2 text-left transition-all ${
                          cell.active
                            ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                            : 'bg-white border-slate-200 opacity-60 hover:opacity-80'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mb-1.5 ${cell.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`text-[10px] font-semibold block ${cell.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {cell.active ? 'Active' : 'Off'}
                        </span>
                        {cell.active && (
                          <select
                            value={cell.maxPatients}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setCapacity(day, w.start, Number(e.target.value))}
                            className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-1 py-0.5 text-[10px] font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                          >
                            <option value={1}>1 patient</option>
                            <option value={2}>2 patients</option>
                            <option value={3}>3 patients</option>
                          </select>
                        )}
                      </button>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 hover:from-teal-500 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save schedule
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
