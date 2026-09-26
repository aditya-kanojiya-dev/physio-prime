import React from 'react';

type State = { error: Error | null };

// ponytail: admin has no per-route reset needs, so no variant/resetKey props like the
// patient app's boundary. Reload is the only useful recovery for staff.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught admin render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center text-slate-600">
          <p className="text-lg font-semibold text-slate-900">Something went wrong.</p>
          <p className="max-w-sm text-sm text-slate-500">
            The admin portal hit an unexpected error. Reload to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
