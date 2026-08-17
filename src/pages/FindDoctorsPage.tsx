import React, { useState, useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { useDoctors, useSymptoms, useCategories, useDoctorAreas } from '../hooks/queries';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { DoctorFilterSidebar } from '../components/doctors/DoctorFilterSidebar';
import { ConsultationMode } from '../types';
import { Stethoscope, ArrowUpDown, Filter, ChevronDown, Loader2, MapPin } from 'lucide-react';

export const FindDoctorsPage: React.FC = () => {
  const { selectedCategorySlug, selectedSymptomSlug, setSelectedCategorySlug, setSelectedSymptomSlug, searchQuery, setSearchQuery } = useBooking();
  const [selectedArea, setSelectedArea] = useState<string>('');
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors(selectedArea || undefined);
  const { data: symptoms = [] } = useSymptoms();
  const { data: categories = [] } = useCategories();
  const { data: areas = [] } = useDoctorAreas();

  const [selectedMode, setSelectedMode] = useState<ConsultationMode | 'all'>('all');
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(selectedSymptomSlug);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(selectedCategorySlug);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'rating-high' | 'experience'>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const symptomTitle = selectedSymptom ? symptoms.find(s => s.slug === selectedSymptom)?.title.toLowerCase() : null;
  const categoryTitle = selectedCategory ? categories.find(c => c.slug === selectedCategory)?.title.toLowerCase() : null;

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
        const matchesArea = doc.location.area.toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesArea) return false;
      }

      // Symptom / category filter (match against specialty, expertise, treatments, bio)
      if (symptomTitle || categoryTitle) {
        const hay = [doc.specialty, ...doc.expertise, ...doc.treatments, doc.bio].join(' ').toLowerCase();
        const terms = [symptomTitle, categoryTitle].filter(Boolean).join(' ').split(' ').filter(w => w.length > 3);
        const fullMatch = [symptomTitle, categoryTitle].filter(Boolean).some(t => hay.includes(t as string));
        if (!fullMatch && !terms.some(t => hay.includes(t))) return false;
      }

      // Gender filter
      if (selectedGender !== 'all' && doc.gender !== selectedGender) return false;

      // Price filter
      if (doc.fees.home > maxPrice && doc.fees.online > maxPrice) return false;

      // Mode filter
      if (selectedMode !== 'all') {
        if (selectedMode === 'home' && !doc.fees.home) return false;
        if (selectedMode === 'online' && !doc.fees.online) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.fees.home - b.fees.home;
      if (sortBy === 'rating-high') return b.rating - a.rating;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      return 0;
    });
  }, [doctors, searchQuery, selectedMode, symptomTitle, categoryTitle, maxPrice, selectedGender, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMode('all');
    setSelectedSymptom(null);
    setSelectedCategory(null);
    setSelectedCategorySlug(null);
    setSelectedSymptomSlug(null);
    setMaxPrice(2000);
    setSelectedGender('all');
    setSelectedArea('');
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Find Certified <span className="text-gradient">Physiotherapists</span>
          </h1>
          <p className="text-slate-600 text-base">
            Book verified specialists in Nagpur for home visits or online consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Filter Sidebar */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-28 self-start">
            {/* Mobile Filters Toggle */}
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className="lg:hidden w-full glass-panel px-5 py-3.5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between font-bold text-sm text-slate-800"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                Filters
                {(searchQuery || selectedMode !== 'all' || selectedSymptom || selectedCategory || maxPrice < 2000 || selectedGender !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={filtersOpen ? 'block' : 'hidden lg:block'}>
              <DoctorFilterSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedMode={selectedMode}
                setSelectedMode={setSelectedMode}
                selectedSymptom={selectedSymptom}
                setSelectedSymptom={setSelectedSymptom}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                selectedGender={selectedGender}
                setSelectedGender={setSelectedGender}
                resetFilters={resetFilters}
              />
            </div>
          </div>

          {/* Right Results Grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Location Filter Bar */}
            {areas.length > 0 && (
              <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Area:</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  <button
                    onClick={() => setSelectedArea('')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      !selectedArea
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Areas
                  </button>
                  {areas.map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        selectedArea === area
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Controls Bar */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-bold text-slate-900">
                Showing <span className="text-blue-600 font-extrabold">{filteredDoctors.length}</span> Verified Physiotherapists
              </p>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <ArrowUpDown className="w-4 h-4 text-blue-500" />
                <span>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating-high">Highest Rating</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="experience">Most Experienced</option>
                </select>
              </div>
            </div>

            {/* Doctor Cards List */}
            {doctorsLoading ? (
              <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-slate-200 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Loading therapists...
              </div>
            ) : filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDoctors.map(doctor => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-slate-200 space-y-4">
                <Stethoscope className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">No doctors matching your filters</h3>
                <p className="text-sm text-slate-500">Try adjusting your price range or clearing symptom filters.</p>
                <button
                  onClick={resetFilters}
                  className="btn-gradient text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md"
                >
                  Reset All Filters
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
