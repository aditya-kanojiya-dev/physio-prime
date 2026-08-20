import React, { useState } from 'react';
import { ConsultationMode } from '../../types';
import { useSymptoms, useCategories } from '../../hooks/queries';
import { Filter, RotateCcw, Home, Video, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterSidebarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedMode: ConsultationMode | 'all';
  setSelectedMode: (mode: ConsultationMode | 'all') => void;
  selectedSymptom: string | null;
  setSelectedSymptom: (s: string | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  selectedGender: 'all' | 'male' | 'female';
  setSelectedGender: (g: 'all' | 'male' | 'female') => void;
  resetFilters: () => void;
}

export const DoctorFilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedMode,
  setSelectedMode,
  selectedSymptom,
  setSelectedSymptom,
  selectedCategory,
  setSelectedCategory,
  maxPrice,
  setMaxPrice,
  selectedGender,
  setSelectedGender,
  resetFilters,
}) => {
  const { data: symptoms = [] } = useSymptoms();
  const { data: categories = [] } = useCategories();
  
  // Dropdown states
  const [symptomOpen, setSymptomOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(true);

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-200 shadow-xl space-y-6 bg-white">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-extrabold text-base text-slate-900">Filters</h3>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Consultation Mode */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Type</label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedMode('all')}
            className={`py-2 rounded-lg transition-all ${selectedMode === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedMode('home')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${selectedMode === 'home' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Home className="w-3 h-3" /> Home
          </button>
          <button
            onClick={() => setSelectedMode('online')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${selectedMode === 'online' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Video className="w-3 h-3" /> Video
          </button>
        </div>
      </div>

      {/* Max Price Range */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Max Session Fee</span>
          <span className="text-blue-600">₹{maxPrice}</span>
        </div>
        <input
          type="range"
          min="400"
          max="2000"
          step="50"
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>₹400</span>
          <span>₹2,000</span>
        </div>
      </div>

      {/* Gender Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Doctor Gender</label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedGender('all')}
            className={`py-2 rounded-lg transition-all ${selectedGender === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            Any
          </button>
          <button
            onClick={() => setSelectedGender('female')}
            className={`py-2 rounded-lg transition-all ${selectedGender === 'female' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            Female
          </button>
          <button
            onClick={() => setSelectedGender('male')}
            className={`py-2 rounded-lg transition-all ${selectedGender === 'male' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            Male
          </button>
        </div>
      </div>

      {/* Symptoms Dropdown */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <button
          onClick={() => setSymptomOpen(!symptomOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
        >
          <span>Filter By Symptom</span>
          {symptomOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {symptomOpen && (
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-2 pr-1 custom-scrollbar">
            {symptoms.map(s => {
              const isSel = selectedSymptom === s.slug;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSymptom(isSel ? null : s.slug)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    isSel
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-teal-300'
                  }`}
                >
                  {s.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clinical Specialty Dropdown */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <button
          onClick={() => setCategoryOpen(!categoryOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
        >
          <span>Clinical Specialty</span>
          {categoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {categoryOpen && (
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-2 pr-1 custom-scrollbar">
            {categories.map(c => {
              const isSel = selectedCategory === c.slug;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(isSel ? null : c.slug)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    isSel
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-blue-300'
                  }`}
                >
                  {c.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {[selectedSymptom, selectedCategory, selectedMode !== 'all', selectedGender !== 'all', maxPrice < 2000].some(Boolean) && (
        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={resetFilters}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-xs shadow-md shadow-red-500/20 hover:shadow-red-500/30 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Custom Scrollbar Styles - Add to your global CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};