import { useEffect, useState } from 'react'
import { AlertTriangle, Timer } from 'lucide-react'

interface ConfirmState {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  holdSeconds: number
  resolve: (ok: boolean) => void
}

let current: ConfirmState | null = null
let listeners: ((state: ConfirmState | null) => void)[] = []

export function confirmDialog(opts: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; tone?: 'danger' | 'primary'; holdSeconds?: number }) {
  return new Promise<boolean>((resolve) => {
    current = { ...opts, holdSeconds: opts.holdSeconds ?? 5, resolve }
    listeners.forEach((fn) => fn(current))
  })
}

function dismiss(ok: boolean) {
  const state = current
  current = null
  listeners.forEach((fn) => fn(null))
  state?.resolve(ok)
}

export function ConfirmDialogHost() {
  const [state, setState] = useState<ConfirmState | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((fn) => fn !== setState)
    }
  }, [])

  useEffect(() => {
    if (!state) return
    setCount(state.holdSeconds)
    const id = setInterval(() => setCount((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [state])

  if (!state) return null

  const ready = count <= 0
  const danger = state.tone === undefined || state.tone === 'danger'
  const confirm = danger ? 'bg-gradient-to-r from-rose-600 to-red-500' : 'bg-gradient-to-r from-blue-600 to-teal-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => dismiss(false)} />
      <div className="relative w-full max-w-md mx-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-2xl ${danger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-700'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{state.title}</h2>
            {state.message && <p className="text-xs text-slate-500 mt-0.5">{state.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dismiss(ready)}
            disabled={!ready}
            className={`flex-1 py-2.5 rounded-xl ${confirm} text-white text-sm font-bold shadow-md transition-all disabled:opacity-60`}
          >
            {ready ? state.confirmLabel || (danger ? 'Yes, Delete' : 'Confirm') : (
              <span className="inline-flex items-center gap-2"><Timer className="w-4 h-4" /> {state.confirmLabel || (danger ? 'Yes, Delete' : 'Confirm')} ({count}s)</span>
            )}
          </button>
          <button
            onClick={() => dismiss(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all"
          >
            {state.cancelLabel || 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}