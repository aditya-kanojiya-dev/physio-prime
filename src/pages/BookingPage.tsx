import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Doctor, ConsultationMode, Symptom } from '../types';
import { ConditionStep } from '../components/booking/ConditionStep';
import { DoctorStep } from '../components/booking/DoctorStep';
import { ScheduleStep } from '../components/booking/ScheduleStep';
import { ConfirmStep } from '../components/booking/ConfirmStep';
import { fadeUp } from '../lib/motion';
import { useAuth } from '../context/AuthContext';

interface BookingState {
  condition?: Symptom;
  doctor?: Doctor;
  mode?: ConsultationMode;
  date?: string;
  time?: string;
}

const STEPS = [
  { num: 1, label: 'Condition' },
  { num: 2, label: 'Doctor' },
  { num: 3, label: 'Schedule' },
  { num: 4, label: 'Confirm' },
];

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as BookingState) || {};
  const { user, hydrated, openAuthModal } = useAuth();

  // Gate: require login before showing booking flow
  useEffect(() => {
    if (hydrated && !user) openAuthModal();
  }, [hydrated, user, openAuthModal]);

  // Determine starting step from route state
  const initialStep = useMemo(() => {
    if (state.doctor) return 3;
    if (state.condition) return 2;
    return 1;
  }, []);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep as 1 | 2 | 3 | 4);
  const [condition, setCondition] = useState<Symptom | null>(state.condition || null);
  const [doctor, setDoctor] = useState<Doctor | null>(state.doctor || null);
  const [mode, setMode] = useState<ConsultationMode>(state.mode || 'home');
  const [selectedDate, setSelectedDate] = useState(state.date || '');
  const [selectedTime, setSelectedTime] = useState(state.time || '');

  const goNext = () => setStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4);
  const goBack = () => setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3 | 4);

  return (
    <div className="pt-28 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Auth gate */}
        {!hydrated && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {hydrated && !user && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">Log in to continue</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">
              You need an account to book an appointment. Log in or create one to proceed.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Log in
            </button>
          </div>
        )}

        {hydrated && user && (<>
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((s, i) => {
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;
              return (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-12 sm:w-20 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300 ${
                        isCompleted ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={fadeUp(16)}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {step === 1 && (
              <ConditionStep
                onSelect={(sym) => {
                  setCondition(sym);
                  goNext();
                }}
              />
            )}

            {step === 2 && (
              <DoctorStep
                symptom={condition}
                mode={mode}
                onModeChange={setMode}
                onSelect={(doc) => {
                  setDoctor(doc);
                  goNext();
                }}
                onBack={goBack}
              />
            )}

            {step === 3 && doctor && (
              <ScheduleStep
                doctor={doctor}
                mode={mode}
                symptom={condition}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
                onSelect={goNext}
                onBack={goBack}
              />
            )}

            {step === 4 && doctor && (
              <ConfirmStep
                doctor={doctor}
                mode={mode}
                symptom={condition}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onBack={goBack}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </>)}
      </div>
    </div>
  );
};
