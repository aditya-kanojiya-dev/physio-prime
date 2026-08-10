import React, { useState } from 'react';
import { Doctor, ConsultationMode } from '../../types';
import { useBooking } from '../../context/BookingContext';
import { Home, Video, Calendar, Clock, Sparkles, Shield } from 'lucide-react';

interface StickyBookingPanelProps {
  doctor: Doctor;
}

export const StickyBookingPanel: React.FC<StickyBookingPanelProps> = ({ doctor }) => {
  const { openBookingModal } = useBooking();
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('home');
  const [selectedDate, setSelectedDate] = useState('2026-08-12');
  const [selectedSlot, setSelectedSlot] = useState('03:00 PM');

  const dates = [
    { day: 'Wed', date: '12 Aug', full: '2026-08-12' },
    { day: 'Thu', date: '13 Aug', full: '2026-08-13' },
    { day: 'Fri', date: '14 Aug', full: '2026-08-14' },
    { day: 'Sat', date: '15 Aug', full: '2026-08-15' },
  ];

  const afternoonSlots = ['02:00 PM', '03:00 PM', '04:30 PM'];

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
              onClick={() => setSelectedDate(d.full)}
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
          <span>Select Available Slot</span>
        </label>

        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Afternoon Slots</p>
          <div className="grid grid-cols-3 gap-2">
            {afternoonSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedSlot === slot
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-teal-300'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
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
