import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '../context/BookingContext';
import { useDoctors, useSymptoms, useCategories } from '../hooks/queries';
import { ConsultationMode } from '../types';
import { TherapistSearchBar } from '../components/doctors/TherapistSearchBar';
import { DoctorListCard } from '../components/doctors/DoctorListCard';
import {
  SlidersHorizontal,
  MapPin,
  ArrowUpDown,
  ChevronDown,
  X,
  Stethoscope,
  Home,
  Wallet,
  Check,
  Loader2,
  LocateFixed,
  Sparkles,
  Users,
} from 'lucide-react';

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}

const FilterSelect: React.FC<FilterSelectProps> = ({ value, onChange, placeholder, options }) => {
  const [open, setOpen] = useState(false);
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

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 bg-white border rounded-xl px-3 py-2.5 text-sm text-left transition-all ${
          open ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className={`truncate ${selected ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
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
            className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/5 p-1.5 max-h-60 overflow-y-auto"
          >
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  o.value === value
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FilterPanelProps {
  cityInput: string;
  setCityInput: (v: string) => void;
  areaInput: string;
  setAreaInput: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  selectedSymptom: string | null;
  setSelectedSymptom: (s: string | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  selectedMode: ConsultationMode | 'all';
  setSelectedMode: (m: ConsultationMode | 'all') => void;
  selectedGender: 'all' | 'male' | 'female';
  setSelectedGender: (g: 'all' | 'male' | 'female') => void;
  resetFilters: () => void;
  defaultCity: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  cityInput,
  setCityInput,
  areaInput,
  setAreaInput,
  maxPrice,
  setMaxPrice,
  selectedSymptom,
  setSelectedSymptom,
  selectedCategory,
  setSelectedCategory,
  selectedMode,
  setSelectedMode,
  selectedGender,
  setSelectedGender,
  resetFilters,
  defaultCity,
}) => {
  const { data: categories = [] } = useCategories();
  const { data: symptoms = [] } = useSymptoms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Clear all
        </button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
          Specialty
        </label>
        <FilterSelect
          value={selectedCategory ?? ''}
          onChange={v => setSelectedCategory(v || null)}
          placeholder="All specialties"
          options={categories.map(c => ({ value: c.slug, label: c.title }))}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Symptom
        </label>
        <FilterSelect
          value={selectedSymptom ?? ''}
          onChange={v => setSelectedSymptom(v || null)}
          placeholder="All symptoms"
          options={symptoms.map(s => ({ value: s.slug, label: s.title }))}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Home className="w-3.5 h-3.5 text-blue-600" />
          Consultation type
        </label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
          {([
            ['all', 'All'],
            ['home', 'Home'],
            ['online', 'Video'],
          ] as [ConsultationMode | 'all', string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`py-2 rounded-lg transition-all ${
                selectedMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          Doctor gender
        </label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          {([
            ['all', 'Any'],
            ['female', 'Female'],
            ['male', 'Male'],
          ] as ['all' | 'male' | 'female', string][]).map(([gender, label]) => (
            <button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className={`py-2 rounded-lg transition-all ${
                selectedGender === gender ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          Location
        </label>
        {/* ponytail: no geocoding backend — "use my location" snaps to the primary served city */}
        <button
          onClick={() => setCityInput(defaultCity)}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors"
        >
          <LocateFixed className="w-4 h-4 text-blue-600" />
          Use my location
        </button>
        <div className="relative">
          <input
            type="text"
            value={cityInput}
            onChange={e => setCityInput(e.target.value)}
            placeholder="Enter city"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-14 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          {cityInput && (
            <button
              onClick={() => setCityInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Home className="w-3.5 h-3.5 text-blue-600" />
          Area (home visits)
        </label>
        <input
          type="text"
          value={areaInput}
          onChange={e => setAreaInput(e.target.value)}
          placeholder={`Any area in ${cityInput.trim() || defaultCity}`}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Shows home-visit physios who cover this area.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Wallet className="w-3.5 h-3.5 text-blue-600" />
          Max consultation fee
        </label>
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <span className="text-2xl font-extrabold text-slate-900">₹{maxPrice.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-slate-400 text-right leading-tight">max<br />per session</span>
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
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>₹400</span>
          <span>₹2,000</span>
        </div>
      </div>
    </div>
  );
};

export const FindDoctorsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedCategorySlug,
    selectedSymptomSlug,
    setSelectedCategorySlug,
    setSelectedSymptomSlug,
    searchQuery,
    setSearchQuery,
  } = useBooking();

  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const { data: symptoms = [] } = useSymptoms();
  const { data: categories = [] } = useCategories();

  // ponytail: read ?condition= once at mount so condition-page CTAs land pre-filtered
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(
    selectedSymptomSlug ?? new URLSearchParams(window.location.search).get('condition')
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(selectedCategorySlug);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [cityInput, setCityInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<ConsultationMode | 'all'>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'rating-high' | 'experience'>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  const defaultCity = useMemo(
    () => [...new Set(doctors.map(d => d.location.city))][0] ?? 'your city',
    [doctors]
  );

  const cities = useMemo(
    () => [...new Set(doctors.map(d => d.location.city).filter(Boolean))],
    [doctors]
  );

  const symptomTitle = selectedSymptom ? symptoms.find(s => s.slug === selectedSymptom)?.title.toLowerCase() : null;
  const categoryTitle = selectedCategory ? categories.find(c => c.slug === selectedCategory)?.title.toLowerCase() : null;

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.location.area.toLowerCase().includes(q) ||
          doc.location.city.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (symptomTitle || categoryTitle) {
        const hay = [doc.specialty, ...doc.expertise, ...doc.treatments, doc.bio].join(' ').toLowerCase();
        const terms = [symptomTitle, categoryTitle].filter(Boolean).join(' ').split(' ').filter(w => w.length > 3);
        const fullMatch = [symptomTitle, categoryTitle].filter(Boolean).some(t => hay.includes(t as string));
        if (!fullMatch && !terms.some(t => hay.includes(t))) return false;
      }

      if (cityInput.trim() && !doc.location.city.toLowerCase().includes(cityInput.trim().toLowerCase())) return false;

      if (areaInput.trim()) {
        const a = areaInput.trim().toLowerCase();
        const covered = [doc.location.area, ...(doc.locations ?? []).map(l => l.area)]
          .filter(Boolean)
          .some(area => area!.toLowerCase().includes(a));
        if (!covered) return false;
      }

      if (selectedMode !== 'all') {
        if (selectedMode === 'home' && !(doc.fees.home > 0)) return false;
        if (selectedMode === 'online' && !(doc.fees.online > 0)) return false;
      }

      if (selectedGender !== 'all' && doc.gender?.toLowerCase() !== selectedGender) return false;

      if (doc.fees.home > maxPrice && doc.fees.online > maxPrice) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.fees.home - b.fees.home;
      if (sortBy === 'rating-high') return b.rating - a.rating;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      return 0;
    });
  }, [doctors, searchQuery, symptomTitle, categoryTitle, cityInput, areaInput, maxPrice, sortBy, selectedMode, selectedGender]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSymptom(null);
    setSelectedCategory(null);
    setSelectedCategorySlug(null);
    setSelectedSymptomSlug(null);
    setMaxPrice(2000);
    setCityInput('');
    setAreaInput('');
    setSelectedMode('all');
    setSelectedGender('all');
  };

  const activeFilterCount = [
    !!searchQuery.trim(),
    !!selectedSymptom,
    !!selectedCategory,
    maxPrice < 2000,
    !!cityInput.trim(),
    !!areaInput.trim(),
    selectedMode !== 'all',
    selectedGender !== 'all',
  ].filter(Boolean).length;

  const cityLabel = cityInput.trim() || defaultCity;

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8">

        {/* Search bar */}
        <TherapistSearchBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          location={cityInput || defaultCity}
          onLocationChange={setCityInput}
          cities={cities}
          onUseMyLocation={() => setCityInput(defaultCity)}
        />

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                filtersOpen
                  ? 'btn-gradient text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                  filtersOpen ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <p className="hidden md:block text-sm text-slate-500">
            <span className="font-bold text-slate-900">{filteredDoctors.length}</span>{' '}
            physiotherapists in{' '}
            <span className="font-bold text-slate-900">{cityLabel}</span>
          </p>

          <div className="relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="appearance-none bg-blue-50 border border-blue-200 rounded-full pl-9 pr-9 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="rating-high">Sort: Top Rated</option>
              <option value="price-low">Sort: Price Low</option>
              <option value="experience">Sort: Most Experienced</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <p className="md:hidden text-sm text-slate-500 mb-4">
          <span className="font-bold text-slate-900">{filteredDoctors.length}</span>{' '}
          physiotherapists in <span className="font-bold text-slate-900">{cityLabel}</span>
        </p>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

          {/* Desktop sidebar */}
          {filtersOpen && (
            <aside className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 lg:sticky lg:top-24">
              <FilterPanel
                cityInput={cityInput}
                setCityInput={setCityInput}
                areaInput={areaInput}
                setAreaInput={setAreaInput}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                selectedSymptom={selectedSymptom}
                setSelectedSymptom={setSelectedSymptom}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedMode={selectedMode}
                setSelectedMode={setSelectedMode}
                selectedGender={selectedGender}
                setSelectedGender={setSelectedGender}
                resetFilters={resetFilters}
                defaultCity={defaultCity}
              />
            </aside>
          )}

          {/* Mobile drawer */}
          <AnimatePresence>
            {filtersOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setFiltersOpen(false)}
                  className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  className="lg:hidden fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto"
                >
                  <div className="p-5">
                    <div className="flex justify-end mb-2 lg:hidden">
                      <button
                        onClick={() => setFiltersOpen(false)}
                        aria-label="Close filters"
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <FilterPanel
                      cityInput={cityInput}
                      setCityInput={setCityInput}
                      areaInput={areaInput}
                      setAreaInput={setAreaInput}
                      maxPrice={maxPrice}
                      setMaxPrice={setMaxPrice}
                      selectedSymptom={selectedSymptom}
                      setSelectedSymptom={setSelectedSymptom}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      selectedMode={selectedMode}
                      setSelectedMode={setSelectedMode}
                      selectedGender={selectedGender}
                      setSelectedGender={setSelectedGender}
                      resetFilters={resetFilters}
                      defaultCity={defaultCity}
                    />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Results list */}
          <div className="space-y-4 min-w-0">
            {doctorsLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-20 flex items-center justify-center gap-3 text-sm font-medium text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Loading physiotherapists...
              </div>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map(doctor => {
                const areas = [
                  ...new Set([
                    doctor.location.area,
                    ...(doctor.locations ?? []).map(l => l.area).filter((a): a is string => Boolean(a)),
                  ]),
                ].slice(0, 4);
                const visitTypes = [
                  ...(doctor.fees.home > 0 ? ['home'] : []),
                  ...(doctor.fees.online > 0 ? ['online'] : []),
                ];
                return (
                  <DoctorListCard
                    key={doctor.id}
                    name={doctor.name}
                    photoUrl={doctor.photo}
                    specialty={doctor.specialty}
                    verified={doctor.verified}
                    experienceYears={doctor.experienceYears}
                    availabilityDate={doctor.nextAvailable}
                    sessionFee={doctor.fees.home}
                    visitTypes={visitTypes}
                    locationTags={areas}
                    profileUrl={`/doctor/${doctor.id}`}
                    onBookHomeVisit={() => navigate('/book', { state: { doctor, mode: 'home' } })}
                    onBookOnline={() => navigate('/book', { state: { doctor, mode: 'online' } })}
                    shareUrl={`${window.location.origin}/doctor/${doctor.id}`}
                  />
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-20 text-center space-y-4 px-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No physiotherapists found</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Try adjusting your filters or clearing them to see all results.
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="btn-gradient text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
