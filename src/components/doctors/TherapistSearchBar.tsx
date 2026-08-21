import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  ChevronDown,
  X,
  LocateFixed,
  Stethoscope,
} from 'lucide-react';

interface TherapistSearchBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
  onSearch?: () => void;
  onInputFocus?: () => void;
  placeholder?: string;
  cities?: string[];
  onUseMyLocation?: () => void;
  className?: string;
}

const LocationPicker: React.FC<{
  location: string;
  onSelect: (city: string) => void;
  cities?: string[];
  onUseMyLocation?: () => void;
}> = ({ location, onSelect, cities = [], onUseMyLocation }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = cities.filter(c => c.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full relative flex items-center pl-12 pr-8 py-3.5 bg-white border border-slate-200 hover:border-teal-500 focus:border-teal-500 rounded-2xl text-sm font-semibold text-slate-900 transition-all shadow-sm"
      >
        <MapPin className="w-5 h-5 text-teal-500 absolute left-4 pointer-events-none" />
        <span className={`flex-1 text-left truncate ${location ? '' : 'text-slate-400 font-medium'}`}>
          {location || 'Location'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-full min-w-[16rem] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 p-2 z-30"
          >
            <div className="relative mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search city or area"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
            {onUseMyLocation && (
              <button
                type="button"
                onClick={() => { onUseMyLocation(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors mb-1"
              >
                <LocateFixed className="w-4 h-4" />
                Use my location
              </button>
            )}
            <div className="max-h-48 overflow-y-auto">
              {!query.trim() && (
                <button
                  type="button"
                  onClick={() => { onSelect(''); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                    !location ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All cities
                </button>
              )}
              {filtered.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => { onSelect(city); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                    location === city
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{city}</span>
                  {location === city && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                </button>
              ))}
              {query.trim() && filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">No matches</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TherapistSearchBar: React.FC<TherapistSearchBarProps> = ({
  searchValue,
  onSearchChange,
  location,
  onLocationChange,
  onSearch,
  placeholder = 'Search by name, specialty, or condition',
  cities = [],
  onUseMyLocation,
  onInputFocus,
  className = 'max-w-6xl mx-auto mb-6',
}) => {
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch?.();
  };

  return (
    <div className={className}>
      <form
        onSubmit={submit}
        className="glass-panel p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xl bg-white"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">

          {/* Search input */}
          <div className="md:col-span-6 relative flex items-center">
            <Search className="w-5 h-5 text-blue-500 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              onFocus={onInputFocus}
              placeholder={placeholder}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location picker */}
          <div className="md:col-span-3">
            <LocationPicker
              location={location}
              onSelect={onLocationChange}
              cities={cities}
              onUseMyLocation={onUseMyLocation}
            />
          </div>

          {/* Submit */}
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full btn-gradient text-white py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Stethoscope className="w-4 h-4 text-teal-300" />
              <span>Search Therapists</span>
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};
