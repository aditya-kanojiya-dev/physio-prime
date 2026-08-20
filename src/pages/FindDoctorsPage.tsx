import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useDoctors, useSymptoms, useCategories } from '../hooks/queries';
import { DoctorFilterSidebar } from '../components/doctors/DoctorFilterSidebar';
import { ConsultationMode } from '../types';
import { 
  Stethoscope, 
  ArrowUpDown, 
  Filter, 
  Loader2, 
  Search, 
  X,
  Star,
  MapPin,
  Clock,
  Home,
  Video,
  CheckCircle2,
  Shield,
  Award,
  Users,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 🏥 List View Doctor Card Component
const DoctorListItem: React.FC<{ doctor: any }> = ({ doctor }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/doctor/${doctor.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 shadow-md"
    >
      <div className="flex flex-col md:flex-row">
        {/* 🖼️ Photo - Left side */}
        <div className="md:w-56 h-56 md:h-auto relative overflow-hidden bg-gradient-to-br from-blue-50 to-teal-50 flex-shrink-0">
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent md:bg-gradient-to-r md:from-slate-900/80 md:via-slate-900/20 md:to-transparent" />
          
          {/* ⭐ Rating Badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg border border-slate-200/50">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{doctor.rating}</span>
            <span className="text-[10px] text-slate-500 font-medium">({doctor.reviewCount})</span>
          </div>

          {/* ✅ Verified Badge */}
          {doctor.verified && (
            <div className="absolute top-3 right-3 bg-teal-500/90 backdrop-blur-md px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg border border-teal-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Verified</span>
            </div>
          )}

          {/* 📍 Location Overlay on Mobile */}
          <div className="absolute bottom-3 left-3 right-3 md:hidden bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/50">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> 
              {doctor.location.area}, {doctor.location.city}
            </p>
          </div>
        </div>

        {/* 📋 Content - Right side */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
          <div>
            {/* Header Row */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3
                  onClick={handleViewProfile}
                  className="text-xl md:text-2xl font-extrabold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
                >
                  {doctor.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-teal-600 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {doctor.specialty}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {doctor.experienceYears} Years Experience
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden md:flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> 
                  {doctor.location.address}
                </p>
              </div>
              
              {/* Next Available */}
              <div className="flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-xs font-bold text-teal-700">{doctor.nextAvailable}</span>
              </div>
            </div>

            {/* 💰 Fee & Mode Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                <Home className="w-3.5 h-3.5 text-blue-600" /> 
                ₹{doctor.fees.home} 
                <span className="font-normal text-blue-500 ml-0.5">/visit</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold text-xs">
                <Video className="w-3.5 h-3.5 text-teal-600" /> 
                ₹{doctor.fees.online}
                <span className="font-normal text-teal-500 ml-0.5">/session</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" /> 
                {doctor.patientsTreated}+ patients
              </div>
            </div>

            {/* 🗣️ Languages & Expertise Preview */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="font-semibold text-slate-700">Languages:</span>
                <span>{doctor.languages.join(', ')}</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5 text-slate-600 hidden sm:flex">
                <span className="font-semibold text-slate-700">Expertise:</span>
                <span className="text-slate-500 truncate max-w-xs">
                  {doctor.expertise.slice(0, 3).join(', ')}
                  {doctor.expertise.length > 3 && ` +${doctor.expertise.length - 3} more`}
                </span>
              </div>
            </div>
          </div>

          {/* 🎯 Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleViewProfile}
              className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              View Profile <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/book', { state: { doctor, mode: 'home' } })}
              className="flex-1 min-w-[120px] bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Book Now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const FindDoctorsPage: React.FC = () => {
  const { 
    selectedCategorySlug, 
    selectedSymptomSlug, 
    setSelectedCategorySlug, 
    setSelectedSymptomSlug, 
    searchQuery, 
    setSearchQuery 
  } = useBooking();
  
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const { data: symptoms = [] } = useSymptoms();
  const { data: categories = [] } = useCategories();

  const popularAreas = useMemo(() => {
    const areas = doctors.map(d => d.location.area).filter(Boolean);
    return [...new Set(areas)].slice(0, 6);
  }, [doctors]);

  // Filter States
  const [selectedMode, setSelectedMode] = useState<ConsultationMode | 'all'>('all');
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(selectedSymptomSlug);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(selectedCategorySlug);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'rating-high' | 'experience'>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery, setSearchQuery]);

  const symptomTitle = selectedSymptom ? symptoms.find(s => s.slug === selectedSymptom)?.title.toLowerCase() : null;
  const categoryTitle = selectedCategory ? categories.find(c => c.slug === selectedCategory)?.title.toLowerCase() : null;

  // Filter and sort logic
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
        const matchesArea = doc.location.area.toLowerCase().includes(q);
        const matchesCity = doc.location.city.toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesArea && !matchesCity) return false;
      }

      // Symptom / category filter
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
    setLocalSearchQuery('');
    setSearchQuery('');
    setSelectedMode('all');
    setSelectedSymptom(null);
    setSelectedCategory(null);
    setSelectedCategorySlug(null);
    setSelectedSymptomSlug(null);
    setMaxPrice(2000);
    setSelectedGender('all');
  };

  // Count active filters
  const activeFilterCount = [
    selectedMode !== 'all',
    !!selectedSymptom,
    !!selectedCategory,
    maxPrice < 2000,
    selectedGender !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* 🏠 Page Header - Centered */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/10 to-teal-600/10 text-blue-700 text-xs font-bold border border-blue-200/50 backdrop-blur-sm mb-4">
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Directory</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-teal-600">{filteredDoctors.length} Verified Doctors</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Find <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Expert Physiotherapists</span>
          </h1>
          
          <p className="text-slate-600 text-sm md:text-base mt-3 max-w-2xl mx-auto">
            Connect with verified specialists in Nagpur for personalized home visits or convenient online consultations
          </p>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>100% Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>10K+ Patients Treated</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Secure Booking</span>
            </div>
          </div>
        </div>

        {/* 🔍 TOP SEARCH & FILTERS PANEL */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 mb-6 md:mb-8 overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="w-5 h-5 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={localSearchQuery}
                    onChange={e => setLocalSearchQuery(e.target.value)}
                    placeholder="🔍 Search doctors by name, specialty, location..."
                    className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                  {localSearchQuery && (
                    <button
                      onClick={() => {
                        setLocalSearchQuery('');
                        setSearchQuery('');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Quick Search Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Popular Areas:</span>
                  {popularAreas.map(area => (
                    <button
                      key={area}
                      onClick={() => setLocalSearchQuery(area)}
                      className="text-[10px] font-semibold px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all"
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
                {/* Results Count */}
                <div className="hidden sm:flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200/50">
                  <span className="text-xs font-bold text-slate-700">
                    <span className="text-blue-600 text-sm">{filteredDoctors.length}</span>
                    <span className="text-slate-400 font-medium ml-1">doctors</span>
                  </span>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer py-0.5"
                  >
                    <option value="recommended">⭐ Recommended</option>
                    <option value="rating-high">🏆 Top Rated</option>
                    <option value="price-low">💰 Price: Low</option>
                    <option value="experience">🎓 Most Experienced</option>
                  </select>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setFiltersOpen(o => !o)}
                  className="lg:hidden relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-[10px] rounded-full flex items-center justify-center font-extrabold border-2 border-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 📱 Mobile Filters Dropdown */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t border-slate-200 overflow-hidden"
              >
                <div className="p-4 sm:p-5 bg-slate-50/50">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-3 space-y-4 lg:sticky lg:top-28 self-start">
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

          {/* Right Results - List View Only */}
          <div className="lg:col-span-9 space-y-4 md:space-y-6">
            
            {/* Results Header */}
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white text-xs font-extrabold">
                  {filteredDoctors.length}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} Available
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : 'Showing all results'}
                  </p>
                </div>
              </div>
              
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Results List */}
            {doctorsLoading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center gap-3 text-sm font-bold text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                Loading verified doctors...
              </div>
            ) : filteredDoctors.length > 0 ? (
              <AnimatePresence>
                <div className="space-y-4">
                  {filteredDoctors.map((doctor, index) => (
                    <DoctorListItem key={doctor.id} doctor={doctor} />
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">No Doctors Found</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                    We couldn't find any doctors matching your criteria. Try adjusting your filters or search terms.
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="btn-gradient text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Reset All Filters
                </button>
              </motion.div>
            )}

          </div>

        </div>

        {/* 📱 Mobile Bottom Stats */}
        <div className="lg:hidden mt-6 flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-700">
            {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} Found
          </span>
          <span className="text-xs text-slate-400">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        </div>

      </div>
    </div>
  );
};