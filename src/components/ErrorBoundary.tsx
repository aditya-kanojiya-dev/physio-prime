import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  /** When this value changes after a crash, the boundary remounts its children. */
  resetKey?: string;
  /** `root` is used outside the layout (no navbar). `page` sits under the header. */
  variant?: 'root' | 'page';
};

type State = { hasError: boolean };

function Fallback({ variant, onRetry }: { variant: 'root' | 'page'; onRetry: () => void }) {
  const padding = variant === 'root' ? 'pt-16' : 'pt-28';
  return (
    <div className={`${padding} pb-20 min-h-screen relative overflow-hidden`}>
      <div className="absolute top-40 -left-20 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 mb-6">
          <AlertTriangle className="w-3.5 h-3.5" />
          Something went wrong
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          This page could not be displayed
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base">
          An unexpected error occurred. You can retry, or go home and continue from there.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.assign('/');
            }}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-slate-700 text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', err, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Fallback
          variant={this.props.variant ?? 'root'}
          onRetry={() => {
            this.setState({ hasError: false });
          }}
        />
      );
    }
    return this.props.children;
  }
}
