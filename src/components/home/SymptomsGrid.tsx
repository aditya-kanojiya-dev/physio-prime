import React from 'react';
import { Link } from 'react-router-dom';
import { useSymptoms } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export const SymptomsGrid: React.FC = () => {
  const { data: symptoms = [], isLoading } = useSymptoms();

  return (
    <section className="py-10 lg:py-14 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/70 text-teal-700 text-xs font-semibold tracking-wide shadow-sm">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span>Targeted Clinical Treatments</span>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Find Specialist By{' '}
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Symptoms
                </span>
              </h2>
              <p className="text-slate-600 text-base max-w-xl mt-3 leading-relaxed">
                Choose your condition for tailored rehabilitation plans designed by senior certified physiotherapists.
              </p>
            </div>
          </div>

          <Link
            to="/conditions"
            className="group self-start md:self-auto px-6 py-3 rounded-xl font-semibold text-sm text-blue-700 bg-blue-50/80 border border-blue-200/60 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md flex items-center gap-2 transition-all duration-200"
          >
            <span>Explore All Conditions</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Loading conditions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {symptoms.filter((s) => (s.image ?? '').startsWith('http')).slice(0, 8).map((symptom, idx) => (
              <motion.div
                key={symptom.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`h-full ${idx >= 4 ? 'hidden lg:block' : ''}`}
              >
                <Link
                  to={`/conditions/${symptom.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Image Banner */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={symptom.image}
                        alt={symptom.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                      {/* Recovery Estimate Pill */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-900 flex items-center gap-1 shadow-sm border border-slate-200/80">
                        <Clock className="w-3 h-3 text-teal-500" />
                        <span>{symptom.recoveryEstimate}</span>
                      </div>

                      {/* Title Overlay */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                          {symptom.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Description Content */}
                    <div className="p-5 space-y-2">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {symptom.description}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        <strong className="text-slate-900">Common in:</strong> {symptom.popularFor}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-200">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> Verified Specialists
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
