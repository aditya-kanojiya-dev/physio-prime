import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const inputClass =
  'w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      if (tokenHash && type === 'recovery') {
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        });
        if (otpError && alive) {
          setLinkError(otpError.message || 'This reset link is invalid or has expired.');
          setChecking(false);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (!data.session) {
        setLinkError('This reset link is invalid or has expired. Request a new one from the login screen.');
      } else {
        window.history.replaceState({}, '', '/reset-password');
      }
      setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      window.setTimeout(() => navigate('/', { replace: true }), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen relative overflow-hidden">
      <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center">Set a new password</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 text-center">
            Choose a password you have not used on this site before.
          </p>

          {checking && (
            <p className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your reset link…
            </p>
          )}

          {!checking && linkError && (
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {linkError}
              </div>
              <Link to="/" className="block text-center text-sm font-bold text-teal-700 hover:text-teal-800">
                Back to home
              </Link>
            </div>
          )}

          {!checking && !linkError && done && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Password updated. Taking you home…
            </div>
          )}

          {!checking && !linkError && !done && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold text-slate-700">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold text-slate-700">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient w-full rounded-xl py-3.5 text-sm font-extrabold text-white shadow-xl disabled:opacity-70"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Update password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
