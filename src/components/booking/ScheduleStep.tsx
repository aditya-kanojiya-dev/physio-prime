import React, { useEffect, useMemo, useRef } from 'react';
import { useSlots } from '../../hooks/queries';
import { Doctor, ConsultationMode, Symptom } from '../../types';
import { windowFirstSlot, formatTime } from '../../lib/adapters';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Home, Video, Loader2 } from 'lucide-react';

interface WeekDate {
  day: string;
  date: number;
  month: string;
  full: string;
  isToday: boolean;
}

function generateWeekDates(count = 7): WeekDate[] {
  const dates: WeekDate[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      full: d.toISOString().split('T')[0],
      isToday: i === 0,
    });
  }
  return dates;
}

interface ScheduleStepProps {
  doctor: Doctor;
  mode: ConsultationMode;
  symptom: Symptom | null;
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onSelect: () => void;
  onBack: () => void;
}

const weekDates = generateWeekDates();

export const ScheduleStep: React.FC<ScheduleStepProps> = ({
  doctor,
  mode,
  symptom,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onSelect,
  onBack,
}) => {
  const { data: slots, isLoading, error } = useSlots(doctor.id, selectedDate || null);

  const hasAvailable = useMemo(() => {
    if (!slots) return false;
    return slots.some((w) => {
      const remaining = w.maxPatients - w.bookedCount;
      return remaining > 0 && w.available;
    });
  }, [slots]);

  const triedDates = useRef(new Set<string>());
  const didInit = useRef(false);

  // Auto-select first available date on mount (runs once)
  useEffect(() => {
    if (didInit.current) return;
    if (selectedDate) { didInit.current = true; return; }
    if (isLoading || !slots) return;
    didInit.current = true;
    if (hasAvailable) return;
    const nextDate = weekDates.find((d) => !triedDates.current.has(d.full));
    if (nextDate) onDateChange(nextDate.full);
    // ponytail: only runs once on mount, onDateChange is stable useState setter
  }, [slots, isLoading, selectedDate, hasAvailable, onDateChange]);

  const canContinue = !!selectedDate && !!selectedTime;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-28 z-10 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 3 of 4</p>
            <h1 className="text-base font-extrabold text-slate-900">Pick Date & Time</h1>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-24">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm"
        >
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900 truncate">{doctor.name}</p>
            <p className="text-xs text-slate-500 truncate">{doctor.specialty}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {mode === 'home' ? <Home className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                {mode === 'home' ? 'Home Visit' : 'Online'}
              </span>
              {symptom && (
                <span className="text-[10px] font-bold text-teal-600 truncate">{symptom.title}</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Select Date</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {weekDates.map((d) => (
              <button
                type="button"
                key={d.full}
                onClick={() => {
                  onDateChange(d.full);
                  onTimeChange('');
                }}
                className={`flex-shrink-0 w-16 py-3 rounded-2xl border text-center transition-all ${
                  selectedDate === d.full
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                <p className="text-[10px] uppercase font-semibold">{d.day}</p>
                <p className="text-lg font-bold">{d.date}</p>
                <p className="text-[9px] uppercase opacity-70">{d.month}</p>
                {d.isToday && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-[8px] font-bold uppercase">
                    Today
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Time Windows */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Select Time Window</label>

          {isLoading ? (
            <div className="flex items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading available slots...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-600">
              Could not load slots. Please try another date.
            </div>
          ) : slots && slots.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {[...slots].sort((a, b) => {
                const aFull = (a.maxPatients - a.bookedCount) <= 0 || !a.available;
                const bFull = (b.maxPatients - b.bookedCount) <= 0 || !b.available;
                return Number(aFull) - Number(bFull);
              }).map((w) => {
                const remaining = w.maxPatients - w.bookedCount;
                const isFull = remaining <= 0 || !w.available;
                const value = windowFirstSlot(w);
                const isSelected = selectedTime === value;

                return (
                  <motion.button
                    key={`${w.start}-${w.end}`}
                    type="button"
                    disabled={isFull}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onTimeChange(value)}
                    className={`relative px-4 py-2.5 rounded-full border text-center transition-all ${
                      isFull
                        ? 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-sm cursor-pointer active:scale-95'
                    }`}
                  >
                    <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {w.label}
                    </span>
                    <span className={`block text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {formatTime(w.start)} – {formatTime(w.end)}
                    </span>
                    <span className={`block text-[9px] font-bold mt-0.5 ${isFull ? 'text-red-400' : isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {isFull ? 'FULL' : `${remaining} spot${remaining !== 1 ? 's' : ''}`}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center">
              <p className="text-sm font-semibold text-slate-500">No slots available for this date.</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting another day.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Continue Button */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 z-20">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={onSelect}
            disabled={!canContinue}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continue to Confirmation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
