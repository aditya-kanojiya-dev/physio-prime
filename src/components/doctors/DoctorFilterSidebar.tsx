import React from 'react';
import { ConsultationMode } from '../../types';
import { SYMPTOMS_DATA } from '../../data/symptoms';
import { CATEGORIES_DATA } from '../../data/categories';
import { Filter, Search, RotateCcw, Home, Video } from 'lucide-react';

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
  searchQuery,
  setSearchQuery,
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
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6 sticky top-28">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-extrabold text-base text-slate-900">Filter Doctors</h3>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All
        </button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">Search Doctor Name</label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Dr. Tarannum, Dr. Pritam..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>
      </div>

      {/* Consultation Mode */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">Consultation Type</label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedMode('all')}
            className={`py-1.5 rounded-lg transition-all ${selectedMode === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedMode('home')}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${selectedMode === 'home' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Home className="w-3 h-3" /> Home
          </button>
          <button
            onClick={() => setSelectedMode('online')}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${selectedMode === 'online' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            <Video className="w-3 h-3" /> Video
          </button>
        </div>
      </div>

      {/* Max Price Range */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Max Session Fee:</span>
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
        <label className="text-xs font-bold text-slate-700">Doctor Gender</label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedGender('all')}
            className={`py-1.5 rounded-lg transition-all ${selectedGender === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            Any
          </button>
          <button
            onClick={() => setSelectedGender('female')}
            className={`py-1.5 rounded-lg transition-all ${selectedGender === 'female' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            Female
          </button>
          <button
            onClick={() => setSelectedGender('male')}
            className={`py-1.5 rounded-lg transition-all ${selectedGender === 'male' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/60'}`}
          >
            Male
          </button>
        </div>
      </div>

      {/* Symptoms Filter Chips */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">Filter By Symptom</label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {SYMPTOMS_DATA.map(s => {
            const isSel = selectedSymptom === s.slug;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSymptom(isSel ? null : s.slug)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
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
      </div>

      {/* Clinical Specialty Filter Chips */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">Clinical Specialty</label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {CATEGORIES_DATA.map(c => {
            const isSel = selectedCategory === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(isSel ? null : c.slug)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
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
      </div>

    </div>
  );
};
