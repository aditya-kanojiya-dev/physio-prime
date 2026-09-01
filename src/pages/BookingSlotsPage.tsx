import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import { useDoctors } from '../hooks/queries';
import { api } from '../lib/api';
import { ApiTimeWindow, formatTime } from '../lib/adapters';
import { Doctor } from '../types';
import { 
  Calendar, Clock, MapPin, 
  XCircle, ChevronRight,
  Sparkles, ArrowRight, Filter, Search, Star, Loader2
} from 'lucide-react';

interface BookingSlot {
  doctorId: string;
  doctorName: string;
  doctorPhoto: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  mode: 'home' | 'online';
  fee: number;
}

export const BookingSlotsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'all' | 'home' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Generate next 7 days
  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        full: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        isToday: i === 0
      });
    }
    return dates;
  }, []);

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    let result = doctors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.specialty.toLowerCase().includes(query) ||
        doc.location.area.toLowerCase().includes(query) ||
        doc.location.city.toLowerCase().includes(query)
      );
    }

    if (selectedMode !== 'all') {
      result = result.filter(doc => doc.fees[selectedMode] !== undefined);
    }

    return result;
  }, [doctors, searchQuery, selectedMode]);

  // Real availability per doctor for the selected date
  const slotQueries = useQueries({
    queries: filteredDoctors.map((doctor) => ({
      queryKey: ['slots', doctor.id, selectedDate],
      queryFn: async (): Promise<{ windows: ApiTimeWindow[]; date: string }> => {
        const data = await api.get<{ windows: ApiTimeWindow[]; date: string }>(`/doctors/${doctor.id}/slots?date=${selectedDate}`);
        return data;
      },
      enabled: !!selectedDate,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    })),
  });

  const handleBookSlot = (doctor: Doctor, date: string, time: string, mode: 'home' | 'online') => {
    const slot: BookingSlot = {
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorPhoto: doctor.photo,
      doctorSpecialty: doctor.specialty,
      date,
      time,
      mode,
      fee: doctor.fees[mode],
    };
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedSlot) return;
    const doctor = doctors.find(d => d.id === selectedSlot.doctorId);
    if (!doctor) return;
    setShowBookingModal(false);
    navigate('/book', { state: { doctor, mode: selectedSlot.mode, date: selectedSlot.date, time: selectedSlot.time } });
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-3 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Your Slot</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Find Available <span className="text-gradient">Time Slots</span>
          </h1>
          <p className="text-slate-600 text-base">
            Check doctor availability and book your preferred time slot instantly.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all"
              />
            </div>

            {/* Date Selector */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Date</option>
                {weekDates.map(d => (
                  <option key={d.full} value={d.full}>
                    {d.day}, {d.month} {d.date} {d.isToday ? '(Today)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as 'all' | 'home' | 'online')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="home">Home Visit</option>
                <option value="online">Video Consult</option>
              </select>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-slate-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs font-semibold text-slate-700">Busy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-slate-700">Limited</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Doctors Grid */}
        {doctorsLoading ? (
          <div className="text-center py-20 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading doctors...
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDoctors.map((doctor, index) => {
              const windows = slotQueries[index]?.data?.windows ?? [];
              const slotsLoading = selectedDate ? slotQueries[index]?.isFetching : false;
              const totalCapacity = windows.reduce((acc, w) => acc + w.maxPatients, 0);
              const totalBooked = windows.reduce((acc, w) => acc + w.bookedCount, 0);
              const totalAvailable = totalCapacity - totalBooked;

              return (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    {/* Doctor Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <img
                          src={doctor.photo}
                          alt={doctor.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-100"
                        />
                        <div>
                          <h3 className="text-lg font-extrabold text-slate-900">{doctor.name}</h3>
                          <p className="text-sm text-teal-600 font-semibold">{doctor.specialty}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              {doctor.rating} ({doctor.reviewCount} reviews)
                            </span>
                            <span>•</span>
                            <span>{doctor.experienceYears} years exp</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {doctor.location.area}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Availability Stats */}
                      {selectedDate && !slotsLoading && (
                        <div className="sm:ml-auto flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-extrabold text-green-600">{totalAvailable}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">Spots Left</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-extrabold text-red-500">{totalBooked}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">Booked</div>
                          </div>
                          <div className="w-16 h-16 relative">
                            <svg className="w-16 h-16 -rotate-90">
                              <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="#10b981"
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray={`${totalCapacity > 0 ? (totalAvailable / totalCapacity) * 176 : 0} 176`}
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-extrabold text-slate-700">{totalCapacity > 0 ? Math.round((totalAvailable / totalCapacity) * 100) : 0}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Time Slots */}
                    {selectedDate ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">
                              Available Slots for {weekDates.find(d => d.full === selectedDate)?.day}, {weekDates.find(d => d.full === selectedDate)?.month} {weekDates.find(d => d.full === selectedDate)?.date}
                            </span>
                          </div>
                        </div>

                        {slotsLoading ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking availability...
                          </div>
                        ) : windows.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {windows.map((w) => {
                              const remaining = w.maxPatients - w.bookedCount;
                              const isFull = remaining <= 0 || !w.available;
                              return (
                                <motion.button
                                  key={`${w.start}-${w.end}`}
                                  whileHover={isFull ? undefined : { scale: 1.03 }}
                                  whileTap={isFull ? undefined : { scale: 0.97 }}
                                  onClick={() => !isFull && handleBookSlot(doctor, selectedDate, `${w.start}-${w.end}`, selectedMode !== 'all' ? selectedMode : 'home')}
                                  disabled={isFull}
                                  className={`relative p-4 rounded-2xl text-left transition-all border ${
                                    isFull
                                      ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                      : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-extrabold text-slate-900">{w.label}</span>
                                    {isFull ? (
                                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">FULL</span>
                                    ) : remaining <= 1 ? (
                                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">LAST SPOT</span>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-slate-500 font-semibold">{formatTime(w.start)} – {formatTime(w.end)}</p>
                                  <p className={`text-xs font-bold mt-1 ${isFull ? 'text-slate-400' : 'text-green-700'}`}>
                                    {isFull ? 'Fully booked' : `${remaining} of ${w.maxPatients} spots left`}
                                  </p>
                                </motion.button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                            <XCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-600">No slots available</p>
                            <p className="text-xs text-slate-400">Please select a different date</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-600">Select a date to view slots</p>
                        <p className="text-xs text-slate-400">Choose from the date filter above</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filteredDoctors.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm font-semibold text-slate-600">No doctors match your filters</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search or mode</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Booking Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/book')}
            className="btn-gradient text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl shadow-blue-500/25 inline-flex items-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Quick Book Without Slot Selection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Booking Modal */}
        <AnimatePresence>
          {showBookingModal && selectedSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Confirm Booking</h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <img
                      src={selectedSlot.doctorPhoto}
                      alt={selectedSlot.doctorName}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{selectedSlot.doctorName}</p>
                      <p className="text-xs text-teal-600 font-semibold">{selectedSlot.doctorSpecialty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-[10px] text-slate-400 font-semibold">Date</p>
                      <p className="font-bold text-slate-900">{selectedSlot.date}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-[10px] text-slate-400 font-semibold">Time</p>
                      <p className="font-bold text-slate-900">{selectedSlot.time.replace('-', ' - ')}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <p className="text-[10px] text-slate-400 font-semibold">Mode</p>
                      <p className="font-bold text-slate-900 capitalize">{selectedSlot.mode}</p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                      <p className="text-[10px] text-slate-400 font-semibold">Fee</p>
                      <p className="font-bold text-slate-900">₹{selectedSlot.fee}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    className="w-full btn-gradient text-white py-3 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <span>Proceed to Book</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
