import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useSymptoms, useCategories } from '../hooks/queries';
import { CategoriesGrid } from '../components/home/CategoriesGrid';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Search, ArrowUpRight, Clock, Stethoscope, Loader2 } from 'lucide-react';
import { staggerContainer, fadeUp } from '../lib/motion';

export const CategoriesPage: React.FC = () => {
  const { setSelectedSymptomSlug } = useBooking();
  const { data: symptoms = [], isLoading: symptomsLoading } = useSymptoms();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredSymptoms = useMemo(() => {
    let list = symptoms;
    if (activeCategory) {
      list = list.filter((s) => s.popularFor === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [symptoms, search, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    symptoms.forEach((s) => {
      const cat = typeof s.popularFor === 'string' ? s.popularFor : '';
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [symptoms]);

  return (
    <div className="pt-28 pb-20 min-h-screen bg-white">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <Layers className="w-3.5 h-3.5" />
          <span>Clinical Specialties</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Specialized Therapy <span className="text-gradient">Categories</span>
        </h1>
        <p className="text-slate-600 text-base">
          Browse our clinical divisions to find doctors tailored to your exact physical rehabilitation requirements.
        </p>
      </section>

      {/* Categories Grid */}
      <CategoriesGrid showViewAll={false} showHeader={false} />

      {/* All Conditions Section */}
      <section className="py-16 lg:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                All <span className="text-gradient">{symptoms.length}</span> Conditions
              </h2>
              <p className="mt-1.5 text-slate-600 text-sm max-w-xl">
                Detailed descriptions, common symptoms, and treatment approaches for every condition we treat.
              </p>
            </div>
          </div>

          {/* Search + Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conditions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  !activeCategory
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                All ({symptoms.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat.slug
                      ? 'text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                  style={activeCategory === cat.slug ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.title} ({categoryCounts[cat.title] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Grid */}
          {symptomsLoading ? (
            <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Loading conditions...</p>
            </div>
          ) : filteredSymptoms.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-sm">No conditions found matching your search.</p>
            </div>
          ) : (
            <>
              <motion.div
                variants={staggerContainer(0.03, 0.02)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredSymptoms.map((symptom) => {
                  const symptomItems = symptom.symptomsList
                    ? symptom.symptomsList.split(';').map((s) => s.trim()).filter(Boolean)
                    : [];
                  return (
                    <motion.div key={symptom.id} variants={fadeUp(16)}>
                      <Link
                        to="/doctors"
                        onClick={() => setSelectedSymptomSlug(symptom.slug)}
                        className="group block bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 h-full"
                      >
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {symptom.title}
                            </h3>
                            <ArrowUpRight className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors mt-0.5" />
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {symptom.description}
                          </p>

                          {symptomItems.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Stethoscope className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Symptoms</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {symptomItems.slice(0, 4).map((item) => (
                                  <span key={item} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                                    {item}
                                  </span>
                                ))}
                                {symptomItems.length > 4 && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                                    +{symptomItems.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {symptom.treatment && (
                            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 italic">
                              {symptom.treatment}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                            {symptom.recoveryEstimate && (
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-teal-500" />
                                {symptom.recoveryEstimate}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                              {symptom.popularFor}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              {filteredSymptoms.length !== symptoms.length && (
                <p className="text-center text-xs text-slate-400 mt-6">
                  Showing {filteredSymptoms.length} of {symptoms.length} conditions
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};
