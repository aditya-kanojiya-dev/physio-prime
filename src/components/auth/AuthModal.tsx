import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, MailCheck, ShieldCheck, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const reduce = useReducedMotion();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const fade = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.95, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96 },
      };
  const spring = { type: 'spring' as const, stiffness: 260, damping: 24 };

  const switchMode = (next: boolean) => {
    setIsLogin(next);
    setError(null);
    setFieldError(null);
    setConfirmationSent(false);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    if (!isLogin && password.length < 8) {
      setFieldError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        onClose();
      } else {
        const hasSession = await register(name, email, password);
        if (hasSession) onClose();
        else setConfirmationSent(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error)?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error)?.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            {...fade}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={isLogin ? 'Log in' : 'Create account'}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {isLogin ? 'Book and manage your physiotherapy care.' : 'Join PhysioPrime for personalized recovery.'}
              </p>
            </div>

            <div className="px-8 pb-8">
              {/* Segmented tabs */}
              <div className="mb-6 flex gap-6 border-b border-slate-200">
                {(
                  [
                    { value: true, label: 'Log in' },
                    { value: false, label: 'Create account' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => switchMode(t.value)}
                    className={`relative pb-2.5 text-sm font-bold transition-colors ${
                      isLogin === t.value ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.label}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-teal-600 transition-transform duration-200 ease-out ${
                        isLogin === t.value ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <form key={String(isLogin)} onSubmit={handleSubmit} className="animate-auth-enter space-y-4">
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="ml-1 text-xs font-bold text-slate-700">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldError) setFieldError(null);
                      }}
                      className={`${inputClass} pr-11`}
                      required
                      minLength={isLogin ? undefined : 8}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldError && <p className="ml-1 mt-1 text-xs font-semibold text-red-600">{fieldError}</p>}
                </div>

                {confirmationSent && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                    <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    Check your inbox for a confirmation link to activate your account.
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full rounded-xl py-3.5 text-sm font-extrabold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Please wait…
                    </span>
                  ) : isLogin ? (
                    'Log in'
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute w-full border-t border-slate-200" />
                <span className="relative bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Or continue with
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-70"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
                </svg>
                Continue with Google
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
