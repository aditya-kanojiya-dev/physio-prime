import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useSymptoms } from '../../hooks/queries';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  Users, 
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { staggerContainer } from '../../lib/motion';

export const SymptomsGrid: React.FC = () => {
  const { setSelectedSymptomSlug } = useBooking();
  const { data: symptoms = [], isLoading } = useSymptoms();
  const [showAll, setShowAll] = useState(false);

  // Show 4 initially, all when showAll is true
  const displaySymptoms = showAll ? symptoms : symptoms.slice(0, 4);
  const hasMore = symptoms.length > 4;

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <section className="py-10 lg:py-14 bg-gradient-to-b from-white to-slate-50/60 relative">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
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
            to="/categories"
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
          <>
            {/* Symptoms Grid - 2 columns, dynamic rows */}
            <motion.div
              variants={staggerContainer(0.08, 0.06)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
            >
              <AnimatePresence mode="wait">
                {displaySymptoms.map((symptom, index) => (
                  <motion.div
                    key={symptom.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                    className="h-full"
                  >
                    <Link
                      to="/doctors"
                      onClick={() => setSelectedSymptomSlug(symptom.slug)}
                      className="group block bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-blue-300/70 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 h-full flex flex-col"
                    >
                      <div className="flex flex-col sm:flex-row h-full">
                        {/* Image Section - 40% width on larger screens */}
                        <div className="relative sm:w-[40%] min-h-[180px] sm:min-h-full overflow-hidden flex-shrink-0">
                          <img
                            src={symptom.image}
                            alt={symptom.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent sm:bg-gradient-to-r sm:from-slate-950/60 sm:via-slate-950/10 sm:to-transparent" />

                          {/* Recovery Estimate Badge */}
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1.5 shadow-md border border-white/60">
                            <Clock className="w-3.5 h-3.5 text-teal-500" />
                            <span>{symptom.recoveryEstimate}</span>
                          </div>

                          {/* Verified Badge - visible on image for mobile */}
                          <div className="absolute bottom-3 left-3 sm:hidden bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-teal-400" />
                            <span>Verified Specialists</span>
                          </div>
                        </div>

                        {/* Content Section - 60% width on larger screens */}
                        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {symptom.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5 line-clamp-2">
                              {symptom.description}
                            </p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] sm:text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                <strong className="text-slate-700">Common in:</strong> {symptom.popularFor}
                              </span>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1.5">
                                {[1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-white flex items-center justify-center"
                                  >
                                    <Users className="w-2.5 h-2.5 text-blue-600" />
                                  </div>
                                ))}
                              </div>
                              <span className="text-[10px] font-medium text-slate-500">
                                <span className="text-slate-700 font-semibold">12+</span> specialists
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="hidden sm:inline text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3 inline mr-0.5 text-emerald-500" />
                                Certified
                              </span>
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                                <ArrowUpRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};