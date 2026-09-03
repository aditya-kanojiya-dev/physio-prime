import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <div className="pt-28 pb-20 min-h-screen relative overflow-hidden">
      <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[26rem] h-[26rem] bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-6">
          <FileQuestion className="w-3.5 h-3.5" />
          Page not found
        </div>
        <p className="text-7xl sm:text-8xl font-extrabold text-slate-200 tracking-tight select-none">404</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          This page does not exist
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base">
          We could not find{' '}
          <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold break-all">
            {pathname}
          </code>
          . Check the address, or go back to a known page. Your previous page is still in browser history.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/doctors"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-slate-700 text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Find a doctor
          </Link>
        </div>
      </div>
    </div>
  );
}
