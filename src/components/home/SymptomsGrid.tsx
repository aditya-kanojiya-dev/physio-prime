import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { useSymptoms } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export const SymptomsGrid: React.FC = () => {
  const { navigateToSymptom, setCurrentPage } = useBooking();
  const { data: symptoms = [], isLoading } = useSymptoms();

  return (
    <section className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Targeted Clinical Treatments</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Find Specialist By <span className="text-gradient">Symptoms</span>
            </h2>
            <p className="text-slate-600 text-base max-w-xl">
              Choose your condition for tailored rehabilitation plans designed by senior certified physiotherapists.
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('doctors')}
            className="self-start md:self-auto px-5 py-2.5 rounded-xl font-bold text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all"
          >
            <span>Explore All 20+ Conditions</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Symptoms Cards Grid */}
        {isLoading ? (
          <div className="text-center py-16 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading conditions...
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {symptoms.map((symptom, idx) => (
            <motion.div
              key={symptom.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              onClick={() => navigateToSymptom(symptom.slug)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={symptom.image}
                    alt={symptom.title}
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

            </motion.div>
          ))}
        </div>
        )}

      </div>
    </section>
  );
};
