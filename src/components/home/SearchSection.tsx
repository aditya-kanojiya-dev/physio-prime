import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useDoctors, useSymptoms } from '../../hooks/queries';
import { Search, MapPin, Stethoscope, ArrowRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchSection: React.FC = () => {
  const navigate = useNavigate();
  const { navigateToDoctor, navigateToSymptom, setCurrentPage, setSearchQuery } = useBooking();
  const { data: doctors = [] } = useDoctors();
  const { data: symptoms = [] } = useSymptoms();
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Nagpur');
  const [isFocused, setIsFocused] = useState(false);

  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(query.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(query.toLowerCase()) ||
    doc.expertise.some(e => e.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 3);

  const filteredSymptoms = symptoms.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const hasResults = query.trim().length > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
    setCurrentPage('doctors');
    navigate('/doctors');
  };

  const handleDoctorClick = (doctorId: string) => {
    setIsFocused(false);
    setQuery('');
    navigateToDoctor(doctorId);
    navigate(`/doctor/${doctorId}`);
  };

  const handleSymptomClick = (slug: string) => {
    setIsFocused(false);
    setQuery('');
    navigateToSymptom(slug);
    navigate(`/doctors?category=${slug}`);
  };

  const handleViewAll = () => {
    setIsFocused(false);
    setSearchQuery(query);
    setCurrentPage('doctors');
    navigate('/doctors');
  };

  return (
    <section className="relative z-20 -mt-10 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="relative">
        
        {/* Main Floating Glass Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="glass-panel p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xl bg-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Query Input */}
            <div className="md:col-span-6 relative flex items-center">
              <Search className="w-5 h-5 text-blue-500 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={query}
                onFocus={() => setIsFocused(true)}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search symptoms (e.g. Back pain, Knee rehab), doctors, or therapy..."
                className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City Location Dropdown */}
            <div className="md:col-span-3 relative flex items-center">
              <MapPin className="w-5 h-5 text-teal-500 absolute left-4 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full pl-12 pr-8 py-3.5 bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none appearance-none cursor-pointer shadow-sm"
              >
                <option value="Nagpur">Nagpur (HQ)</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Bangalore">Bangalore</option>
              </select>
            </div>

            {/* Submit Button */}
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

        {/* Live Search Suggestions Dropdown */}
        <AnimatePresence>
          {isFocused && hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 top-full mt-3 glass-panel rounded-3xl border border-slate-200 shadow-xl p-4 bg-white max-h-[28rem] overflow-y-auto z-50 divide-y divide-slate-100"
            >
              
              {/* Doctor Matches */}
              {filteredDoctors.length > 0 && (
                <div className="pb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Physiotherapists</p>
                  <div className="space-y-1.5">
                    {filteredDoctors.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => handleDoctorClick(doc.id)}
                        className="p-2.5 rounded-xl hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img src={doc.photo} alt={doc.name} className="w-10 h-10 rounded-full object-cover border border-blue-200" />
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">{doc.specialty} • {doc.location.area}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-600">View Profile →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Symptom Matches */}
              {filteredSymptoms.length > 0 && (
                <div className="py-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symptoms & Conditions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredSymptoms.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSymptomClick(s.slug)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 cursor-pointer flex items-center gap-2.5 transition-colors border border-slate-100"
                      >
                        <Sparkles className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.title}</p>
                          <p className="text-[10px] text-slate-500">{s.recoveryEstimate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Option */}
              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="text-xs font-extrabold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>See all matching results for "{query}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};
