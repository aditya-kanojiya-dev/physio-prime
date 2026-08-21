import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Loader2, MapPin, Search, SearchX } from 'lucide-react';
import { useSymptoms } from '../hooks/queries';
import { buildConditionGroups } from '../data/conditions';
import { DisclaimerBlock } from '../components/conditions/ConditionShared';

export const ConditionsHubPage: React.FC = () => {
  const { data: symptoms = [], isLoading: symptomsLoading } = useSymptoms();
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = `Physiotherapy Conditions A–Z | PhysioPrime`;
    return () => { document.title = 'PhysioPrime'; };
  }, []);

  const groups = buildConditionGroups(symptoms);
  const totalConditions = groups.reduce((n, g) => n + g.conditions.length, 0);

  const searching = query.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!searching) return [];
    const q = query.trim().toLowerCase();
    return groups
      .flatMap((g) => g.conditions.map((c) => ({ ...c, specialty: g.specialtyName })))
      .filter((c) => c.name.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q));
  }, [groups, query, searching]);

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <header className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Find physiotherapy for your condition.
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            We cover {totalConditions}+ conditions across every major specialty. Each guide explains what the
            condition is, how physiotherapy helps, what recovery looks like — and how to book a verified
            therapist near you.
          </p>
        </header>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${totalConditions}+ conditions, e.g. "back pain"...`}
              className="w-full bg-white border border-slate-200 rounded-full pl-12 pr-11 py-3.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all"
              aria-label="Search conditions"
            />
            {searching && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {searching ? (
          searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
              {searchResults.map((cond) => (
                <Link
                  key={cond.slug}
                  to={`/conditions/${cond.slug}`}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3.5 group hover:border-teal-400 hover:bg-teal-50/40 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-sm font-semibold text-slate-800">{cond.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 mb-16">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <SearchX className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-extrabold text-slate-900 mb-1.5">No conditions match "{query}"</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
                Try a different word — or browse the full list below.
              </p>
              <button
                onClick={() => setQuery('')}
                className="px-5 py-2.5 rounded-full btn-gradient text-white text-sm font-bold shadow-md"
              >
                Clear search
              </button>
            </div>
          )
        ) : null}

        {/* Specialty sections */}
        {symptomsLoading ? (
          <div className="py-20 flex items-center justify-center gap-3 text-sm font-medium text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading conditions...
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.specialtyName} className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {group.specialtyName}
                </h2>
                {group.specialtySlug && (
                  <Link
                    to={`/categories/${group.specialtySlug}`}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-teal-600 transition-colors"
                  >
                    View specialty <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.conditions.map((cond, i) => (
                  <motion.div
                    key={cond.slug}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.15) }}
                  >
                    <Link
                      to={`/conditions/${cond.slug}`}
                      className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3.5 group hover:border-teal-400 hover:bg-teal-50/40 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
                    >
                      <span className="text-sm font-semibold text-slate-800">{cond.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          ))
        )}

        {/* Disclaimer */}
        <div className="mt-16 mb-10">
          <DisclaimerBlock />
        </div>

        {/* Bottom CTA */}
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-8 sm:p-10 shadow-lg shadow-teal-500/20">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Find a physio near you
          </h2>
          <p className="text-teal-50 text-sm mb-6 max-w-md mx-auto">
            Verified therapists for home visits and online consultations — book in under two minutes.
          </p>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-teal-700 font-bold text-sm shadow-md hover:bg-teal-50 transition-colors"
          >
            <MapPin className="w-4 h-4" /> Find a physiotherapist
          </Link>
        </div>
      </div>
    </div>
  );
};
