import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function VerifyEmailPage() {
  const [state, setState] = useState<'checking' | 'verified' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      if (tokenHash && type === 'signup') {
        const { error: otpError } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash });
        if (!alive) return;
        if (otpError) {
          setError(otpError.message || 'This verification link is invalid or has expired.');
          setState('error');
          return;
        }
      }
      if (!alive) return;
      setState('verified');
      try {
        window.history.replaceState({}, '', '/verify');
      } catch {
        // ignore history manipulation failures
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="pt-28 pb-20 min-h-screen relative overflow-hidden">
      <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
            {state === 'checking' ? <Mail className="h-6 w-6" /> : state === 'verified' ? <ShieldCheck className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          </div>

          {state === 'checking' && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Confirming your email</h1>
              <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying your account…
              </p>
            </>
          )}

          {state === 'verified' && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Email verified</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Your email has been confirmed. You can now sign in to book and manage your appointments.
              </p>
              <Link
                to="/"
                className="btn-gradient mt-6 inline-flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-extrabold text-white shadow-xl"
              >
                Continue to Home
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Verification failed</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">{error}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Request a new confirmation email from the sign-up screen and try again.
              </p>
              <Link to="/" className="mt-6 block text-center text-sm font-bold text-teal-700 hover:text-teal-800">
                Back to home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
