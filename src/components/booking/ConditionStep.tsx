import React, { useState, useMemo } from 'react';
import { useSymptoms, useCategories } from '../../hooks/queries';
import { Symptom } from '../../types';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../../lib/motion';
import { Search, Loader2 } from 'lucide-react';

interface ConditionStepProps {
  onSelect: (symptom: Symptom) => void;
}

export const ConditionStep: React.FC<ConditionStepProps> = ({ onSelect }) => {
  const { data: symptoms = [], isLoading: symptomsLoading } = useSymptoms();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // popularFor is a plain string on legacy rows, a jsonb array (specialty tag) on detailed rows
  const labelOf = (s: Symptom): string =>
    Array.isArray(s.popularFor) ? s.popularFor[0] ?? '' : s.popularFor ?? '';

  const categoryTabs = useMemo(() => {
    const popularFors = [...new Set(symptoms.map(labelOf).filter(Boolean))];
    return ['All', ...popularFors];
  }, [symptoms]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return symptoms.filter(s => {
      const matchesSearch = !term || s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term);
      const matchesCategory = activeCategory === 'All' || labelOf(s) === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [symptoms, search, activeCategory]);

  if (symptomsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900">
          What brings you in? <span className="text-gradient">Choose your condition</span>
        </h2>
        <p className="text-sm text-slate-500">Select from 95+ conditions we treat</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conditions..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-sm transition-all"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {categoryTabs.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-sm font-bold text-slate-900">No conditions found</p>
          <p className="text-xs text-slate-500">Try a different search term or category</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map(symptom => {
            const symptomTags = symptom.symptomsList
              ? symptom.symptomsList.split(';').map(s => s.trim()).filter(Boolean)
              : [];
            const visibleTags = symptomTags.slice(0, 3);
            const remainingCount = symptomTags.length - 3;

            return (
              <motion.div
                key={symptom.id}
                variants={fadeUp()}
                onClick={() => onSelect(symptom)}
                className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all"
              >
                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {symptom.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {symptom.description}
                </p>

                {symptomTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {visibleTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100"
                      >
                        {tag}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-500">
                        +{remainingCount} more
                      </span>
                    )}
                  </div>
                )}

                {symptom.treatment && (
                  <p className="text-[11px] text-slate-400 mt-2.5 italic line-clamp-2">
                    {symptom.treatment}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {symptom.recoveryEstimate && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-50 text-teal-600 border border-teal-100">
                      {symptom.recoveryEstimate}
                    </span>
                  )}
                  {labelOf(symptom) && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                      {labelOf(symptom)}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
