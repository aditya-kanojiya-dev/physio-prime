import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, Loader2, Pill, Plus, Stethoscope, X } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import type { Appointment } from '../../lib/types'

interface SessionEndModalProps {
  appointment: Appointment
  onClose: () => void
}

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface WindowOption {
  start: string
  end: string
  label: string
  available: boolean
}

const emptyMedicine = (): Medicine => ({ name: '', dosage: '', frequency: '', duration: '' })

// End-of-call popup for the doctor: finalize the session ("Session Done"),
// write the prescription, or schedule follow-up sessions. Prescription and
// follow-ups unlock once the session is finalized (mirrors the server rules).
export function SessionEndModal({ appointment, onClose }: SessionEndModalProps) {
  const qc = useQueryClient()
  const [step, setStep] = useState<'main' | 'rx' | 'followup'>('main')
  const [finalizing, setFinalizing] = useState(false)
  const [finalized, setFinalized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [diagnosis, setDiagnosis] = useState('')
  const [advice, setAdvice] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([emptyMedicine()])
  const [savingRx, setSavingRx] = useState(false)
  const [rxSaved, setRxSaved] = useState(false)

  const [sessions, setSessions] = useState('1')
  const [date, setDate] = useState('')
  const [windowSel, setWindowSel] = useState('')
  const [windows, setWindows] = useState<WindowOption[]>([])
  const [windowsLoading, setWindowsLoading] = useState(false)
  const [savingFu, setSavingFu] = useState(false)
  const [fuResult, setFuResult] = useState<string[] | null>(null)

  const apiErr = (err: unknown) => (err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')

  const finalize = async () => {
    setFinalizing(true)
    setError(null)
    try {
      await api.post<{ ok: boolean; status: string }>(`/doctor/appointments/${appointment.id}/finalize`, {})
      setFinalized(true)
      qc.invalidateQueries({ queryKey: ['doctor/appointments'] })
    } catch (err) {
      setError(apiErr(err))
    } finally {
      setFinalizing(false)
    }
  }

  const savePrescription = async () => {
    setSavingRx(true)
    setError(null)
    try {
      await api.post(`/doctor/appointments/${appointment.id}/prescription`, {
        diagnosis: diagnosis.trim() || undefined,
        advice: advice.trim() || undefined,
        followUpDate: followUpDate || undefined,
        medicines: medicines.filter((m) => m.name.trim()).map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          duration: m.duration.trim(),
        })),
      })
      setRxSaved(true)
    } catch (err) {
      setError(apiErr(err))
    } finally {
      setSavingRx(false)
    }
  }

  const loadWindows = async (d: string) => {
    setDate(d)
    setWindowSel('')
    setWindows([])
    if (!d) return
    setWindowsLoading(true)
    try {
      const res = await api.get<{ windows: WindowOption[] }>(`/doctor/slots?date=${d}`)
      setWindows(res.windows.filter((w) => w.available))
    } catch (err) {
      setError(apiErr(err))
    } finally {
      setWindowsLoading(false)
    }
  }

  const scheduleFollowups = async () => {
    if (!date || !windowSel) return
    setSavingFu(true)
    setError(null)
    const [windowStart, windowEnd] = windowSel.split('|')
    try {
      const res = await api.post<{ ok: boolean; bookingIds: string[] }>(`/doctor/appointments/${appointment.id}/follow-ups`, {
        date,
        windowStart,
        windowEnd,
        sessions: Number(sessions),
      })
      setFuResult(res.bookingIds)
      qc.invalidateQueries({ queryKey: ['doctor/appointments'] })
    } catch (err) {
      setError(apiErr(err))
    } finally {
      setSavingFu(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Consultation ended</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {appointment.patientName} · {appointment.bookingId}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setStep('main'); onClose() }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          {step === 'main' && (
            <div className="space-y-3">
              <button
                onClick={finalize}
                disabled={finalizing || finalized}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-all ${
                  finalized
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-60'
                }`}
              >
                {finalizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {finalizing ? 'Finalizing…' : 'Session Done'}
              </button>
              {finalized && (
                <p className="text-[11px] font-semibold text-emerald-600 -mt-1">Marked completed — reflected on the patient's side.</p>
              )}

              <button
                onClick={() => setStep('rx')}
                disabled={!finalized}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-slate-900">Write Prescription</p>
                  <p className="text-[11px] text-slate-400">Diagnosis, medicines and advice</p>
                </div>
                {!finalized && <span className="text-[10px] font-bold text-amber-600">End the session first</span>}
              </button>

              <button
                onClick={() => setStep('followup')}
                disabled={!finalized}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-slate-900">Follow-up Sessions</p>
                  <p className="text-[11px] text-slate-400">Schedule future check-ups for this patient</p>
                </div>
                {!finalized && <span className="text-[10px] font-bold text-amber-600">End the session first</span>}
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {step === 'rx' && (
            <div className="space-y-4">
              <button onClick={() => setStep('main')} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              {rxSaved ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-900">Prescription saved</p>
                  <p className="text-xs text-slate-400">The patient can view it in their profile.</p>
                  <button
                    onClick={() => { setStep('main'); setRxSaved(false) }}
                    className="mt-5 px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold hover:bg-teal-500"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Diagnosis</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder="Brief diagnosis…"
                      className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">Medicines</label>
                    <div className="mt-1 space-y-2">
                      {medicines.map((m, i) => (
                        <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                          <div className="flex gap-2">
                            <input
                              value={m.name}
                              onChange={(e) => setMedicines(medicines.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                              placeholder="Medicine name"
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
                            />
                            <button
                              onClick={() => setMedicines(medicines.length > 1 ? medicines.filter((_, j) => j !== i) : [emptyMedicine()])}
                              className="px-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                              aria-label="Remove medicine"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={m.dosage}
                              onChange={(e) => setMedicines(medicines.map((x, j) => (j === i ? { ...x, dosage: e.target.value } : x)))}
                              placeholder="Dosage"
                              className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
                            />
                            <input
                              value={m.frequency}
                              onChange={(e) => setMedicines(medicines.map((x, j) => (j === i ? { ...x, frequency: e.target.value } : x)))}
                              placeholder="Frequency"
                              className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
                            />
                            <input
                              value={m.duration}
                              onChange={(e) => setMedicines(medicines.map((x, j) => (j === i ? { ...x, duration: e.target.value } : x)))}
                              placeholder="Duration"
                              className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setMedicines([...medicines, emptyMedicine()])}
                      className="mt-2 flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add medicine
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">Advice</label>
                    <textarea
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder="Advice, exercises, precautions…"
                      className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">Follow-up date (optional)</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <button
                    onClick={savePrescription}
                    disabled={savingRx}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-black transition-all disabled:opacity-60"
                  >
                    {savingRx ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pill className="w-4 h-4" />}
                    Save Prescription
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'followup' && (
            <div className="space-y-4">
              <button onClick={() => setStep('main')} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              {fuResult ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-900">{fuResult.length} follow-up session{fuResult.length > 1 ? 's' : ''} booked</p>
                  <div className="mt-2 space-y-1">
                    {fuResult.map((id) => (
                      <p key={id} className="text-[11px] font-mono text-slate-400">{id}</p>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">Free of charge. Confirm the schedule with the patient.</p>
                  <button
                    onClick={() => { setStep('main'); setFuResult(null) }}
                    className="mt-5 px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold hover:bg-teal-500"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 text-[11px] font-semibold text-violet-700">
                    Sessions are booked weekly from the date you choose, at the same time. Discuss the schedule with {appointment.patientName}.
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">Number of follow-ups</label>
                    <div className="mt-1 grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          onClick={() => setSessions(String(n))}
                          className={`py-2.5 rounded-xl border text-sm font-black transition-colors ${
                            sessions === String(n) ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white border-transparent' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">Next session date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => loadWindows(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {windowsLoading && (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking availability…
                    </div>
                  )}

                  {!windowsLoading && date && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Preferred time window</label>
                      {windows.length === 0 ? (
                        <p className="text-xs font-semibold text-amber-600">No availability on this date. Pick another date.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {windows.map((w) => (
                            <button
                              key={`${w.start}-${w.end}`}
                              onClick={() => setWindowSel(`${w.start}|${w.end}`)}
                              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                                windowSel === `${w.start}|${w.end}`
                                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white border-transparent'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {w.label} · {w.start}–{w.end}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={scheduleFollowups}
                    disabled={savingFu || !date || !windowSel}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-black transition-all disabled:opacity-60"
                  >
                    {savingFu ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                    Book Follow-up{sessions !== '1' ? 's' : ''}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}