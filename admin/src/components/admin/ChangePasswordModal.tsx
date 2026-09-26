import { useState } from 'react'
import { X, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { hasErrors, matches, minLen, type Errors } from '../../lib/validate'
import { Field } from '../../pages/admin/CategoriesPage'

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Errors<'password' | 'confirm'>>({})
  const [success, setSuccess] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const next: Errors<'password' | 'confirm'> = {
      password: password ? minLen(password, 8, 'Password') : 'Password is required',
      confirm: !confirm ? 'Confirm your new password' : matches(password, confirm),
    }
    setErrors(next)
    if (hasErrors(next)) return

    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setSuccess('Password updated successfully')
      setPassword('')
      setConfirm('')
      setTimeout(onClose, 1500)
    } catch (err) {
      setError((err as Error).message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Enter your new password below.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            label="New Password"
            error={errors.password}
            action={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          >
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((p) => ({ ...p, password: undefined }))
              }}
              placeholder="Enter new password"
              className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </Field>

          <Field label="Confirm Password" error={errors.confirm}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setErrors((p) => ({ ...p, confirm: undefined }))
              }}
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
