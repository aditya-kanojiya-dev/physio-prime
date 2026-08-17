import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Loader2, XCircle, CalendarDays, X, Clock, FileText, AlertCircle } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Appointment, AppointmentStatus, formatFee, DoctorAppointmentDetail } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'

const FILTERS: { label: string; value: '' | AppointmentStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'No show', value: 'no_show' },
]

const NO_SHOW_REASONS = [
  "Patient didn't show up",
  'Patient cancelled at the last minute',
  'Could not reach the patient',
  'Other',
] as const

const MODE_COLORS: Record<string, string> = {
  online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  home: 'bg-blue-100 text-blue-700 border-blue-200',
  clinic: 'bg-purple-100 text-purple-700 border-purple-200',
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AppointmentsPage() {
  const qc = useQueryClient()
  const [date, setDate] = useState(todayStr())
  const [filter, setFilter] = useState<'' | AppointmentStatus>('')
  const [error, setError] = useState<string | null>(null)

  const [reschedule, setReschedule] = useState<{ open: boolean; appointmentId: string; currentDate: string }>({
    open: false, appointmentId: '', currentDate: '',
  })
  const [noShowModal, setNoShowModal] = useState<{ open: boolean; appointmentId: string; reason: string; note: string }>({
    open: false, appointmentId: '', reason: '', note: '',
  })
  const [detailModal, setDetailModal] = useState<{ open: boolean; appointmentId: string; detail: DoctorAppointmentDetail | null; isLoading: boolean }>({
    open: false, appointmentId: '', detail: null, isLoading: false,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['doctor/appointments', date, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ date })
      if (filter) params.set('status', filter)
      const res = await api.get<{ appointments: Appointment[] }>(`/doctor/appointments?${params}`)
      return res.appointments
    },
  })

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch<{ appointment: Appointment }>(`/doctor/appointments/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor/appointments'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  })

  const fetchDetail = useMutation({
    mutationFn: (id: string) => api.get<{ appointment: DoctorAppointmentDetail['appointment']; prescription: DoctorAppointmentDetail['prescription'] }>(`/doctor/appointments/${id}`),
    onSuccess: (res, _id) => {
      setDetailModal({ open: true, appointmentId: _id, detail: { appointment: res.appointment, prescription: res.prescription }, isLoading: false })
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to load details'),
  })

  const rescheduleMut = useMutation({
    mutationFn: ({ id, date: d, windowStart, windowEnd }: { id: string; date: string; windowStart: string; windowEnd: string }) =>
      api.patch(`/doctor/appointments/${id}/reschedule`, { date: d, windowStart, windowEnd }),
    onSuccess: () => {
      setReschedule({ open: false, appointmentId: '', currentDate: '' })
      qc.invalidateQueries({ queryKey: ['doctor/appointments'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Reschedule failed'),
  })

  const markNoShow = useMutation({
    mutationFn: ({ id, reason, note }: { id: string; reason: string; note: string }) =>
      api.patch(`/doctor/appointments/${id}`, { status: 'no_show', cancellationReason: `${reason}${note ? `: ${note}` : ''}` }),
    onSuccess: () => {
      setNoShowModal({ open: false, appointmentId: '', reason: '', note: '' })
      qc.invalidateQueries({ queryKey: ['doctor/appointments'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  })

  return (
    <AdminLayout portal="doctor">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Appointments</h1>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
          {FILTERS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === value
                  ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {!data || data.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-sm">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500" />
            ) : (
              <>No appointments{filter ? ` with status "${filter}"` : ''} for this date.</>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((a) => {
              const isCompleted = a.status === 'completed'
              const isNoShow = a.status === 'no_show'
              const cardClass = isNoShow ? 'opacity-60' : ''
              return (
                <div key={a.id} className={`rounded-3xl bg-white border border-slate-200 shadow-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${cardClass}`}>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => fetchDetail.mutate(a.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm underline hover:no-underline">{a.patientName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${MODE_COLORS[a.mode] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {a.mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.timeSlot}</span>
                      <span className="font-bold text-slate-700">{formatFee(a.feePaise)}</span>
                    </div>
                    {isCompleted && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          a.cancellationReason ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {a.cancellationReason ? 'Prescription written' : 'Prescription pending'}
                        </span>
                        {!a.cancellationReason && (
                          <button
                            onClick={(e) => { e.stopPropagation(); update.mutate({ id: a.id, status: 'completed' }) }}
                            disabled={update.isPending}
                            className="px-2 py-1 rounded-lg bg-teal-600 text-white text-[10px] font-bold hover:bg-teal-500 transition-colors disabled:opacity-50"
                          >
                            Write Prescription
                          </button>
                        )}
                      </div>
                    )}
                    {isNoShow && a.cancellationReason && (
                      <div className="mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {a.cancellationReason.split(':')[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:flex-col sm:items-end">
                    {a.status === 'upcoming' && (
                      <>
                        <button
                          onClick={() => {
                            setNoShowModal({ open: true, appointmentId: a.id, reason: '', note: '' })
                          }}
                          disabled={update.isPending || noShowModal.open}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> Didn't come
                        </button>
                        <button
                          onClick={() => setReschedule({ open: true, appointmentId: a.id, currentDate: a.date })}
                          disabled={update.isPending}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <CalendarDays className="w-3 h-3" /> Change time
                        </button>
                        <button
                          onClick={() => update.mutate({ id: a.id, status: 'completed' })}
                          disabled={update.isPending}
                          className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl px-3 py-1.5 font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Done
                        </button>
                      </>
                    )}
                    {a.status !== 'upcoming' && !isCompleted && !isNoShow && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                        {a.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {noShowModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">No Show</h3>
              <button onClick={() => setNoShowModal({ open: false, appointmentId: '', reason: '', note: '' })} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {NO_SHOW_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setNoShowModal({ ...noShowModal, reason: r, note: '' })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    noShowModal.reason === r
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {noShowModal.reason === 'Other' && (
              <input
                type="text"
                placeholder="Optional note..."
                value={noShowModal.note}
                onChange={(e) => setNoShowModal({ ...noShowModal, note: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
              />
            )}

            <button
              onClick={() => {
                if (!noShowModal.reason) return
                markNoShow.mutate({ id: noShowModal.appointmentId, reason: noShowModal.reason, note: noShowModal.note })
              }}
              disabled={!noShowModal.reason || markNoShow.isPending}
              className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {markNoShow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {detailModal.open && (
        <DetailModal
          detail={detailModal.detail}
          isLoading={detailModal.isLoading}
          onClose={() => setDetailModal({ open: false, appointmentId: '', detail: null, isLoading: false })}
        />
      )}

      {reschedule.open && (
        <RescheduleModal
          appointmentId={reschedule.appointmentId}
          currentDate={reschedule.currentDate}
          onClose={() => setReschedule({ open: false, appointmentId: '', currentDate: '' })}
          onConfirm={(d, ws, we) => rescheduleMut.mutate({ id: reschedule.appointmentId, date: d, windowStart: ws, windowEnd: we })}
          isPending={rescheduleMut.isPending}
        />
      )}
    </AdminLayout>
  )
}

function RescheduleModal({
  appointmentId,
  currentDate,
  onClose,
  onConfirm,
  isPending,
}: {
  appointmentId: string
  currentDate: string
  onClose: () => void
  onConfirm: (date: string, windowStart: string, windowEnd: string) => void
  isPending: boolean
}) {
  const [date, setDate] = useState(currentDate)
  const [selectedWindow, setSelectedWindow] = useState<{ start: string; end: string } | null>(null)

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['doctor/slots', appointmentId, date],
    queryFn: async () => {
      const res = await api.get<{ windows: { start: string; end: string; label: string; maxPatients: number; bookedCount: number; available: boolean }[] }>(
        `/doctors/slots?date=${date}`,
      )
      return res.windows.filter((w) => w.available)
    },
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">Reschedule</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">New Date</label>
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => {
              setDate(e.target.value)
              setSelectedWindow(null)
            }}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Available Windows</label>
          {slotsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            </div>
          ) : !slotsData || slotsData.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No available windows for this date.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {slotsData.map((w) => (
                <button
                  key={w.start}
                  onClick={() => setSelectedWindow({ start: w.start, end: w.end })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                    selectedWindow?.start === w.start
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{w.label || `${w.start} – ${w.end}`}</span>
                  <span className="text-[10px] text-slate-400">{w.maxPatients - w.bookedCount} left</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (selectedWindow) onConfirm(date, selectedWindow.start, selectedWindow.end)
          }}
          disabled={!selectedWindow || isPending}
          className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reschedule'}
        </button>
      </div>
    </div>
  )
}

function DetailModal({
  detail,
  isLoading,
  onClose,
}: {
  detail: DoctorAppointmentDetail | null
  isLoading: boolean
  onClose: () => void
}) {
  const a = detail?.appointment
  const p = detail?.prescription

  if (!a) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">Appointment Details</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <>
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">{a.patientName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${MODE_COLORS[a.mode] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {a.mode}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.timeSlot}</span>
                <span className="font-bold text-slate-700">{formatFee(a.feePaise)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{a.date}</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{a.status.replace('_', ' ')}</span>
              </div>
              {a.symptom && (
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">Symptom:</span> {a.symptom}
                </div>
              )}
              {a.cancellationReason && (
                <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                  <span className="font-semibold">Reason:</span> {a.cancellationReason}
                </div>
              )}
            </div>

            {p && (
              <div className="space-y-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="font-extrabold text-slate-900">Prescription</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Written</span>
                </div>
                {p.diagnosis && (
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Diagnosis:</span> {p.diagnosis}
                  </div>
                )}
                {p.medicines && p.medicines.length > 0 && (
                  <div>
                    <span className="font-semibold text-xs text-slate-700">Medicines:</span>
                    <ul className="mt-1 space-y-1 text-xs text-slate-600">
                      {p.medicines.map((m, i) => (
                        <li key={i}>{m.name}{m.dosage ? ` - ${m.dosage}` : ''}{m.frequency ? `, ${m.frequency}` : ''}{m.duration ? `, ${m.duration}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.advice && (
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Advice:</span> {p.advice}
                  </div>
                )}
                {p.followUpDate && (
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Follow-up:</span> {p.followUpDate}
                  </div>
                )}
              </div>
            )}

            {!p && a.status === 'completed' && (
              <button
                onClick={() => { onClose(); window.location.reload() }}
                className="w-full py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-sm rounded-2xl hover:from-teal-500 hover:to-blue-500 transition-all"
              >
                Write Prescription
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
