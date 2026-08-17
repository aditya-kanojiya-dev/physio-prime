import React, { useState, useMemo } from 'react';
import { Doctor, ConsultationMode } from '../../types';
import { useBooking } from '../../context/BookingContext';
import { useSlots } from '../../hooks/queries';
import { windowFirstSlot, formatTime } from '../../lib/adapters';
import { Home, Video, Calendar, Clock, Sparkles, Shield, Loader2 } from 'lucide-react';

interface StickyBookingPanelProps {
  doctor: Doctor;
}

export const StickyBookingPanel: React.FC<StickyBookingPanelProps> = ({ doctor }) => {
  const { openBookingModal } = useBooking();
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('home');

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        full: d.toISOString().split('T')[0],
      };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(dates[0].full);
  const [selectedSlot, setSelectedSlot] = useState('');
  const { data: slots, isLoading, error } = useSlots(doctor.id, selectedDate);

  const fee = doctor.fees[selectedMode];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-6 sticky top-28 bg-white">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900">Book Appointment</h3>
          <p className="text-xs text-slate-500">Select consultation mode & slot</p>
        </div>
        <span className="text-xl font-black text-blue-600">₹{fee}</span>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setSelectedMode('home')}
          className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            selectedMode === 'home'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home Visit</span>
        </button>

        <button
          onClick={() => setSelectedMode('online')}
          className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            selectedMode === 'online'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Video Consult</span>
        </button>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Select Date</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {dates.map(d => (
            <button
              key={d.full}
              onClick={() => {
                setSelectedDate(d.full);
                setSelectedSlot('');
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedDate === d.full
                  ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-md shadow-blue-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-blue-300'
              }`}
            >
              <p className="text-[10px] uppercase font-semibold">{d.day}</p>
              <p className="text-xs font-bold">{d.date}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Slot Picker */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-teal-600" />
          <span>Select Available Window</span>
        </label>

        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Available Windows</p>
          {isLoading ? (
            <p className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading windows...
            </p>
          ) : error ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              Could not load windows.
            </p>
          ) : slots && slots.length > 0 ? (
            <div className="space-y-2">
              {slots.map(w => {
                const remaining = w.maxPatients - w.bookedCount;
                const isFull = remaining <= 0 || !w.available;
                const value = windowFirstSlot(w);
                return (
                  <button
                    key={`${w.start}-${w.end}`}
                    onClick={() => !isFull && setSelectedSlot(value)}
                    disabled={isFull}
                    className={`w-full p-3 rounded-xl text-left border transition-all ${
                      isFull
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : selectedSlot === value
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold ${selectedSlot === value ? 'text-white' : 'text-slate-900'}`}>{w.label}</span>
                      {isFull ? (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">FULL</span>
                      ) : (
                        <span className={`text-[10px] font-bold ${selectedSlot === value ? 'text-teal-100' : 'text-green-600'}`}>
                          {remaining} of {w.maxPatients}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] font-semibold mt-0.5 ${selectedSlot === value ? 'text-teal-100' : 'text-slate-400'}`}>
                      {formatTime(w.start)} – {formatTime(w.end)}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              No slots available for this day.
            </p>
          )}
        </div>
      </div>

      {/* Price Summary */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Consultation Fee ({selectedMode === 'home' ? 'Home Visit' : 'Video'})</span>
          <span className="font-bold text-slate-900">₹{fee}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Booking & Convenience Fee</span>
          <span className="font-bold text-teal-600">FREE</span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
          <span>Total Payable</span>
          <span className="text-blue-600">₹{fee}</span>
        </div>
      </div>

      {/* Proceed CTA Button */}
      <button
        onClick={() => openBookingModal({ doctor, mode: selectedMode })}
        className="w-full btn-gradient text-white py-4 rounded-2xl font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <Sparkles className="w-4 h-4 text-teal-200" />
        <span>Proceed to Confirm Slot</span>
      </button>

      <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
        <Shield className="w-3.5 h-3.5 text-teal-500" />
        <span>100% Refundable up to 2 hours before slot</span>
      </div>

    </div>
  );
};
